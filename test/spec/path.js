const path = require('path');

test('relative path', () => {
  const rootdir = '/var/task/user';
  const request = '/var/task/user/api/users.php';
  const file = path.relative(rootdir, request);

  expect(file).toBe('api/users.php');
});
