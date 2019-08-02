import { spawn } from 'child_process';
import { parse as urlParse } from 'url';
import {
  isDev,
  getUserDir,
  normalizeEvent,
  transformFromAwsRequest,
  transformToAwsResponse
} from './helpers';

function createCGIReq({ filename, path, host, method, headers }: CgiInput): CgiRequest {
  const { query } = urlParse(path);

  const env: Env = {
    SERVER_ROOT: getUserDir(),
    DOCUMENT_ROOT: getUserDir(),
    SERVER_NAME: host,
    SERVER_PORT: 443,
    HTTPS: "On",
    REDIRECT_STATUS: 200,
    SCRIPT_NAME: filename,
    REQUEST_URI: path,
    SCRIPT_FILENAME: filename,
    PATH_TRANSLATED: filename,
    REQUEST_METHOD: method,
    QUERY_STRING: query || '',
    GATEWAY_INTERFACE: "CGI/1.1",
    SERVER_PROTOCOL: "HTTP/1.1",
    PATH: process.env.PATH,
    SERVER_SOFTWARE: "ZEIT Now PHP",
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

function query({ filename, path, host, headers, method, body }: PhpInput): Promise<PhpOutput> {
  console.log(`🐘 Spawning: PHP CGI ${filename}`);

  const { env } = createCGIReq({ filename, path, host, headers, method })

  return new Promise((resolve) => {
    const chunks: Uint8Array[] = [];

    const php = spawn(
      'php-cgi',
      [filename],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
        env
      },
    );

    // Output
    php.stdout.on('data', function (data) {
      chunks.push(data);
    });

    // Logging
    php.stderr.on('data', function (data) {
      console.error(`🐘 STDERR`, data.toString());
    });

    // PHP script execution end
    php.on('close', function (code, signal) {
      if (code !== 0) {
        console.log(`🐘 PHP process closed code ${code} and signal ${signal}`);
      }

      const { headers, body, statusCode } = parseCGIResponse(Buffer.concat(chunks));

      resolve({
        body,
        headers,
        statusCode
      });
    });

    php.on('error', function (err) {
      resolve({
        body: Buffer.from(`PHP process errored ${err}`),
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
  if (!isDev) {
    return transformToAwsResponse({
      statusCode: 500,
      headers: {},
      body: Buffer.from('PHP CGI is allowed only for now dev')
    })
  };

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
//       host: "https://zeit.co",
//       headers: {
//           'HOST': 'zeit.co'
//       },
//       encoding: null,
//   });

//   console.log(response);
// })();
