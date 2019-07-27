const http = require('http');
const { spawn } = require('child_process');
const { parse } = require('url');
const { join: pathJoin, dirname: pathDirname } = require('path');
const net = require('net');

const PHP_DIR = pathJoin(process.env.LAMBDA_TASK_ROOT, 'php');
const USER_DIR = pathJoin(process.env.LAMBDA_TASK_ROOT, 'user');

let connection;

function normalizeEvent(event) {
  if (event.Action === 'Invoke') {
    const invokeEvent = JSON.parse(event.body);

    const {
      method, path, headers = {}, encoding,
    } = invokeEvent;

    let { body } = invokeEvent;

    if (body) {
      if (encoding === 'base64') {
        body = Buffer.from(body, encoding);
      } else if (encoding === undefined) {
        body = Buffer.from(body);
      } else {
        throw new Error(`Unsupported encoding: ${encoding}`);
      }
    }

    return {
      method,
      path,
      headers,
      body,
    };
  }

  const {
    httpMethod: method, path, headers = {}, body,
  } = event;

  return {
    method,
    path,
    headers,
    body,
  };
}

async function transformFromAwsRequest({
  method, path, headers, body,
}) {
  const { pathname, search } = parse(path);

  const filename = pathJoin(
    USER_DIR,
    process.env.NOW_ENTRYPOINT || pathname,
  );

  const uri = pathname + (search || '');

  return { filename, uri, method, headers, body };
}

async function startServer({ filename }) {
  const docRoot = pathDirname(filename);
  console.log(`🐘 Spawning: PHP Server at ${docRoot}`);

  const server = spawn(
    'php',
    ['-c', 'php.ini', '-S', '127.0.0.1:8000', '-t', docRoot],
    {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: PHP_DIR,
      env: {
        ...process.env,
        PATH: `${PHP_DIR}:${process.env.PATH}`
      }
    },
  );

  server.on('close', function (code, signal) {
    console.log(`🐘 PHP process closed code ${code} and signal ${signal}`);
  });

  server.on('error', function (err) {
    console.error(`🐘 PHP process errored ${err}`);
  });

  await whenPortOpens(8000, 400);

  process.on('exit', () => {
    server.kill();
    server = null;
  })

  connection = server;
}

async function query({ filename, uri, headers, method, body }) {
  if (!connection) {
    await startServer({ filename });
  }

  return new Promise(resolve => {
    const options = {
      hostname: '127.0.0.1',
      port: 8000,
      path: `${uri}`,
      method,
      headers,
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (d) => {
        data += d;
      });
      res.on('end', () => {
        resolve({
          body: data,
          headers: res.headers,
          statusCode: res.statusCode
        });
      });
    });

    req.on('error', (error) => {
      console.error('🐘 HTTP errored', error);
      resolve({
        body: 'HTTP error',
        headers: {},
        statusCode: 500
      });
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

function whenPortOpensCallback(port, attempts, cb) {
  const client = net.connect(port, '127.0.0.1');
  client.on('error', (error) => {
    if (!attempts) return cb(error);
    setTimeout(() => {
      whenPortOpensCallback(port, attempts - 1, cb);
    }, 50);
  });
  client.on('connect', () => {
    client.destroy();
    cb();
  });
}

function whenPortOpens(port, attempts) {
  return new Promise((resolve, reject) => {
    whenPortOpensCallback(port, attempts, (error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

function transformToAwsResponse({ body, headers, statusCode }) {
  return {
    statusCode,
    headers,
    body
  };
}

async function launcher(event) {
  const awsRequest = normalizeEvent(event);
  const input = await transformFromAwsRequest(awsRequest);
  const output = await query(input);
  return transformToAwsResponse(output);
}

exports.launcher = launcher;

// (async function() {
//   console.log(await launcher({
//     httpMethod: 'GET',
//     path: '/index.php'
//   }));
// })();
