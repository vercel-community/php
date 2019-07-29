
const utils = require('./../../dist/utils');

test('lookup php files', async () => {
    const files = await utils.getPhpLibFiles();

    expect(Object.keys(files).length).toEqual(57);
    expect(typeof files).toEqual('object');
});
