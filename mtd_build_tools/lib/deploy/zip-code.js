'use strict';

const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const archiver = require('archiver');

const uploadUtils = require('../util/upload-utils');

/**
 * Create a single zip file of all the contents of the given cartridge.
 * see https://github.com/archiverjs/node-archiver for more context.
 * @param {string} cartridge - The cartridge to archive.
 * @param {string} codeVersion - The code version.
 * @returns {Promise} - A promise object resolved with the path of the archive.
 */
function createArchive(cartridge, codeVersion) {
    return new Promise(resolve => {
        const cartridgesDir = path.join(process.cwd(), 'cartridges');
        const tempFilePath = path.join(uploadUtils.environment.TEMP_DIR+'/'+codeVersion, `${cartridge}.zip`);
        console.log("tempFilePath : " + tempFilePath);
        const outputStream = fs.createWriteStream(tempFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        // Log or throw an exception on any warnings when creating the Zip archive.
        archive.on('warning', (err) => {
            if (err.code === 'ENOENT') {
                console.log(chalk.yellow(err.message));
            } else {
                throw err;
            }
        });

        // Throw an exception on any explicit errors when creating the Zip archive.
        archive.on('error', (err) => {
            throw err;
        });

        // On the event that the archive is successfully created.
        outputStream.on('close', () => {
            resolve(tempFilePath);
            return;
        });

        archive.pipe(outputStream);

        archive.directory(path.join(cartridgesDir, cartridge), path.join(codeVersion, cartridge));

        archive.finalize();
    });
}

/**
 * Create a zip file for each cartridge in the project.
 * @param {string} codeVersion - The code version.
 * @returns {Promise[]} - An array of Promise objects each resolved with a path to an archive.
 */
module.exports = (codeVersion) => {
    console.log("in zipCode, codeVersion := " +codeVersion);
    const cartridges = uploadUtils.getCartridges();

    uploadUtils.createTempDirectory(codeVersion);

    // Map the result of creating the zip archive on each cartridge to a resolved or rejected promise.
    return Promise.all(cartridges.map(cartridge => createArchive(cartridge, codeVersion)));
};
