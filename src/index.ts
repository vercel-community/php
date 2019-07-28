import path from 'path';
import {
  createLambda,
  rename,
  shouldServe,
  BuildOptions,
  FileBlob
} from '@now/build-utils';
import {
  getPhpFiles,
  getLauncherFiles,
  getIncludedFiles,
  getComposerFiles
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

  // Merge PHP files (bins + shared object)
  // and launcher files (server for lambda, cgi for now dev)
  const bridgeFiles: Files = {
    ...await getPhpFiles({ meta }),
    ...getLauncherFiles({ meta }),
  };

  let includedFiles = await getIncludedFiles({ files, entrypoint, workPath, config, meta });

  // Try to install composer deps only on lambda,
  // not in the local now dev mode.
  if (!meta.isDev) {
    // Composer is called only if composer.json is provided,
    // or config.composer is TRUE
    if (includedFiles['composer.json'] || config.compose === true) {
      includedFiles = { ...includedFiles, ...await getComposerFiles(workPath) };
    }
  }

  const userFiles = rename(includedFiles, name => path.join('user', name));

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
