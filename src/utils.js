const path = require('path');
const { spawn } = require('child_process');
const {
  glob,
  download
} = require('@now/build-utils');
const launchers = require('./launchers');
const php = require('./php');

const PHP_BIN_DIR = path.join(__dirname, "php/php");
const PHP_MODULES_DIR = path.join(__dirname, "php/php/modules");
const PHP_LIB_DIR = path.join(__dirname, "php/lib");
const COMPOSER_BIN = path.join(PHP_BIN_DIR, "composer");

async function getPhpFiles({ meta }) {
  const files = await php.getPhpFiles();

  if (meta && meta.isDev) {
    delete files['php/php'];
    delete files['php/php-fpm'];
    delete files['php/php-fpm.ini'];
  } else {
    delete files['php/php-cgi'];
    delete files['php/php-fpm'];
    delete files['php/php-fpm.ini'];
  }

  return files;
}

function getLauncherFiles({ meta }) {
  return launchers.getFiles({ meta });
}

async function getIncludedFiles({ files, workPath, config, meta }) {
  // Download all files to workPath
  const downloadedFiles = await download(files, workPath, meta);

  let includedFiles = {};
  if (config && config.includeFiles) {
    // Find files for each glob
    for (const pattern of config.includeFiles) {
      const matchedFiles = await glob(pattern, workPath);
      Object.assign(includedFiles, matchedFiles);
    }
    // explicit and always include the entrypoint
    Object.assign(includedFiles, {
      [entrypoint]: files[entrypoint],
    });
  } else {
    // Backwards compatibility
    includedFiles = downloadedFiles;
  }

  return includedFiles;
}

async function getComposerFiles({ workPath, config }) {
  if (!config || config.composer !== true) {
    console.log('🐘 Skip Composer (config.composer not provided)');
    return [];
  }

  console.log('🐘 Installing Composer deps.');

  // Install composer dependencies
  await runComposerInstall(workPath);

  console.log('🐘 Installing Composer deps OK.');

  return await glob('vendor/**', workPath);
}

async function runComposerInstall(cwd) {
  // @todo think about allow to pass custom commands here
  await runPhp(cwd,
    [
      COMPOSER_BIN,
      'install',
      '--profile',
      '--no-dev',
      '--no-interaction',
      '--no-scripts',
      '--ignore-platform-reqs'
    ],
  );
}

async function runPhp(cwd, args) {
  try {
    await spawnAsync(
      'php',
      [
        `-dextension_dir=${PHP_MODULES_DIR}`,
        ...args
      ],
      cwd,
      {
        env: {
          COMPOSER_HOME: '/tmp',
          PATH: `${PHP_BIN_DIR}:${process.env.PATH}`,
          LD_LIBRARY_PATH: `${PHP_LIB_DIR}:/usr/lib64:/lib64:${process.env.LD_LIBRARY_PATH}`
        }
      }
    );
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

function spawnAsync(command, args, cwd, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd,
      ...opts
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Exited with ${code || signal}`));
      }
    });
  })
}

module.exports = {
  getPhpFiles,
  getLauncherFiles,
  getIncludedFiles,
  getComposerFiles,
  // Special functions!
  runComposerInstall,
  runPhp,
};

// (async () => {
//   await runComposerInstall(process.env.NOW_PHP);
// })();
