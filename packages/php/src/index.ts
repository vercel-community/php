import path from 'path';
import {
  createLambda,
  rename,
  shouldServe,
  BuildOptions,
  FileBlob,
  PrepareCacheOptions,
  glob
} from '@now/build-utils';
import {
  getPhpFiles,
  getLauncherFiles,
  getIncludedFiles,
  getComposerFiles,
  ensureLocalPhp,
  modifyPhpIni
} from './utils';

// ###########################
// EXPORTS
// ###########################

export const version = 3;

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
    if (includedFiles['composer.json'] || config.composer === true) {
      includedFiles = { ...includedFiles, ...await getComposerFiles(workPath) };
    }
  } else {
    if (!(await ensureLocalPhp())) {
      console.log(`
        It looks like you don't have PHP on your machine.
        Learn more about how to run now dev on your machine.
        https://err.sh/juicyfx/now-php/now-dev-no-local-php
      `)
    }
  }

  // Move all user files to LAMBDA_ROOT/user folder.
  const userFiles = rename(includedFiles, name => path.join('user', name));

  // Bridge files contains PHP bins and libs
  let bridgeFiles: Files = {};

  // Append PHP files (bins + shared object)
  bridgeFiles = { ...bridgeFiles, ...await getPhpFiles({ meta }) };

  // Append launcher files (server for lambda, cgi for now dev)
  bridgeFiles = { ...bridgeFiles, ...getLauncherFiles({ meta }) };

  // Append custom directives into php.ini
  if (config['php.ini']) {
    bridgeFiles['php/php.ini'] = modifyPhpIni((bridgeFiles['php/php.ini'] as FileBlob), (config['php.ini'] as PhpIni));
  }

  if (process.env.NOW_PHP_DEBUG === '1') {
    console.log('🐘 Entrypoint:', entrypoint);
    console.log('🐘 Config:', config);
    console.log('🐘 Work path:', workPath);
    console.log('🐘 Meta:', meta);
    console.log('🐘 User files:', Object.keys(userFiles));
    console.log('🐘 Bridge files:', Object.keys(bridgeFiles));
    console.log('🐘 PHP: php.ini', (bridgeFiles['php/php.ini'] as FileBlob).data.toString());
  }

  const lambda = await createLambda({
    files: {
      ...userFiles,
      ...bridgeFiles
    },
    handler: 'launcher.launcher',
    runtime: 'nodejs8.10',
    environment: {
      NOW_ENTRYPOINT: entrypoint,
      NOW_PHP_DEV: meta.isDev ? '1' : '0'
    },
  });

  return { output: lambda };
};

export async function prepareCache({ workPath }: PrepareCacheOptions): Promise<Files> {
  return {
    // Composer
    ...(await glob('vendor/**', workPath)),
    ...(await glob('composer.lock', workPath)),
    // NPM
    ...(await glob('node_modules/**', workPath)),
    ...(await glob('package-lock.json', workPath)),
    ...(await glob('yarn.lock', workPath)),
  };
}

export { shouldServe };
