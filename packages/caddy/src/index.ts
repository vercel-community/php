import path from "path";
import {
  createLambda,
  shouldServe,
  rename,
  FileFsRef,
  BuildOptions,
  FileBlob
} from '@now/build-utils';

import {
  getPhpLibFiles,
  getIncludedFiles
} from 'now-php/dist/utils';

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
  const includedFiles = await getIncludedFiles({ files, entrypoint, workPath, config, meta });

  const userFiles = rename(includedFiles, name => path.join('user', name));
  const bridgeFiles: Files = {
    ...await getPhpLibFiles(),
    ...{
      'launcher.js': new FileFsRef({
        fsPath: path.join(__dirname, 'launcher.js'),
      }),
      'helpers.js': new FileFsRef({
        fsPath: path.join(__dirname, 'helpers.js'),
      }),
      'caddy': new FileFsRef({
        mode: 0o755,
        fsPath: path.join(__dirname, '../native/caddy'),
      }),
      'Caddyfile': new FileFsRef({
        fsPath: path.join(__dirname, '../native/Caddyfile'),
      }),
    }
  };

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
    runtime: 'nodejs12.x',
    environment: {
      NOW_ENTRYPOINT: entrypoint,
      NOW_PHP_DEV: meta.isDev ? '1' : '0'
    },
  });

  return { output: lambda };
};

export { shouldServe };
