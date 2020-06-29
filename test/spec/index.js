const builder = require('./../../dist/index');

test('creates simple lambda', async (done) => {
  await builder.build({
    files: [],
    entrypoint: 'test.php',
    workPath: __dirname,
    config: {},
    meta: {},
  });

  done();
});
