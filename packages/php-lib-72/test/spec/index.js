const index = require('./../../dist/index');

test('lookup php files', async () => {
    const files = await index.getLibFiles();

    expect(Object.keys(files).length).toEqual(57);
    expect(typeof files).toEqual('object');
});

test('have all php files', async () => {
    const files = await index.getLibFiles();
    expect(files).toHaveProperty('php/php');
    expect(files).toHaveProperty('php/php-cgi');
    expect(files).toHaveProperty('php/php-fpm');
    expect(files).toHaveProperty('php/composer');
});
