import path from 'path';
import { FileBlob, glob } from '@now/build-utils';

export async function getLibFiles(): Promise<Files> {
  // Lookup for PHP bins, modules and shared objects

  const files: Files = {
    ...await glob('php/**', { cwd: path.join(__dirname, '../native') }),
    ...await glob('lib/**', { cwd: path.join(__dirname, '../native') }),
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
