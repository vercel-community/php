import path from 'path';
import {
  createLambda,
  rename,
  shouldServe,
  BuildOptions,
  PrepareCacheOptions,
  glob,
  download
} from '@vercel/build-utils';
import {
  getPhpFiles,
  getLauncherFiles,
  getComposerFiles,
  ensureLocalPhp,
  readRuntimeFile,
  modifyPhpIni,
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
  console.log('🐘 Downloading user files...');

  // Collect included files
  let includedFiles: RuntimeFiles = await download(files, workPath, meta);

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
        https://err.sh/juicyfx/vercel-php/now-dev-no-local-php
      `)
    }
  }

  // Move all user files to LAMBDA_ROOT/user folder.
  const userFiles = rename(includedFiles, name => path.join('user', name));

  // Bridge files contains PHP bins and libs
  const runtimeFiles: RuntimeFiles = {
    // Append PHP files (bins + shared object)
    ...await getPhpFiles(),

    // Append launcher files (server for lambda, cgi for now dev, common helpers)
    ...getLauncherFiles({ meta }),
  };

  // Append PHP directives into php.ini
  if (config['php.ini'] || userFiles['user/api/php.ini']) {
    await modifyPhpIni({ config, runtimeFiles, userFiles });
  }

  // Show some debug notes during build
  if (process.env.NOW_PHP_DEBUG === '1') {
    console.log('🐘 Entrypoint:', entrypoint);
    console.log('🐘 Config:', config);
    console.log('🐘 Work path:', workPath);
    console.log('🐘 Meta:', meta);
    console.log('🐘 User files:', Object.keys(userFiles));
    console.log('🐘 Runtime files:', Object.keys(runtimeFiles));
    console.log('🐘 PHP: php.ini', await readRuntimeFile(runtimeFiles['php/php.ini']));
  }

  const lambda = await createLambda({
    files: {
      // Located at /var/task/user
      ...userFiles,
      // Located at /var/task/php (php bins + ini + modules)
      // Located at /var/task/lib (shared libs)
      ...runtimeFiles
    },
    handler: 'launcher.launcher',
    runtime: 'nodejs12.x',
    environment: {
      NOW_ENTRYPOINT: entrypoint,
      NOW_PHP_DEV: meta.isDev ? '1' : '0'
    },
  });

  return { output: lambda };
};

export async function prepareCache({ workPath }: PrepareCacheOptions): Promise<RuntimeFiles> {
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
