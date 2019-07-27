const {
  glob,
  FileBlob
} = require('@now/build-utils');

async function getPhpFiles() {
  // Lookup for PHP bins, modules and shared objects
  const files = {
    ...await glob('php/**', __dirname),
    ...await glob('lib/**', __dirname),
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

module.exports = {
  getPhpFiles,
};
