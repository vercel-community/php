const path = require('path');
const {
  createLambda,
  rename,
  shouldServe,
} = require('@now/build-utils');
const {
  getPhpFiles,
  getLauncherFiles,
  getIncludedFiles,
  getComposerFiles
} = require('./utils');

// ###########################
// EXPORTS
// ###########################

exports.analyze = ({ files, entrypoint }) => files[entrypoint].digest;

exports.shouldServe = shouldServe;

exports.build = async ({
  files, entrypoint, workPath, config = {}, meta = {},
}) => {
  const bridgeFiles = {
    ...await getPhpFiles({ meta }),
    ...await getLauncherFiles({ meta }),
  };

  let includedFiles = await getIncludedFiles({ files, workPath, config, meta });

  // Try to install composer deps only on lambda,
  // not in the local now dev mode.
  if (!meta.isDev) {
    // @todo call composer only if composer.json exists
    includedFiles = { ...includedFiles, ...await getComposerFiles({ workPath, config }) };
  }

  const userFiles = rename(includedFiles, name => path.join('user', name));

  if (process.env.NOW_PHP_DEBUG === '1') {
    console.log('🐘 Entrypoint:', entrypoint);
    console.log('🐘 Config:', config);
    console.log('🐘 Work path:', workPath);
    console.log('🐘 Meta:', meta);
    console.log('🐘 User files:', Object.keys(userFiles));
    console.log('🐘 Bridge files:', Object.keys(bridgeFiles));
    console.log('🐘 PHP: php.ini', bridgeFiles['php/php.ini'].data.toString());
  }

  const lambda = await createLambda({
    files: { ...userFiles, ...bridgeFiles },
    handler: 'launcher.launcher',
    runtime: 'nodejs8.10',
    environment: {
      NOW_ENTRYPOINT: entrypoint,
      NOW_PHP_DEV: meta.isDev ? '1' : '0'
    },
  });

  return { [entrypoint]: lambda };
};
