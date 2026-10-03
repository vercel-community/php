const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');
const vm = require('vm');
const builder = require('../../dist/index');
const utils = require('../../dist/utils');
const { FileBlob } = require('@vercel/build-utils');

// Optional offline integration with the real CLI serializer, without executing
// the CLI entrypoint, reading authentication, or contacting Vercel. Install a CLI
// separately and set VERCEL_CLI_ENTRY to its dist/index.js. Tested with 50.4.5.
const cliEntry = process.env.VERCEL_CLI_ENTRY;
const integrationTest = cliEntry ? test : test.skip;

integrationTest('actual CLI BuildV3 writer preserves launcher configuration', async () => {
  const entry = path.resolve(cliEntry);
  const cliRequire = createRequire(entry);
  const source = fs.readFileSync(entry, 'utf8');
  const start = source.indexOf('async function writeBuildResult(args2)');
  const end = source.indexOf('var import_fs_extra13,', start);
  if (start < 0 || end < 0) throw new Error('Unsupported CLI bundle layout; update the integration loader');
  // Load the unchanged writer functions and supply their real dependencies.
  // This intentionally does not substitute JSON.stringify for the CLI writer.
  const buildUtils = cliRequire('@vercel/build-utils');
  const writeBuildResult = vm.runInNewContext(
    source.slice(start, end) + '\nwriteBuildResult;',
    {
      ...buildUtils,
      join12: path.join, relative5: path.relative, resolve6: path.resolve,
      basename6: path.basename, dirname6: path.dirname, extname: path.extname,
      normalize2: path.posix.normalize, normalizePath2: buildUtils.normalizePath,
      import_fs_extra13: { default: cliRequire('fs-extra') },
    },
    { filename: entry }
  );
  const workPath = fs.mkdtempSync(path.join(__dirname, 'output-fixture-'));
  const outputDir = path.join(workPath, '.vercel', 'output');
  const phpFiles = jest.spyOn(utils, 'getPhpFiles').mockResolvedValue({
    'php/php': new FileBlob({ data: 'PHP fixture' }),
  });
  try {
    fs.writeFileSync(path.join(workPath, 'index.php'), '<?php echo "hello";');
    const buildResult = await builder.build({
      files: {}, entrypoint: 'index.php', workPath, config: {}, meta: {},
    });
    await writeBuildResult({
      repoRootPath: path.resolve(__dirname, '../..'), outputDir, buildResult,
      build: { src: 'api/index.php', use: 'vercel-php' },
      builder, builderPkg: { name: 'vercel-php' }, workPath,
    });
    const functionDir = path.join(outputDir, 'functions', 'api', 'index.php.func');
    const config = JSON.parse(fs.readFileSync(path.join(functionDir, '.vc-config.json'), 'utf8'));
    expect(config).toMatchObject({
      handler: 'launcher.js', launcherType: 'Nodejs', awsLambdaHandler: 'launcher.launcher',
      shouldAddHelpers: false, shouldAddSourcemapSupport: false,
      environment: { NOW_ENTRYPOINT: 'index.php', NOW_PHP_DEV: '0' },
    });
    expect(config.environment).not.toHaveProperty('LAMBDA_TASK_ROOT');
    expect(config).not.toHaveProperty('files');
    expect(config).not.toHaveProperty('type');
    expect(config.filePathMap['launcher.js']).toBe('dist/launchers/builtin.js');
    expect(config.filePathMap['helpers.js']).toBe('dist/launchers/helpers.js');
    expect(fs.readFileSync(path.join(functionDir, 'php', 'php'), 'utf8')).toBe('PHP fixture');
  } finally {
    phpFiles.mockRestore();
    fs.rmSync(workPath, { recursive: true, force: true });
  }
});
