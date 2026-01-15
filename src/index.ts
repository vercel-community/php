import path from 'path';
import {
  rename,
  shouldServe,
  glob,
  download,
  Lambda,
  BuildV3,
  PrepareCache,
  getNodeVersion
} from '@vercel/build-utils';
import {
  getPhpFiles,
  getLauncherFiles,
  runComposerInstall,
  runComposerScripts,
  readRuntimeFile,
  modifyPhpIni,
} from './utils';

const COMPOSER_FILE = process.env.COMPOSER || 'composer.json';

// ###########################
// EXPORTS
// ###########################

export const version = 3;

export const build: BuildV3 = async ({
  files,
  entrypoint,
  workPath,
  config = {},
  meta = {},
}) => {
  // Check if now dev mode is used
  if (meta.isDev) {
    console.log(`
      🐘 vercel dev is not supported right now.
      Please use PHP built-in development server.

      php -S localhost:8000 api/index.php
    `);
    process.exit(255);
  }

  console.log('🐘 Downloading user files');

  // Collect user provided files
  const userFiles: RuntimeFiles = await download(files, workPath, meta);

  console.log('🐘 Downloading PHP runtime files');

  // Collect runtime files containing PHP bins and libs
  const runtimeFiles: RuntimeFiles = {
    // Append PHP files (bins + shared object)
    ...await getPhpFiles(),

    // Append launcher files (builtin server, common helpers)
    ...getLauncherFiles(),
  };

  // If composer.json is provided try to
  // - install deps
  // - run composer scripts
  if (userFiles[COMPOSER_FILE]) {
    // Install dependencies (vendor is collected bellow, see harvestedFiles)
    await runComposerInstall(workPath);

    // Run composer scripts (created files are collected bellow, , see harvestedFiles)
    await runComposerScripts(userFiles[COMPOSER_FILE], workPath);
  }

  // Append PHP directives into php.ini
  if (userFiles['api/php.ini']) {
    const phpini = await modifyPhpIni(userFiles, runtimeFiles);
    if (phpini) {
      runtimeFiles['php/php.ini'] = phpini;
    }
  }

  // Collect user files, files creating during build (composer vendor)
  // and other files and prefix them with "user" (/var/task/user folder).
  const harverstedFiles = rename(
    await glob('**', {
      cwd: workPath,
      ignore: [
        '.vercel/**',
        ...(config?.excludeFiles
          ? Array.isArray(config.excludeFiles)
            ? config.excludeFiles
            : [config.excludeFiles]
          : [
              'node_modules/**',
              'now.json',
              '.nowignore',
              'vercel.json',
              '.vercelignore',
            ]),
      ],
    }),
    name => path.join('user', name)
  );

  // Show some debug notes during build
  if (process.env.NOW_PHP_DEBUG === '1') {
    console.log('🐘 Entrypoint:', entrypoint);
    console.log('🐘 Config:', config);
    console.log('🐘 Work path:', workPath);
    console.log('🐘 Meta:', meta);
    console.log('🐘 User files:', Object.keys(harverstedFiles));
    console.log('🐘 Runtime files:', Object.keys(runtimeFiles));
    console.log('🐘 PHP: php.ini', await readRuntimeFile(runtimeFiles['php/php.ini']));
  }

  console.log('🐘 Creating lambda');
  const nodeVersion = await getNodeVersion(workPath);

  const lambda = new Lambda({
    files: {
      // Located at /var/task/user
      ...harverstedFiles,
      // Located at /var/task/php (php bins + ini + modules)
      // Located at /var/task/lib (shared libs)
      ...runtimeFiles
    },
    handler: 'launcher.launcher',
    runtime: nodeVersion.runtime,
    environment: {
      NOW_ENTRYPOINT: entrypoint,
      NOW_PHP_DEV: meta.isDev ? '1' : '0'
    },
  });

  return { output: lambda };
};

export const prepareCache: PrepareCache = async ({ workPath }) => {
  return {
    // Composer
    ...(await glob('vendor/**', workPath)),
    ...(await glob('composer.lock', workPath)),
    // NPM
    ...(await glob('node_modules/**', workPath)),
    ...(await glob('package-lock.json', workPath)),
    ...(await glob('yarn.lock', workPath)),
  };
};

export { shouldServe };
