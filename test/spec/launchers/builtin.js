const http = require('http');
const path = require('path');
const { EventEmitter } = require('events');
const childProcess = require('child_process');

// Replace only the unavailable PHP process with a local HTTP server. The launcher
// still uses its real readiness probe, request forwarding and response conversion.
let upstream;
let spawn;
let launcher;
let received;
let originalEnv;
let exitListeners;

beforeAll(async () => {
  originalEnv = { ...process.env };
  exitListeners = process.listeners('exit');
  delete process.env.LAMBDA_TASK_ROOT;
  process.env.NOW_ENTRYPOINT = 'api/index.php';
  process.env.NOW_PHP_DEV = '0';
  upstream = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      received = { path: req.url, headers: req.headers, method: req.method, body: Buffer.concat(chunks) };
      res.writeHead(200, { 'set-cookie': ['session=abc; HttpOnly', 'csrf=xyz'], 'content-type': 'application/octet-stream' });
      res.end(Buffer.from([0, 128, 255]));
    });
  });
  await new Promise((resolve, reject) => {
    upstream.once('error', reject);
    upstream.listen(3000, '127.0.0.1', resolve);
  });
  spawn = jest.spyOn(childProcess, 'spawn').mockImplementation(() => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = jest.fn();
    return child;
  });
  launcher = require('../../../dist/launchers/builtin').launcher;
});

afterAll(async () => {
  if (spawn) spawn.mockRestore();
  for (const listener of process.listeners('exit')) {
    if (!exitListeners.includes(listener)) process.removeListener('exit', listener);
  }
  process.env = originalEnv;
  if (upstream) {
    upstream.closeAllConnections();
    await new Promise(resolve => upstream.close(resolve));
  }
});

test('direct GET keeps query and cookies with the missing task-root fallback', async () => {
  const response = await launcher({
    httpMethod: 'GET', path: '/login?return=%2Fhome', body: null,
    headers: { host: 'example.com', cookie: 'session=abc' },
  });
  expect(received).toMatchObject({
    method: 'GET', path: '/login?return=%2Fhome', body: Buffer.alloc(0),
    headers: { cookie: 'session=abc', host: 'example.com' },
  });
  expect(spawn).toHaveBeenCalledTimes(1);
  const [command, args, options] = spawn.mock.calls[0];
  expect(command).toBe('php');
  expect(args).toEqual([
    '-c', 'php.ini', '-S', '0.0.0.0:3000', '-t', path.join('/var/task', 'user'),
    path.join('/var/task', 'user', 'api/index.php'),
  ]);
  expect(options.cwd).toBe(path.join('/var/task', 'php'));
  expect(options.env.PATH).toBe(`${path.join('/var/task', 'php')}:${process.env.PATH}`);
  expect(options.env.LD_LIBRARY_PATH).toBe(`/var/task/lib:${process.env.LD_LIBRARY_PATH}`);
  expect(options.env).not.toHaveProperty('LAMBDA_TASK_ROOT');
  expect(response.headers['set-cookie']).toEqual(['session=abc; HttpOnly', 'csrf=xyz']);
  expect(response.encoding).toBe('base64');
  expect(Buffer.from(response.body, 'base64')).toEqual(Buffer.from([0, 128, 255]));
});

test.each([
  ['direct bytes', { httpMethod: 'POST', body: [0, 65, 255] }, Buffer.from([0, 65, 255])],
  ['direct base64', { httpMethod: 'POST', body: 'AEH/', isBase64Encoded: true }, Buffer.from([0, 65, 255])],
  ['direct Buffer', { httpMethod: 'POST', body: Buffer.from([0, 65, 255]) }, Buffer.from([0, 65, 255])],
  ['legacy Invoke', { Action: 'Invoke', body: JSON.stringify({
    method: 'POST', path: '/submit?q=1', headers: { host: 'example.com' }, body: 'AEH/', encoding: 'base64',
  }) }, Buffer.from([0, 65, 255])],
  ['form', { httpMethod: 'POST', body: 'name=h%C3%A9llo', headers: {
    host: 'example.com', 'content-type': 'application/x-www-form-urlencoded',
  } }, Buffer.from('name=h%C3%A9llo')],
  ['multipart', { httpMethod: 'POST', body: '--boundary\r\nContent-Disposition: form-data; name="x"\r\n\r\nvalue\r\n--boundary--\r\n',
    headers: { host: 'example.com', 'content-type': 'multipart/form-data; boundary=boundary' },
  }, Buffer.from('--boundary\r\nContent-Disposition: form-data; name="x"\r\n\r\nvalue\r\n--boundary--\r\n')],
])('%s forwards bytes through the real HTTP client', async (_label, event, expected) => {
  const response = await launcher({ path: '/submit?q=1', headers: { host: 'example.com' }, ...event });
  expect(response.statusCode).toBe(200);
  expect(received.method).toBe('POST');
  expect(received.path).toBe('/submit?q=1');
  expect(received.body).toEqual(expected);
  expect(spawn).toHaveBeenCalledTimes(1);
});
