import path from 'path';
import {
  createLambda,
  rename,
  shouldServe,
  BuildOptions,
  FileBlob,
  debug
} from '@now/build-utils';
import {
  getPhpFiles,
  getLauncherFiles,
  getIncludedFiles,
  getComposerFiles,
  ensureLocalPhp
} from './utils';

// ###########################
// EXPORTS
// ###########################

export async function build({
  files,
  entrypoint,
  workPath,
  config = {},
  meta = {},
}: BuildOptions) {

  // Collect included files
  let includedFiles = await getIncludedFiles({ files, entrypoint, workPath, config, meta });

  // Try to install composer deps only on lambda,
  // not in the local now dev mode.
  if (!meta.isDev) {
    // Composer is called only if composer.json is provided,
    // or config.composer is TRUE
    if (includedFiles['composer.json'] || config.compose === true) {
      includedFiles = { ...includedFiles, ...await getComposerFiles(workPath) };
    }
  } else {
    if (!(await ensureLocalPhp())) {
      debug(`
        It looks like you don't have PHP on your machine.
        Learn more about how to run now dev on your machine.
        https://err.sh/juicyfx/now-php/now-dev-no-local-php
      `)
    }
  }

  // Move all user files to LAMBDA_ROOT/user folder.
  const userFiles = rename(includedFiles, name => path.join('user', name));

  // Merge PHP files (bins + shared object)
  // and launcher files (server for lambda, cgi for now dev)
  const bridgeFiles: Files = {
    ...await getPhpFiles({ meta }),
    ...getLauncherFiles({ meta }),
  };

  if (process.env.NOW_PHP_DEBUG === '1') {
    debug('🐘 Entrypoint:', entrypoint);
    debug('🐘 Config:', config);
    debug('🐘 Work path:', workPath);
    debug('🐘 Meta:', meta);
    debug('🐘 User files:', Object.keys(userFiles));
    debug('🐘 Bridge files:', Object.keys(bridgeFiles));
    debug('🐘 PHP: php.ini', (bridgeFiles['php/php.ini'] as FileBlob).data.toString());
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

export { shouldServe };
