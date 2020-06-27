const builder = require('./../../dist/index');

test('it should failed using now dev', async () => {
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { });

  await builder.build({
    files: [],
    entrypoint: 'test.php',
    workPath: __dirname,
    config: {},
    meta: { isDev: true },
  });

  expect(mockExit).toHaveBeenCalledWith(255);
});
