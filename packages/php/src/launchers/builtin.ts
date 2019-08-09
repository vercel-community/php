import http from 'http';
import { spawn, ChildProcess, SpawnOptions } from 'child_process';
import { dirname as pathDirname } from 'path';
import net from 'net';
import {
  getPhpDir,
  normalizeEvent,
  transformFromAwsRequest,
  transformToAwsResponse,
  isDev,
  getUserDir
} from './helpers';

let server: ChildProcess;

async function startServer(filename: string): Promise<ChildProcess> {
  // take only dirname
  // /var/task/user/foo/bar.php
  // /var/task/user/foo
  const docRoot = pathDirname(filename);

  console.log(`🐘 Spawning: PHP Built-In Server at ${docRoot}`);

  // php spawn options
  const options: SpawnOptions = {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: process.env
  };

  // now vs now-dev
  if (!isDev()) {
    options.env!.PATH = `${getPhpDir()}:${process.env.PATH}`;
    options.cwd = getPhpDir();
  } else {
    options.cwd = getUserDir();
  }

  server = spawn(
    'php',
    ['-c', 'php.ini', '-S', '127.0.0.1:8000', '-t', docRoot],
    options,
  );

  server.on('close', function (code, signal) {
    console.log(`🐘 PHP Built-In Server process closed code ${code} and signal ${signal}`);
  });

  server.on('error', function (err) {
    console.error(`🐘 PHP Built-In Server process errored ${err}`);
  });

  await whenPortOpens(8000, 400);

  process.on('exit', () => {
    server.kill();
  })

  return server;
}

async function query({ filename, uri, headers, method, body }: PhpInput): Promise<PhpOutput> {
  if (!server) {
    await startServer(filename);
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
      const chunks: Uint8Array[] = [];

      res.on('data', (data) => {
        chunks.push(data);
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 200,
          headers: res.headers,
          body: Buffer.concat(chunks)
        });
      });
    });

    req.on('error', (error) => {
      console.error('🐘 PHP Built-In Server HTTP errored', error);
      resolve({
        body: Buffer.from(`PHP Built-In Server HTTP error: ${error}`),
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

function whenPortOpensCallback(port: number, attempts: number, cb: (error?: string) => void) {
  const client = net.connect(port, '127.0.0.1');
  client.on('error', (error: string) => {
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

function whenPortOpens(port: number, attempts: number): Promise<void> {
  return new Promise((resolve, reject) => {
    whenPortOpensCallback(port, attempts, (error?: string) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

async function launcher(event: Event): Promise<AwsResponse> {
  const awsRequest = normalizeEvent(event);
  const input = await transformFromAwsRequest(awsRequest);
  const output = await query(input);
  return transformToAwsResponse(output);
}

exports.launcher = launcher;

// (async function () {
//   const response = await launcher({
//       Action: "test",
//       httpMethod: "GET",
//       body: "",
//       path: "/",
//       host: "https://zeit.co",
//       headers: {
//           'HOST': 'zeit.co'
//       },
//       encoding: null,
//   });

//   console.log(response);
// })();
