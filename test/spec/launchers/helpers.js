const path = require('path');
const {
  getUserDir, getPhpDir, normalizeEvent, transformFromAwsRequest, transformToAwsResponse,
} = require('../../../dist/launchers/helpers');

const binary = [0, 65, 128, 255];
const request = { method: 'POST', path: '/submit?a=1&b=%2F', headers: { host: 'example.com' } };
const direct = (body, extra = {}) => ({
  httpMethod: request.method, path: request.path, headers: request.headers, body, ...extra,
});
const invoke = (body, extra = {}) => ({
  Action: 'Invoke', body: JSON.stringify({ ...request, body, ...extra }),
});

for (const [name, event] of [['direct', direct], ['Invoke', invoke]]) {
  describe(`${name} normalization`, () => {
    test.each([
      ['UTF-8', 'héllo', {}, Buffer.from('héllo')],
      ['bytes', binary, {}, Buffer.from(binary)],
      ['empty string', '', {}, Buffer.alloc(0)],
      ['empty array', [], {}, Buffer.alloc(0)],
      ['null', null, {}, undefined],
      ['missing', undefined, {}, undefined],
      ['base64', Buffer.from(binary).toString('base64'),
        name === 'direct' ? { isBase64Encoded: true } : { encoding: 'base64' }, Buffer.from(binary)],
      ['decoded bytes with base64 flag', binary,
        name === 'direct' ? { isBase64Encoded: true } : { encoding: 'base64' }, Buffer.from(binary)],
    ])('%s body', (_label, body, extra, expected) => {
      const normalized = normalizeEvent(event(body, extra));
      expect(normalized).toEqual({ ...request, host: 'example.com', body: expected });
      expect(normalized.path).toBe(request.path);
    });

    test.each([{}, 1, true, [-1], [256], [1.5], ['65'], [null]])('rejects invalid body %j', body => {
      expect(() => normalizeEvent(event(body))).toThrow('Request body');
    });

    test('host fallback is case insensitive and prefers forwarded host', () => {
      const normalized = normalizeEvent(event(null, {
        headers: { Host: 'internal', 'X-Forwarded-Host': ['public.example', 'other'] },
      }));
      expect(normalized.host).toBe('public.example');
    });

    test('explicit host wins and missing headers are accepted', () => {
      expect(normalizeEvent(event(null, { host: 'explicit', headers: null })).host).toBe('explicit');
      expect(normalizeEvent(event(null, { headers: undefined })).headers).toEqual({});
    });
  });
}

test('preserves Buffers, including when base64 flag is set', () => {
  const body = Buffer.from(binary);
  expect(normalizeEvent(direct(body)).body).toBe(body);
  expect(normalizeEvent(direct(body, { isBase64Encoded: true })).body).toBe(body);
});

test('rejects sparse byte arrays rather than converting holes to zeros', () => {
  expect(() => normalizeEvent(direct(new Array(2)))).toThrow('Request body');
});

test.each([NaN, Infinity, -Infinity])('rejects non-finite bytes %j', byte => {
  expect(() => normalizeEvent(direct([byte]))).toThrow('Request body');
});

test.each([false, null, undefined])('direct base64 flag %j keeps text as UTF-8', isBase64Encoded => {
  expect(normalizeEvent(direct('héllo', { isBase64Encoded })).body).toEqual(Buffer.from('héllo'));
});

test.each([null, [], 'text', {}, { httpMethod: 1, path: '/' }, { httpMethod: 'GET', path: 1 }])(
  'rejects malformed event %j', event => {
    expect(() => normalizeEvent(event)).toThrow(TypeError);
  }
);

test.each([
  { headers: [] }, { headers: { host: 123 } }, { headers: { host: [null] } },
  { host: {} }, { isBase64Encoded: 'true' },
])('rejects invalid request fields %j', fields => {
  expect(() => normalizeEvent(direct(null, fields))).toThrow(TypeError);
});

test.each([null, {}, 'null', '[]', '"text"'])('rejects malformed Invoke envelope %j', body => {
  expect(() => normalizeEvent({ Action: 'Invoke', body })).toThrow(TypeError);
});

test('rejects malformed Invoke JSON', () => {
  expect(() => normalizeEvent({ Action: 'Invoke', body: '{' })).toThrow(SyntaxError);
});

test.each([undefined, null, 'utf8'])('accepts legacy UTF-8 encoding %j', encoding => {
  expect(normalizeEvent(invoke('héllo', { encoding })).body).toEqual(Buffer.from('héllo'));
});

test('rejects unsupported legacy encoding even for an empty body', () => {
  expect(() => normalizeEvent(invoke('', { encoding: 'hex' }))).toThrow('Unsupported encoding');
});

describe('task root', () => {
  const originalRoot = process.env.LAMBDA_TASK_ROOT;
  const originalEntrypoint = process.env.NOW_ENTRYPOINT;
  afterEach(() => {
    if (originalRoot === undefined) delete process.env.LAMBDA_TASK_ROOT;
    else process.env.LAMBDA_TASK_ROOT = originalRoot;
    if (originalEntrypoint === undefined) delete process.env.NOW_ENTRYPOINT;
    else process.env.NOW_ENTRYPOINT = originalEntrypoint;
  });

  test.each([undefined, '', '/custom/task'])('root %j resolves PHP and user paths', async root => {
    if (root === undefined) delete process.env.LAMBDA_TASK_ROOT;
    else process.env.LAMBDA_TASK_ROOT = root;
    const expectedRoot = root || '/var/task';
    expect(getUserDir()).toBe(path.join(expectedRoot, 'user'));
    expect(getPhpDir()).toBe(path.join(expectedRoot, 'php'));
    process.env.NOW_ENTRYPOINT = 'api/index.php';
    const normalized = normalizeEvent(direct(Buffer.from(binary)));
    const input = await transformFromAwsRequest(normalized);
    expect(input.entrypoint).toBe(path.join(expectedRoot, 'user', 'api/index.php'));
    expect(input.uri).toBe('example.com' + request.path);
    expect(input.body).toBe(normalized.body);
    expect(process.env.LAMBDA_TASK_ROOT).toBe(root);
  });
});

test('preserves response cookies and binary bytes', () => {
  const headers = { 'set-cookie': ['a=1; HttpOnly', 'b=2; Secure'] };
  const response = transformToAwsResponse({ statusCode: 200, headers, body: Buffer.from(binary) });
  expect(response.headers).toBe(headers);
  expect(response.encoding).toBe('base64');
  expect(Buffer.from(response.body, response.encoding)).toEqual(Buffer.from(binary));
});
