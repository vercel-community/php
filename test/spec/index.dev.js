const fs = require('fs/promises');
const path = require('path');
const net = require('net');
const http = require('http');
const { spawnSync } = require('child_process');
const builder = require('../../dist/index');

const executable = process.env.TEST_PHP_EXECUTABLE || 'php';
const hasPhp = spawnSync(executable, ['-n', '-v']).status === 0;
const phpTest = hasPhp ? test : test.skip;
if (!hasPhp) console.warn('PHP integration tests skipped: set TEST_PHP_EXECUTABLE or install PHP on PATH.');
let workPath;
let servers;

beforeEach(async () => {
  const root = path.resolve(__dirname, '../../.local/tests');
  await fs.mkdir(root, { recursive: true });
  workPath = await fs.mkdtemp(path.join(root, 'dev-'));
  servers = [];
  await fs.mkdir(path.join(workPath, 'api'));
  await fs.writeFile(path.join(workPath, 'api/php.ini'), 'precision=12\n');
  await fs.writeFile(path.join(workPath, 'api/index.php'), `<?php
if (parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) === '/asset.txt') return false;
header('Content-Type: application/json');
header('X-PHP-Test: yes');
file_put_contents('php://stdout', "request log\\n");
echo json_encode([
  'endpoint' => 'index', 'method' => $_SERVER['REQUEST_METHOD'],
  'uri' => $_SERVER['REQUEST_URI'], 'query' => $_GET, 'form' => $_POST,
  'body' => base64_encode(file_get_contents('php://input')),
  'env' => getenv('PHP_TEST_VALUE'), 'precision' => ini_get('precision'),
  'cwd' => getcwd(), 'workers' => getenv('PHP_CLI_SERVER_WORKERS')
]);`);
  await fs.writeFile(path.join(workPath, 'api/other.php'), '<?php echo "other";');
  await fs.writeFile(path.join(workPath, 'asset.txt'), 'static asset');
});

afterEach(async () => {
  await Promise.all(servers.map(server => server.shutdown()));
  await fs.rm(workPath, { recursive: true, force: true });
});

function options(extra = {}) {
  return {
    files: {}, entrypoint: 'api/index.php', workPath, repoRootPath: workPath,
    config: {}, meta: { isDev: true, env: { VERCEL_PHP_EXECUTABLE: executable, PHP_TEST_VALUE: 'local', PHP_CLI_SERVER_WORKERS: '4' } },
    onStdout: () => {}, onStderr: () => {}, ...extra,
  };
}
async function start(extra) {
  const server = await builder.startDevServer(options(extra));
  servers.push(server);
  return server;
}
function request(port, url, method = 'GET', body, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: url, method, headers }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.setTimeout(5000, () => req.destroy(new Error('Request timed out')));
    req.end(body);
  });
}

test('exports BuildV3 hook and prevents local Linux packaging without exiting', async () => {
  expect(builder.version).toBe(3);
  expect(typeof builder.startDevServer).toBe('function');
  await expect(builder.build(options())).rejects.toThrow('startDevServer');
});

test('reports missing local PHP clearly and cleans up exit handlers', async () => {
  const count = process.listenerCount('exit');
  await expect(builder.startDevServer(options({ meta: { env: { VERCEL_PHP_EXECUTABLE: path.join(workPath, 'missing-php') } } })))
    .rejects.toThrow('Install PHP CLI');
  expect(process.listenerCount('exit')).toBe(count);
});

phpTest('serves GET/query, form and binary bodies, headers, local ini and environment', async () => {
  const original = { ...process.env };
  const stderr = [];
  const stdout = [];
  const server = await start({ onStderr: data => stderr.push(data), onStdout: data => stdout.push(data) });
  const get = await request(server.port, '/hello?name=two%20words');
  expect(get.status).toBe(200);
  expect(get.headers['x-php-test']).toBe('yes');
  const data = JSON.parse(get.body);
  expect(data).toMatchObject({ endpoint: 'index', method: 'GET', uri: '/hello?name=two%20words', query: { name: 'two words' }, env: 'local', precision: '12', workers: false });
  expect(path.resolve(data.cwd)).toBe(workPath);
  const form = JSON.parse((await request(server.port, '/form', 'POST', 'name=two+words', { 'Content-Type': 'application/x-www-form-urlencoded' })).body);
  expect(form.form).toEqual({ name: 'two words' });
  const body = Buffer.from([0, 255, 1, 128, 13, 10]);
  const binary = JSON.parse((await request(server.port, '/binary', 'PUT', body, { 'Content-Type': 'application/octet-stream' })).body);
  expect(binary.method).toBe('PUT');
  expect(binary.body).toBe(body.toString('base64'));
  expect(stderr.length).toBeGreaterThan(0);
  expect(Buffer.concat(stdout).toString()).toContain('request log');
  expect(process.env).toEqual(original);
});

phpTest('uses independent available ports and shuts down only its own processes', async () => {
  const occupied = net.createServer();
  await new Promise((resolve, reject) => {
    occupied.once('error', reject);
    occupied.listen(0, '127.0.0.1', resolve);
  });
  try {
    const [first, second] = await Promise.all([start(), start({ entrypoint: 'api/other.php' })]);
    expect(first.port).not.toBe(occupied.address().port);
    expect(first.port).not.toBe(second.port);
    expect((await request(second.port, '/api/other.php')).body.toString()).toBe('other');
    await first.shutdown();
    await first.shutdown();
    await expect(request(first.port, '/')).rejects.toThrow();
    expect((await request(second.port, '/')).body.toString()).toBe('other');
    expect(occupied.listening).toBe(true);
  } finally {
    await new Promise(resolve => occupied.close(resolve));
  }
});

phpTest('allows router-controlled static passthrough and explicit document root', async () => {
  await fs.mkdir(path.join(workPath, 'public'));
  await fs.writeFile(path.join(workPath, 'public/asset.txt'), 'public asset');
  const server = await start({ meta: { env: { VERCEL_PHP_EXECUTABLE: executable, VERCEL_PHP_DOCROOT: 'public' } } });
  expect((await request(server.port, '/asset.txt')).body.toString()).toBe('public asset');
});

phpTest('uses publicDir when there is no document root override', async () => {
  await fs.mkdir(path.join(workPath, 'public'));
  await fs.writeFile(path.join(workPath, 'public/asset.txt'), 'public asset');
  const server = await start({ publicDir: path.join(workPath, 'public') });
  expect((await request(server.port, '/asset.txt')).body.toString()).toBe('public asset');
});

phpTest('reports startup failure without leaking a PHP child', async () => {
  const count = process.listenerCount('exit');
  await fs.writeFile(path.join(workPath, 'api/php.ini'), 'auto_prepend_file="missing.php"\n');
  // A non-PHP executable exits without PHP's readiness confirmation.
  await expect(builder.startDevServer(options({ meta: { env: { VERCEL_PHP_EXECUTABLE: process.execPath } } })))
    .rejects.toThrow('exited before becoming ready');
  expect(process.listenerCount('exit')).toBe(count);
});

phpTest('normalizes Windows PATH casing overrides without changing global environment', async () => {
  if (process.platform !== 'win32') return;
  const env = { VERCEL_PHP_EXECUTABLE: 'php', pAtH: path.dirname(executable) };
  const server = await start({ meta: { env } });
  expect((await request(server.port, '/')).status).toBe(200);
});
