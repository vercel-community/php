import { join as pathJoin } from 'path';

// The Node bootstrap may omit LAMBDA_TASK_ROOT. PHP's bundled ini and shared
// library paths also use /var/task, so keep the fallback consistent with them.
const getTaskRoot = (): string => process.env.LAMBDA_TASK_ROOT || '/var/task';
export const getUserDir = (): string => pathJoin(getTaskRoot(), 'user');
export const getPhpDir = (): string => pathJoin(getTaskRoot(), 'php');
export const isDev = (): boolean => process.env.NOW_PHP_DEV === '1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && Array.from(value).every(item => typeof item === 'string');
}

function isByteArray(value: unknown): value is number[] {
  return Array.isArray(value) && Array.from(value).every(item =>
    typeof item === 'number' && Number.isInteger(item) && item >= 0 && item <= 255
  );
}

function normalizeBody(body: unknown, encoding: unknown): Buffer | undefined {
  if (encoding !== undefined && encoding !== null && encoding !== 'utf8' && encoding !== 'base64') {
    throw new Error(`Unsupported encoding: ${encoding}`);
  }
  if (body === undefined || body === null) return undefined;
  // Buffers and byte arrays are already decoded, even if the encoding flag is set.
  if (Buffer.isBuffer(body)) return body;
  if (isByteArray(body)) return Buffer.from(body);
  if (typeof body === 'string') {
    return Buffer.from(body, encoding === 'base64' ? 'base64' : 'utf8');
  }
  throw new TypeError('Request body must be a string, Buffer, or array of bytes');
}

function normalizeHeaders(value: unknown): Headers {
  if (value === undefined || value === null) return {};
  if (!isRecord(value)) throw new TypeError('Request headers must be an object');
  const headers: Headers = {};
  for (const [name, header] of Object.entries(value)) {
    if (header !== undefined && typeof header !== 'string' && !isStringArray(header)) {
      throw new TypeError(`Invalid request header: ${name}`);
    }
    Object.defineProperty(headers, name, { value: header, enumerable: true });
  }
  return headers;
}

function getHeader(headers: Headers, name: string): string | undefined {
  const key = Object.keys(headers).find(key => key.toLowerCase() === name);
  const value = key === undefined ? undefined : headers[key];
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeEvent(event: unknown): AwsRequest {
  if (!isRecord(event)) throw new TypeError('Request event must be an object');
  const isInvoke = event.Action === 'Invoke';
  let request = event;
  if (isInvoke) {
    if (typeof event.body !== 'string') throw new TypeError('Invoke body must be JSON text');
    const parsed: unknown = JSON.parse(event.body);
    if (!isRecord(parsed)) throw new TypeError('Invoke body must contain a request object');
    request = parsed;
  }

  const method = isInvoke ? request.method : request.httpMethod;
  const { path } = request;
  if (typeof method !== 'string' || typeof path !== 'string') {
    throw new TypeError('Request method and path must be strings');
  }
  if (request.host !== undefined && request.host !== null && typeof request.host !== 'string') {
    throw new TypeError('Request host must be a string');
  }
  const headers = normalizeHeaders(request.headers);
  const host = request.host || getHeader(headers, 'x-forwarded-host') || getHeader(headers, 'host') || '';

  if (!isInvoke && request.isBase64Encoded !== undefined &&
      request.isBase64Encoded !== null && typeof request.isBase64Encoded !== 'boolean') {
    throw new TypeError('isBase64Encoded must be a boolean');
  }
  const encoding = isInvoke ? request.encoding : request.isBase64Encoded === true ? 'base64' : 'utf8';
  return { method, path, host, headers, body: normalizeBody(request.body, encoding) };
}

export async function transformFromAwsRequest({
  method, path, host, headers, body,
}: AwsRequest): Promise<PhpInput> {
  if (!process.env.NOW_ENTRYPOINT) {
    console.error('Missing ENV NOW_ENTRYPOINT');
  }

  const entrypoint = pathJoin(
    getUserDir(),
    process.env.NOW_ENTRYPOINT || 'index.php',
  );

  const uri = host + path;

  return { entrypoint, uri, path, host, method, headers, body };
}

export function transformToAwsResponse({ statusCode, headers, body }: PhpOutput): AwsResponse {
  return { statusCode, headers, body: body.toString('base64'), encoding: 'base64' };
}
