const fs = require('fs');
const path = require('path');
const { FileBlob, Lambda, NodejsLambda } = require('@vercel/build-utils');
const utils = require('../../dist/utils');
const builder = require('../../dist/index');

test('builder preserves Node launcher metadata without reserved environment variables', async () => {
  // PHP binary collection is outside this regression and currently fails on Windows.
  // Keep the real builder, Node version selection, file collection and Lambda classes.
  const phpFiles = jest.spyOn(utils, 'getPhpFiles').mockResolvedValue({
    'php/php': new FileBlob({ data: 'PHP fixture' }),
  });
  const workPath = fs.mkdtempSync(path.join(__dirname, 'launcher-fixture-'));
  try {
    fs.writeFileSync(path.join(workPath, 'index.php'), '<?php echo "hello";');
    const { output } = await builder.build({
      files: {}, entrypoint: 'index.php', workPath, config: {}, meta: {},
    });
    expect(output).toBeInstanceOf(NodejsLambda);
    expect(output).toMatchObject({
      handler: 'launcher.js', launcherType: 'Nodejs', awsLambdaHandler: 'launcher.launcher',
      shouldAddHelpers: false, shouldAddSourcemapSupport: false,
      environment: { NOW_ENTRYPOINT: 'index.php', NOW_PHP_DEV: '0' },
    });
    expect(output.environment).not.toHaveProperty('LAMBDA_TASK_ROOT');
    expect(output.files).toHaveProperty(['launcher.js']);
    expect(output.files).toHaveProperty(['helpers.js']);
    expect(output.files).toHaveProperty([path.join('user', 'index.php')]);
    expect(JSON.parse(JSON.stringify(output))).toMatchObject({
      handler: 'launcher.js', launcherType: 'Nodejs', awsLambdaHandler: 'launcher.launcher',
      shouldAddHelpers: false, shouldAddSourcemapSupport: false,
    });
    expect(require('../../dist/launchers/builtin').launcher).toEqual(expect.any(Function));
  } finally {
    phpFiles.mockRestore();
    fs.rmSync(workPath, { recursive: true, force: true });
  }
});

test('generic Lambda does not forward Node launcher metadata', () => {
  const output = new Lambda({
    files: {}, runtime: 'nodejs22.x', handler: 'launcher.js',
    launcherType: 'Nodejs', awsLambdaHandler: 'launcher.launcher',
  });
  expect(output).not.toHaveProperty('launcherType');
  expect(output).not.toHaveProperty('awsLambdaHandler');
});
