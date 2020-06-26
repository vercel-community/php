import path from 'path';
import { spawn } from 'child_process';
import {
  glob,
  download,
  File,
  FileFsRef,
  FileBlob,
  BuildOptions
} from '@vercel/build-utils';
import * as libphp from "@libphp/amazon-linux-2-v74";

const PHP_PKG = path.dirname(require.resolve('@libphp/amazon-linux-2-v74/package.json'));
const PHP_BIN_DIR = path.join(PHP_PKG, "native/php");
const PHP_MODULES_DIR = path.join(PHP_BIN_DIR, "modules");
const PHP_LIB_DIR = path.join(PHP_PKG, "native/lib");
const COMPOSER_BIN = path.join(PHP_BIN_DIR, "composer");

export async function getIncludedFiles({ files, entrypoint, workPath, config, meta }: BuildOptions): Promise<RuntimeFiles> {
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

export async function getPhpFiles(): Promise<RuntimeFiles> {
  const files = await libphp.getFiles();

  // Drop CGI + FPM from libphp, it's not needed for our case
  delete files['php/php-cgi'];
  delete files['php/php-fpm'];
  delete files['php/php-fpm.ini'];

  const runtimeFiles: RuntimeFiles = {};

  // Map from @libphp to Vercel's File objects
  for (const [filename, filepath] of Object.entries(files)) {
    runtimeFiles[filename] = new FileFsRef({
      fsPath: filepath
    })
  }

  // Set some bins executable
  (runtimeFiles['php/php'] as FileFsRef).mode = 33261; // 0755;
  (runtimeFiles['php/composer'] as FileFsRef).mode = 33261; // 0755;

  return runtimeFiles;
}

export async function modifyPhpIni({ config, runtimeFiles, userFiles }: PhpIniOptions): Promise<void> {
  // 1. From now.json config[php.ini]
  if (config['php.ini']) {
    runtimeFiles['php/php.ini'] = await modifyPhpIniFromArray(runtimeFiles['php/php.ini'], (config['php.ini'] as PhpIni));
  }

  // 2. From user/api/php.ini
  if (userFiles['user/api/php.ini']) {
    runtimeFiles['php/php.ini'] = await modifyPhpIniFromFile(runtimeFiles['php/php.ini'], userFiles['user/api/php.ini']);
    // Don't include user provided php.ini
    console.log(userFiles);
    delete userFiles['user/api/php.ini'];
    console.log(userFiles);
  }
}

export function getLauncherFiles({ meta }: MetaOptions): RuntimeFiles {
  const files: RuntimeFiles = {
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
      fsPath: path.join(__dirname, 'launchers/builtin.js'),
    });
  }

  return files;
}

export async function getComposerFiles(workPath: string): Promise<RuntimeFiles> {
  console.log('🐘 Installing Composer deps.');

  // Install composer dependencies
  await runComposerInstall(workPath);

  console.log('🐘 Installing Composer deps OK.');

  return await glob('vendor/**', workPath);
}

export async function ensureLocalPhp(): Promise<boolean> {
  try {
    await spawnAsync('which', ['php', 'php-cgi'], undefined, { stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

export async function readRuntimeFile(file: File): Promise<string> {
  const blob = await FileBlob.fromStream({
    stream: file.toStream(),
  });

  return blob.data.toString();
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
      '--ignore-platform-reqs',
      '--no-progress'
    ],
    { stdio: 'inherit' }
  );
}


async function runPhp(cwd: string, args: any[], opts = {}) {
  try {
    await spawnAsync(
      'php',
      [`-dextension_dir=${PHP_MODULES_DIR}`, ...args],
      cwd,
      {
        ...opts,
        ...{
          env: {
            ...process.env,
            ...{
              COMPOSER_HOME: '/tmp',
              PATH: `${PHP_BIN_DIR}:${process.env.PATH}`,
              LD_LIBRARY_PATH: `${PHP_LIB_DIR}:/usr/lib64:/lib64:${process.env.LD_LIBRARY_PATH}`
            }
          }
        }
      }
    );
  } catch (e) {
    console.error(e);
    process.exit(1);
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

export async function modifyPhpIniFromArray(phpini: File, directives: PhpIni): Promise<FileBlob> {
  const output: any[] = [];

  for (const property in directives) {
    output.push(`${property} = ${directives[property]}`);
  }

  const phpiniBlob = await FileBlob.fromStream({
    stream: phpini.toStream(),
  });

  phpiniBlob.data = phpiniBlob.data
    .toString()
    .concat(output.join("\n"));

  return phpiniBlob;
}

export async function modifyPhpIniFromFile(phpini: File, userPhpini: File): Promise<FileBlob> {
  const phpiniBlob = await FileBlob.fromStream({
    stream: phpini.toStream(),
  });

  const userPhpiniBlob = await FileBlob.fromStream({
    stream: userPhpini.toStream(),
  });

  return new FileBlob({
    data: phpiniBlob.data.toString().concat(userPhpiniBlob.data.toString())
  });
}
