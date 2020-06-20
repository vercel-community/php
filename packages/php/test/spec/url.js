const url = require('url');

test('url.parse search & query are string', () => {
  const { search, query } = url.parse('https://vercel.com/?foo=bar&foo2=baz#foo');
  expect(search).toBe('?foo=bar&foo2=baz');
  expect(query).toBe('foo=bar&foo2=baz');
});

test('url.parse search string, query object', () => {
  const { search, query } = url.parse('https://vercel.com/?foo=bar&foo2=baz#foo', true);
  expect(search).toBe('?foo=bar&foo2=baz');
  expect(query).toMatchObject({ foo: 'bar', 'foo2': 'baz' });
});
