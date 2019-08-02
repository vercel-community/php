import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import { dirname as pathDirname } from 'path';
import net from 'net';

import {
  normalizeEvent,
  transformFromAwsRequest,
  transformToAwsResponse,
  getPhpDir
} from './helpers';

let server: ChildProcess;

async function startServer(filename: string): Promise<ChildProcess> {
  const docRoot = pathDirname(filename);
  console.log(`🐘 Spawning: PHP Server at ${docRoot}`);

  server = spawn(
    'php',
    ['-c', 'php.ini', '-S', '127.0.0.1:8000', '-t', docRoot],
    {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: getPhpDir(),
      env: {
        ...process.env,
        PATH: `${getPhpDir()}:${process.env.PATH}`
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
      console.error('🐘 HTTP errored', error);
      resolve({
        body: Buffer.from(`HTTP error: ${error}`),
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
