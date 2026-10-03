const path = require('path');

jest.mock('@libphp/almalinux-9-v85', () => {
  const actual = jest.requireActual('@libphp/almalinux-9-v85');
  return { ...actual, getFiles: jest.fn(actual.getFiles) };
});

jest.mock('@vercel/build-utils', () => {
  const actual = jest.requireActual('@vercel/build-utils');
  return { ...actual, glob: jest.fn(actual.glob) };
});

const libphp = require('@libphp/almalinux-9-v85');
const { FileFsRef, FileBlob, glob } = require('@vercel/build-utils');
const { getPhpFiles, modifyPhpIni, readRuntimeFile } = require('../../dist/utils');
const { build } = require('../../dist/index');
const actualLibphp = jest.requireActual('@libphp/almalinux-9-v85');
const excluded = ['php/php-cgi', 'php/php-fpm', 'php/php-fpm.ini'];
const fixturePath = path.resolve(__dirname, '../examples/01-cowsay');
const userIni = 'memory_limit = 192M\n';

function logicalKey(name, separators, index) {
  const posixName = name.replace(/\\/g, '/');
  return separators === 'backslash' || (separators === 'mixed' && index % 2 === 0)
    ? posixName.replace(/\//g, '\\')
    : posixName;
}

async function verifyRuntimeFiles(inputFiles) {
  const runtimeFiles = await getPhpFiles();
  const normalized = Object.fromEntries(
    Object.entries(inputFiles).map(([name, fsPath]) => [name.replace(/\\/g, '/'), fsPath])
  );

  expect(Object.keys(runtimeFiles).sort()).toEqual(
    Object.keys(normalized).filter(name => !excluded.includes(name)).sort()
  );
  for (const name of excluded) {
    expect(runtimeFiles).not.toHaveProperty(name);
  }
  for (const [name, file] of Object.entries(runtimeFiles)) {
    expect(name).not.toContain('\\');
    expect(file).toBeInstanceOf(FileFsRef);
    expect(file.fsPath).toBe(normalized[name]);
  }
  expect(runtimeFiles['php/php'].mode).toBe(33261);
  expect(runtimeFiles['php/composer'].mode).toBe(33261);
  expect(runtimeFiles['php/php.ini']).toBeInstanceOf(FileFsRef);

  const merged = await modifyPhpIni(
    { 'api/php.ini': new FileBlob({ data: userIni }) },
    runtimeFiles
  );
  expect(merged).toBeInstanceOf(FileBlob);
  expect(merged.data.toString()).toBe(
    `${await readRuntimeFile(runtimeFiles['php/php.ini'])}; [User]\n${userIni}`
  );
}

afterEach(() => {
  jest.clearAllMocks();
});

test('collects the installed runtime with native keys and unchanged physical paths', async () => {
  await verifyRuntimeFiles(await actualLibphp.getFiles());
});

test.each(['slash', 'backslash', 'mixed'])(
  'normalizes %s runtime keys before exclusions and preserves the source map',
  async separators => {
    const installedFiles = await actualLibphp.getFiles();
    const inputFiles = Object.fromEntries(
      Object.entries(installedFiles).map(([name, fsPath], index) => [
        logicalKey(name, separators, index), fsPath,
      ])
    );
    const original = { ...inputFiles };
    libphp.getFiles.mockResolvedValueOnce(inputFiles);

    await verifyRuntimeFiles(inputFiles);
    expect(inputFiles).toEqual(original);
  }
);

test('builds a real fixture with POSIX bundle keys', async () => {
  const { output } = await build({
    files: {},
    entrypoint: 'index.php',
    workPath: fixturePath,
    config: {},
    meta: {},
  });

  expect(output.files['user/index.php']).toBeInstanceOf(FileFsRef);
  expect(output.files['php/php.ini']).toBeInstanceOf(FileFsRef);
  expect(Object.keys(output.files).every(name => !name.includes('\\'))).toBe(true);
  for (const name of excluded) {
    expect(output.files).not.toHaveProperty(name);
  }
});

test.each(['slash', 'backslash', 'mixed'])(
  'prefixes %s harvested keys with user/ without changing file references',
  async separators => {
    const names = ['api/index.php', 'vendor/package/file.php'];
    const refs = names.map(() => new FileFsRef({
      fsPath: path.join(fixturePath, 'index.php'),
    }));
    glob.mockResolvedValueOnce(Object.fromEntries(
      names.map((name, index) => [logicalKey(name, separators, index), refs[index]])
    ));

    const { output } = await build({
      files: {},
      entrypoint: 'api/index.php',
      workPath: fixturePath,
      config: {},
      meta: {},
    });

    expect(Object.keys(output.files).filter(name => name.startsWith('user/')).sort())
      .toEqual(names.map(name => `user/${name}`).sort());
    names.forEach((name, index) => {
      expect(output.files[`user/${name}`]).toBe(refs[index]);
      expect(output.files[`user/${name}`].fsPath).toBe(path.join(fixturePath, 'index.php'));
    });
    expect(Object.keys(output.files).every(name => !name.includes('\\'))).toBe(true);
  }
);
