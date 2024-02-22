import path from 'path';
import { spawn, SpawnOptions } from 'child_process';
import { File, FileFsRef, FileBlob } from '@vercel/build-utils';
import * as libphp from "@libphp/amazon-linux-2-v83";

const PHP_PKG = path.dirname(require.resolve('@libphp/amazon-linux-2-v83/package.json'));
const PHP_BIN_DIR = path.join(PHP_PKG, "native/php");
const PHP_MODULES_DIR = path.join(PHP_BIN_DIR, "modules");
const PHP_LIB_DIR = path.join(PHP_PKG, "native/lib");
const COMPOSER_BIN = path.join(PHP_BIN_DIR, "composer");

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

export function getLauncherFiles(): RuntimeFiles {
  const files: RuntimeFiles = {
    'helpers.js': new FileFsRef({
      fsPath: path.join(__dirname, 'launchers/helpers.js'),
    })
  }

  files['launcher.js'] = new FileFsRef({
    fsPath: path.join(__dirname, 'launchers/builtin.js'),
  });

  return files;
}

export async function modifyPhpIni(userFiles: UserFiles, runtimeFiles: RuntimeFiles): Promise<FileBlob | undefined> {
  // Validate user files contains php.ini
  if (!userFiles['api/php.ini']) return;

  // Validate runtime contains php.ini
  if (!runtimeFiles['php/php.ini']) return;

  const phpiniBlob = await FileBlob.fromStream({
    stream: runtimeFiles['php/php.ini'].toStream(),
  });

  const userPhpiniBlob = await FileBlob.fromStream({
    stream: userFiles['api/php.ini'].toStream(),
  });

  return new FileBlob({
    data: phpiniBlob.data.toString()
      .concat("; [User]\n")
      .concat(userPhpiniBlob.data.toString())
  });
}

export async function runComposerInstall(workPath: string): Promise<void> {
  console.log('🐘 Installing Composer dependencies [START]');

  // @todo PHP_COMPOSER_INSTALL env
  await runPhp(
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
    {
      stdio: 'inherit',
      cwd: workPath
    }
  );

  console.log('🐘 Installing Composer dependencies [DONE]');
}

export async function runComposerScripts(composerFile: File, workPath: string): Promise<void> {
  let composer;

  try {
    composer = JSON.parse(await readRuntimeFile(composerFile));
  } catch (e) {
    console.error('🐘 Composer file is not valid JSON');
    console.error(e);
    return;
  }

  if (composer?.scripts?.vercel) {
    console.log('🐘 Running composer scripts [START]');

    await runPhp(
      [COMPOSER_BIN, 'run', 'vercel'],
      {
        stdio: 'inherit',
        cwd: workPath
      }
    );

    console.log('🐘 Running composer scripts [DONE]');
  }
}

export async function ensureLocalPhp(): Promise<boolean> {
  try {
    await spawnAsync('which', ['php', 'php-cgi'], { stdio: 'pipe' });
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

// *****************************************************************************
// PRIVATE API *****************************************************************
// *****************************************************************************

async function runPhp(args: ReadonlyArray<string>, opts: SpawnOptions = {}) {
  try {
    await spawnAsync('php', args,
      {
        ...opts,
        env: {
          ...process.env,
          ...(opts.env || {}),
          COMPOSER_HOME: '/tmp',
          PATH: `${PHP_BIN_DIR}:${process.env.PATH}`,
          PHP_INI_EXTENSION_DIR: PHP_MODULES_DIR,
          PHP_INI_SCAN_DIR: `:${path.resolve(__dirname, '../conf')}`,
          LD_LIBRARY_PATH: `${PHP_LIB_DIR}:/usr/lib64:/lib64:${process.env.LD_LIBRARY_PATH}`
        }
      }
    );
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

function spawnAsync(command: string, args: ReadonlyArray<string>, opts: SpawnOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "ignore",
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
