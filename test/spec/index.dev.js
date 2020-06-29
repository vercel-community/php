const builder = require('./../../dist/index');

test('it should failed using now dev', async () => {
  const mockLog = console.log = jest.fn();

  jest.spyOn(process, 'exit').mockImplementation((code) => {
      expect(code).toBe(255);
      expect(mockLog).toHaveBeenCalledTimes(1);
  });

  await builder.build({
    files: [],
    entrypoint: 'test.php',
    workPath: __dirname,
    config: {},
    meta: { isDev: true },
  });
});
