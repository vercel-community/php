const cgi = require('./../../../dist/launchers/cgi');

test('create CGI request', () => {
  const request = {
    entrypoint: "index.php",
    path: "/index.php",
    host: "https://vercel.com",
    method: "GET",
    headers: {}
  };
  process.env.CUSTOM_VALUE = "custom-value";
  const { env } = cgi.createCGIReq(request);

  expect(env).toHaveProperty("SERVER_ROOT", "/user");
  expect(env).toHaveProperty("DOCUMENT_ROOT", "/user");
  expect(env).toHaveProperty("SERVER_NAME", request.host);
  expect(env).toHaveProperty("SERVER_PORT", 443);
  expect(env).toHaveProperty("HTTPS", 'On');
  expect(env).toHaveProperty("REDIRECT_STATUS", 200);
  expect(env).toHaveProperty("SCRIPT_NAME", request.entrypoint);
  expect(env).toHaveProperty("REQUEST_URI", request.path);
  expect(env).toHaveProperty("SCRIPT_FILENAME", request.entrypoint);
  expect(env).toHaveProperty("PATH_TRANSLATED", request.entrypoint);
  expect(env).toHaveProperty("REQUEST_METHOD", request.method);
  expect(env).toHaveProperty("QUERY_STRING", '');
  expect(env).toHaveProperty("GATEWAY_INTERFACE", 'CGI/1.1');
  expect(env).toHaveProperty("SERVER_PROTOCOL", 'HTTP/1.1');
  expect(env).toHaveProperty("SERVER_SOFTWARE", 'Vercel PHP');
  expect(env).toHaveProperty("PATH", process.env.PATH);
  expect(env).toHaveProperty("LD_LIBRARY_PATH", process.env.LD_LIBRARY_PATH);
  expect(env).toHaveProperty("CUSTOM_VALUE", process.env.CUSTOM_VALUE);
});
