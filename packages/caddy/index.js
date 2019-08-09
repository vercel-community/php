const path = require('path');
const {
  createLambda,
  shouldServe,
  rename,
} = require('@now/build-utils');
const FileFsRef = require('@now/build-utils/file-fs-ref.js');
const {
  getPhpFiles,
  getIncludedFiles
} = require('now-php/dist/utils');

// ###########################
// EXPORTS
// ###########################

exports.config = {
  maxLambdaSize: '45mb',
};

exports.analyze = ({ files, entrypoint }) => files[entrypoint].digest;

exports.shouldServe = shouldServe;

exports.build = async ({
  files, entrypoint, workPath, config, meta,
}) => {
  const includedFiles = await getIncludedFiles({ files, workPath, config, meta });

  const userFiles = rename(includedFiles, name => path.join('user', name));

  const bridgeConfig = { ...config, ...{ 'mode': 'fpm' }  };
  const bridgeFiles = {
    ...await getPhpFiles({ workPath, config: bridgeConfig }),
    ...{
      'launcher.js': new FileFsRef({
        fsPath: path.join(__dirname, 'launcher.js'),
      }),
      'caddy': new FileFsRef({
        mode: 0o755,
        fsPath: path.join(__dirname, 'caddy/caddy'),
      }),
      'Caddyfile': new FileFsRef({
        fsPath: path.join(__dirname, 'caddy/Caddyfile'),
      }),
    }
  };

  console.log('Entrypoint:', entrypoint);
  console.log('Config:', bridgeConfig);
  console.log('Work path:', workPath);
  console.log('Meta:', meta);
  console.log('User files:', Object.keys(userFiles));
  console.log('Bridge files:', Object.keys(bridgeFiles));

  const lambda = await createLambda({
    files: { ...userFiles, ...bridgeFiles },
    handler: 'launcher.launcher',
    runtime: 'nodejs10.x',
    environment: {
      NOW_ENTRYPOINT: entrypoint,
    },
  });

  return { [entrypoint]: lambda };
};
