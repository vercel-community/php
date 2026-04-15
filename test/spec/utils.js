const path = require('path');

describe('php spawn config', () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });
  });

  test('uses bundled runtime configuration on linux', async () => {
    Object.defineProperty(process, 'platform', {
      value: 'linux',
    });

    const utils = require(path.join(__dirname, '..', '..', 'dist', 'utils.js'));
    const config = await utils.getPhpSpawnConfig({ TEST_ENV: '1' });

    expect(config.command).toBe('php');
    expect(config.env.TEST_ENV).toBe('1');
    expect(config.env.PATH).toContain(`@libphp${path.sep}almalinux-9-v85`);
    expect(config.env.PATH).toContain(path.delimiter);
    expect(config.env.PHP_INI_EXTENSION_DIR).toContain(`${path.sep}modules`);
    expect(config.env.PHP_INI_SCAN_DIR).toContain(`${path.sep}conf`);
    expect(config.env.LD_LIBRARY_PATH).toContain('/usr/lib64:/lib64');
  });
});
