const utils = require('./../../dist/utils');
const builder = require('./../../dist/index');

process.env.NOW_BUILDER_DEBUG = 1;

test('PHP is not installed', async () => {
    global.console = {
        log: jest.fn()
    }

    utils.ensureLocalPhp = jest.fn();

    await builder.build({
        files: [],
        entrypoint: 'test.php',
        workPath: __dirname,
        config: {},
        meta: { isDev: true },
    });

    expect(global.console.log).toHaveBeenCalledTimes(1);
});
