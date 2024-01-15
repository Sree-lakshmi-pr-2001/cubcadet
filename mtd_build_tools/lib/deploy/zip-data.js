'use strict';

const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const archiver = require('archiver');

const uploadUtils = require('../util/upload-utils');

/**
 * Create a zip file for the specified data bundle.
 * see https://github.com/archiverjs/node-archiver for more context.
 * @param {string} bundle - The name of the data bundle.
 * @returns {(Promise)} - A Promise object representing the results of archiving.
 */
function createArchive(bundle,codeVersion) {
    return new Promise(resolve => {
        const dataImpexDir = path.join(process.cwd(), 'data_impex');
        const tempFilePath = path.join(uploadUtils.environment.TEMP_DIR+'/'+codeVersion, `${bundle}.zip`);
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

        archive.directory(path.join(dataImpexDir, bundle), bundle);

        archive.finalize();
    });
}

/**
 * Create a zip file for each data bundle specified.
 * @param {string[]} dataBundles - The names of the data bundles to zip.
 * @returns {(Promise|Promise[])} - A Promise object (or array of Promises) representing the results of archiving.
 */
module.exports = (dataBundles,codeVersion) => {
    if (!dataBundles) {
        return Promise.reject({
            isCustomError: true,
            message: 'The data bundle is undefined'
        });
    }

    uploadUtils.createTempDirectory(codeVersion);

    return Promise.all(dataBundles.map(bundle => createArchive(bundle,codeVersion)));
};
