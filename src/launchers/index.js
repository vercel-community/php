const { FileFsRef } = require('@now/build-utils');
const path = require('path');

function getFiles({ meta }) {
    if (meta && meta.isDev) {
        return {
            'launcher.js': new FileFsRef({
                fsPath: path.join(__dirname, 'cgi/launcher.js'),
            }),
        };
    } else {
        return {
            'launcher.js': new FileFsRef({
                fsPath: path.join(__dirname, 'server/launcher.js'),
            }),
        };
    }
}

module.exports = {
    getFiles,
};
