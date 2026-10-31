// Real CLI dispatch test, with local builder cache and no Vercel account/API.
// TEST_VERCEL_CLI=/path/to/vercel/dist/vc.js TEST_PHP_EXECUTABLE=/path/to/php node test/integration/vercel-dev.js
const assert = require('assert/strict');
const fs = require('fs/promises');
const path = require('path');
const http = require('http');
const net = require('net');
const { spawn, spawnSync } = require('child_process');

const root = path.resolve(__dirname, '../..');
const cli = process.env.TEST_VERCEL_CLI;
const php = process.env.TEST_PHP_EXECUTABLE || 'php';
if (!cli || spawnSync(php, ['-n', '-v']).status !== 0) {
  console.error('CLI integration skipped: set TEST_VERCEL_CLI and install PHP or set TEST_PHP_EXECUTABLE.');
  process.exit(0);
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
async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
async function run(mode) {
  const fixtures = path.join(root, '.local/cli-tests');
  await fs.mkdir(fixtures, { recursive: true });
  const cwd = await fs.mkdtemp(path.join(fixtures, `${mode}-`));
  let child;
  let output = '';
  try {
    await fs.mkdir(path.join(cwd, 'api'));
    await fs.writeFile(path.join(cwd, 'api/php.ini'), 'precision=12\n');
    const phpSource = `<?php
header('Content-Type: application/json');
header('X-Endpoint: index');
echo json_encode(['endpoint'=>'index', 'uri'=>$_SERVER['REQUEST_URI'],
'method'=>$_SERVER['REQUEST_METHOD'], 'query'=>$_GET, 'form'=>$_POST,
'body'=>base64_encode(file_get_contents('php://input')),
'env'=>getenv('CLI_TEST_VALUE'), 'precision'=>ini_get('precision')]);`;
    await fs.writeFile(path.join(cwd, 'api/index.php'), phpSource);
    await fs.writeFile(path.join(cwd, 'api/other.php'), '<?php echo "other endpoint";');
    await fs.mkdir(path.join(cwd, 'api/nested'));
    await fs.writeFile(path.join(cwd, 'api/nested/deep.php'), '<?php echo "nested endpoint";');
    await fs.writeFile(path.join(cwd, 'asset.txt'), 'CLI static asset');
    // Prepopulate exactly the cache that the unmodified CLI's importBuilders reads.
    const cache = path.join(cwd, '.vercel/builders/node_modules/vercel-php');
    await fs.mkdir(cache, { recursive: true });
    await fs.writeFile(path.join(cache, 'package.json'), JSON.stringify({ name: 'vercel-php', version: '0.9.0', main: 'index.js' }));
    await fs.writeFile(path.join(cache, 'index.js'), `module.exports = require(${JSON.stringify(path.join(root, 'dist/index.js'))});\n`);
    const config = mode === 'functions'
      ? { functions: { 'api/**/*.php': { runtime: 'vercel-php@0.9.0' } } }
      : { builds: [{ src: 'api/**/*.php', use: 'vercel-php@0.9.0' }, { src: 'asset.txt', use: '@vercel/static' }] };
    config.routes = [
      { src: '/rewrite/(.*)', dest: '/api/index.php?captured=$1' },
      { handle: 'filesystem' },
      { src: '/front/(.*)', dest: '/api/index.php' },
    ];
    await fs.writeFile(path.join(cwd, 'vercel.json'), JSON.stringify(config));
    await fs.writeFile(path.join(cwd, '.env'), 'CLI_TEST_VALUE=from-dotenv\n');
    // Isolate configuration and refuse any accidental network/API calls.
    const globalConfig = path.join(cwd, '.local-global-config');
    await fs.mkdir(globalConfig);
    const api = http.createServer((req, res) => { res.writeHead(500); res.end('Unexpected API call'); });
    let apiCalls = 0;
    api.on('request', () => apiCalls++);
    await new Promise(resolve => api.listen(0, '127.0.0.1', resolve));
    const port = await freePort();
    const env = { ...process.env, VERCEL_PHP_EXECUTABLE: php, __VERCEL_SKIP_DEV_CMD: '1', VERCEL_TELEMETRY_DISABLED: '1', NO_UPDATE_NOTIFIER: '1' };
    try {
      child = spawn(process.execPath, [path.resolve(cli), 'dev', '--listen', `127.0.0.1:${port}`, '--debug', '--global-config', globalConfig, '--token', 'offlineTestNotARealToken', '--api', `http://127.0.0.1:${api.address().port}`], { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
      child.stdout.on('data', data => { output += data; });
      child.stderr.on('data', data => { output += data; });
      child.on('error', error => { output += error.message; });
      const deadline = Date.now() + 60000;
      while (!/Ready!/.test(output)) {
        if (child.exitCode !== null || Date.now() > deadline) throw new Error(`CLI did not become ready:\n${output}`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      const direct = await request(port, '/api/index.php?name=two%20words');
      assert.equal(direct.status, 200, direct.body.toString());
      assert.equal(direct.headers['x-endpoint'], 'index');
      assert.equal(direct.headers.server, 'Vercel');
      assert.deepEqual(JSON.parse(direct.body).query, { name: 'two words' });
      assert.equal(JSON.parse(direct.body).env, 'from-dotenv');
      assert.equal(JSON.parse(direct.body).precision, '12');
      const rewritten = JSON.parse((await request(port, '/rewrite/hello?original=yes')).body);
      assert.equal(rewritten.endpoint, 'index');
      assert.equal(rewritten.query.captured, 'hello');
      assert.equal(rewritten.query.original, 'yes');
      assert.match(rewritten.uri, /^\/rewrite\/hello\?/);
      const form = JSON.parse((await request(port, '/front/form', 'POST', 'name=two+words', { 'Content-Type': 'application/x-www-form-urlencoded' })).body);
      assert.deepEqual(form.form, { name: 'two words' });
      assert.equal(form.method, 'POST');
      const bytes = Buffer.from([0, 255, 1, 128, 13, 10]);
      const binary = JSON.parse((await request(port, '/front/binary', 'PUT', bytes, { 'Content-Type': 'application/octet-stream' })).body);
      assert.equal(binary.body, bytes.toString('base64'));
      const others = await Promise.all(Array.from({ length: 4 }, () => request(port, '/api/other.php')));
      others.forEach(other => assert.equal(other.body.toString(), 'other endpoint'));
      assert.equal((await request(port, '/api/nested/deep.php')).body.toString(), 'nested endpoint');
      assert.equal((await request(port, '/asset.txt')).body.toString(), 'CLI static asset');
      assert.equal((await request(port, '/missing')).status, 404);
      assert.equal(apiCalls, 0, 'CLI must not use a remote API');
      assert.match(output, /Proxying to "vercel-php" dev server/);
      const phpPids = [...output.matchAll(/Proxying to "vercel-php" dev server \(port=(\d+), pid=(\d+)\)/g)].map(match => ({ port: Number(match[1]), pid: Number(match[2]) }));
      assert.equal(phpPids.length, 9, 'CLI must dispatch each PHP request through the hook');
      await new Promise(resolve => setTimeout(resolve, 200));
      for (const server of phpPids) {
        await assert.rejects(request(server.port, '/'), 'CLI must shut down each PHP server after its response');
      }
      console.log(`${mode}: real Vercel CLI dispatch, rewrites, GET/query/form/binary, concurrent endpoints, static files, env/ini and request-scoped shutdown passed`);
    } catch (error) {
      console.error(`CLI output:\n${output}`);
      throw error;
    } finally {
      await new Promise(resolve => api.close(resolve));
    }
  } finally {
    if (child && child.exitCode === null) {
      const closed = new Promise(resolve => child.once('close', resolve));
      child.kill();
      await closed;
    }
    await fs.rm(cwd, { recursive: true, force: true });
  }
}
(async () => { await run('builds'); await run('functions'); })().catch(error => { console.error(error); process.exitCode = 1; });
