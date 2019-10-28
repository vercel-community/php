const helpers = require('../../dist/helpers');

test('transform to AWS response', () => {
  const response = helpers.transformToAwsResponse({
    statusCode: 200,
    headers: [],
    body: "foo"
  });

  expect(response.body).toBe("foo");
});
