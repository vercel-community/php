import path from 'path';
import { spawn } from 'child_process';
import {
  glob,
  download,
  FileFsRef,
  FileBlob,
  BuildOptions
} from '@now/build-utils';

const PHP_BIN_DIR = path.join(__dirname, "..", "lib", "php");
const PHP_MODULES_DIR = path.join(PHP_BIN_DIR, "modules");
const PHP_LIB_DIR = path.join(__dirname, "..", "lib", "lib");
const COMPOSER_BIN = path.join(PHP_BIN_DIR, "composer");

export async function getIncludedFiles({ files, entrypoint, workPath, config, meta }: BuildOptions): Promise<Files> {
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

export async function getPhpFiles({ meta }: MetaOptions): Promise<Files> {
  const files = await getPhpLibFiles();

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

export async function getPhpLibFiles(): Promise<Files> {
  // Lookup for PHP bins, modules and shared objects

  const files: Files = {
    ...await glob('php/**', { cwd: path.join(__dirname, '..', 'lib') }),
    ...await glob('lib/**', { cwd: path.join(__dirname, '..', 'lib') }),
  };

  // Replace paths in php.ini file
  const phpini = await FileBlob.fromStream({
    stream: files['php/php.ini'].toStream(),
  });

  phpini.data = phpini.data
    .toString()
    .replace(/\/opt\/now\/modules/g, '/var/task/php/modules');
  files['php/php.ini'] = phpini;

  return files;
}

export function getLauncherFiles({ meta }: MetaOptions): Files {
  const files: Files = {
    'helpers.js': new FileFsRef({
      fsPath: path.join(__dirname, 'launchers/helpers.js'),
    })
  }

  if (meta && meta.isDev) {
    files['launcher.js'] = new FileFsRef({
      fsPath: path.join(__dirname, 'launchers/cgi.js'),
    });
  } else {
    files['launcher.js'] = new FileFsRef({
      fsPath: path.join(__dirname, 'launchers/server.js'),
    });
  }

  return files;
}

export async function getComposerFiles(workPath: string): Promise<Files> {
  console.log('🐘 Installing Composer deps.');

  // Install composer dependencies
  await runComposerInstall(workPath);

  console.log('🐘 Installing Composer deps OK.');

  return await glob('vendor/**', workPath);
}

async function runComposerInstall(cwd: string) {
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

async function runPhp(cwd: string, args: any[]) {
  try {
    await spawnAsync(
      'php',
      [`-dextension_dir=${PHP_MODULES_DIR}`, ...args],
      cwd,
      {
        env: { ...process.env, ...{
          COMPOSER_HOME: '/tmp',
          PATH: `${PHP_BIN_DIR}:${process.env.PATH}`,
          LD_LIBRARY_PATH: `${PHP_LIB_DIR}:/usr/lib64:/lib64:${process.env.LD_LIBRARY_PATH}`
        }}
      }
    );
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

export async function ensureLocalPhp(): Promise<boolean> {
  try {
    await spawnAsync('which', ['php'], undefined, { stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

function spawnAsync(command: string, args: any[], cwd?: string, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "ignore",
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
