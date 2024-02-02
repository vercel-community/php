import http from 'http';
import { spawn, ChildProcess, SpawnOptions } from 'child_process';
import net from 'net';
import {
  getPhpDir,
  getUserDir,
  normalizeEvent,
  transformFromAwsRequest,
  transformToAwsResponse,
  isDev
} from './helpers';
import { join as pathJoin } from 'path';

let server: ChildProcess;

async function startServer(entrypoint: string): Promise<ChildProcess> {
  // Resolve document root and router
  const router = entrypoint;
  const docroot = pathJoin(getUserDir(), process.env.VERCEL_PHP_DOCROOT ?? '');

  console.log(`🐘 Spawning: PHP Built-In Server at ${docroot} (document root) and ${router} (router)`);

  // php spawn options
  const options: SpawnOptions = {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      LD_LIBRARY_PATH: `/var/task/lib:${process.env.LD_LIBRARY_PATH}`
    }
  };

  // now vs now-dev
  if (!isDev()) {
    options.env!.PATH = `${getPhpDir()}:${process.env.PATH}`;
    options.cwd = getPhpDir();
  } else {
    options.cwd = getUserDir();
  }

  // We need to start PHP built-in server with following setup:
  // php -c php.ini -S ip:port -t /var/task/user /var/task/user/foo/bar.php
  //
  // Path to document root lambda task folder with user prefix, because we move all
  // user files to this folder.
  //
  // Path to router is absolute path, because CWD is different.
  //
  server = spawn(
    'php',
    ['-c', 'php.ini', '-S', '127.0.0.1:8000', '-t', docroot, router],
    options,
  );

  server.stdout?.on('data', data => {
    console.log(`🐘STDOUT: ${data.toString()}`);
  });

  server.stderr?.on('data', data => {
    console.error(`🐘STDERR: ${data.toString()}`);
  });

  server.on('close', function (code, signal) {
    console.log(`🐘 PHP Built-In Server process closed code ${code} and signal ${signal}`);
  });

  server.on('error', function (err) {
    console.error(`🐘 PHP Built-In Server process errored ${err}`);
  });

  await whenPortOpens(8000, 500);

  process.on('exit', () => {
    server.kill();
  })

  return server;
}

async function query({ entrypoint, uri, path, headers, method, body }: PhpInput): Promise<PhpOutput> {
  if (!server) {
    await startServer(entrypoint);
  }

  return new Promise(resolve => {
    const options = {
      hostname: '127.0.0.1',
      port: 8000,
      path,
      method,
      headers,
    };

    console.log(`🐘 Accessing ${uri}`);
    console.log(`🐘 Querying ${path}`);

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
    }, 10);
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
//     Action: "test",
//     httpMethod: "GET",
//     body: "",
//     path: "/",
//     host: "https://vercel.com",
//     headers: {
//       'HOST': 'vercel.com'
//     },
//     encoding: null,
//   });

//   console.log(response);
// })();
