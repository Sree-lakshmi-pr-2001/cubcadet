'use strict';

const shell = require('shelljs');
const path = require('path');
const versionProperties = require('./templates/versionProperties');

module.exports = {
    createVersionPropertiesFile: (cartridgeName, codeVersion, cwd) => {
        const filePath = path.join(cwd, '/cartridges', cartridgeName, 'cartridge/templates/resources');

        // create version.properties file for cartridge
        shell.ShellString(versionProperties(codeVersion)).to(path.join(filePath, 'version.properties'));
    }
};
