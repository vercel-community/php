import { spawn, SpawnOptions } from 'child_process';
import { parse as urlParse } from 'url';
import {
  getPhpDir,
  getUserDir,
  normalizeEvent,
  transformFromAwsRequest,
  transformToAwsResponse,
  isDev
} from './helpers';

function createCGIReq({ entrypoint, path, host, method, headers }: CgiInput): CgiRequest {
  const { query } = urlParse(path);

  const env: Env = {
    ...process.env,
    SERVER_ROOT: getUserDir(),
    DOCUMENT_ROOT: getUserDir(),
    SERVER_NAME: host,
    SERVER_PORT: 443,
    HTTPS: "On",
    REDIRECT_STATUS: 200,
    SCRIPT_NAME: entrypoint,
    REQUEST_URI: path,
    SCRIPT_FILENAME: entrypoint,
    PATH_TRANSLATED: entrypoint,
    REQUEST_METHOD: method,
    QUERY_STRING: query || '',
    GATEWAY_INTERFACE: "CGI/1.1",
    SERVER_PROTOCOL: "HTTP/1.1",
    PATH: process.env.PATH,
    SERVER_SOFTWARE: "Vercel PHP",
    LD_LIBRARY_PATH: process.env.LD_LIBRARY_PATH
  };

  if (headers["content-length"]) {
    env.CONTENT_LENGTH = headers["content-length"];
  }

  if (headers["content-type"]) {
    env.CONTENT_TYPE = headers["content-type"];
  }

  if (headers["x-real-ip"]) {
    env.REMOTE_ADDR = headers["x-real-ip"];
  }

  // expose request headers
  Object.keys(headers).forEach(function (header) {
    var name = "HTTP_" + header.toUpperCase().replace(/-/g, "_");
    env[name] = headers[header];
  });

  return {
    env
  }
}

function parseCGIResponse(response: Buffer) {
  const headersPos = response.indexOf("\r\n\r\n");
  if (headersPos === -1) {
    return {
      headers: {},
      body: response,
      statusCode: 200
    }
  }

  let statusCode = 200;
  const rawHeaders = response.slice(0, headersPos).toString();
  const rawBody = response.slice(headersPos + 4);

  const headers = parseCGIHeaders(rawHeaders);

  if (headers['status']) {
    statusCode = parseInt(headers['status']) || 200;
  }

  return {
    headers,
    body: rawBody,
    statusCode
  }
}

function parseCGIHeaders(headers: string): CgiHeaders {
  if (!headers) return {}

  const result: CgiHeaders = {}

  for (let header of headers.split("\n")) {
    const index = header.indexOf(':');
    const key = header.slice(0, index).trim().toLowerCase();
    const value = header.slice(index + 1).trim();

    // Be careful about header duplication
    result[key] = value;
  }

  return result
}

function query({ entrypoint, path, host, headers, method, body }: PhpInput): Promise<PhpOutput> {
  console.log(`🐘 Spawning: PHP CGI ${entrypoint}`);

  // Transform lambda request to CGI variables
  const { env } = createCGIReq({ entrypoint, path, host, headers, method })

  // php-cgi spawn options
  const options: SpawnOptions = {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: env
  };

  // now vs now-dev
  if (!isDev()) {
    options.env!.PATH = `${getPhpDir()}:${process.env.PATH}`;
    options.cwd = getPhpDir();
  } else {
    options.cwd = getUserDir();
  }

  return new Promise((resolve) => {
    const chunks: Uint8Array[] = [];

    const php = spawn(
      'php-cgi',
      [entrypoint],
      options,
    );

    // Validate pipes [stdin]
    if (!php.stdin) {
      console.error(`🐘 Fatal error. PHP CGI child process has no stdin.`);
      process.exit(253);
    }

    // Validate pipes [stdout]
    if (!php.stdout) {
      console.error(`🐘 Fatal error. PHP CGI child process has no stdout.`);
      process.exit(254);
    }

    // Validate pipes [stderr]
    if (!php.stderr) {
      console.error(`🐘 Fatal error. PHP CGI child process has no stderr.`);
      process.exit(255);
    }

    // Output
    php.stdout.on('data', data => {
      chunks.push(data);
    });

    // Logging
    php.stderr.on('data', data => {
      console.error(`🐘 PHP CGI stderr`, data.toString());
    });

    // PHP script execution end
    php.on('close', (code, signal) => {
      if (code !== 0) {
        console.log(`🐘 PHP CGI process closed code ${code} and signal ${signal}`);
      }

      const { headers, body, statusCode } = parseCGIResponse(Buffer.concat(chunks));

      resolve({
        body,
        headers,
        statusCode
      });
    });

    php.on('error', err => {
      console.error('🐘 PHP CGI errored', err);
      resolve({
        body: Buffer.from(`🐘 PHP CGI process errored ${err}`),
        headers: {},
        statusCode: 500
      });
    });

    // Writes the body into the PHP stdin
    php.stdin.write(body || '');
    php.stdin.end();
  })
}

async function launcher(event: Event): Promise<AwsResponse> {
  const awsRequest = normalizeEvent(event);
  const input = await transformFromAwsRequest(awsRequest);
  const output = await query(input);
  return transformToAwsResponse(output);
}

exports.createCGIReq = createCGIReq;
exports.launcher = launcher;

// (async function () {
//   const response = await launcher({
//       Action: "test",
//       httpMethod: "GET",
//       body: "",
//       path: "/",
//       host: "https://vercel.com",
//       headers: {
//           'HOST': 'vercel.com'
//       },
//       encoding: null,
//   });

//   console.log(response);
// })();
