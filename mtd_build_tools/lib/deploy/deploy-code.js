'use strict';

const sfccCodeApi = require('sfcc-ci').code;

/**
 * Upload a code archive on a Commerce Cloud instance.
 * @param {string} instance - A hostname for a Commerce Cloud instance.
 * @param {string} archive - The file path to the local archive.
 * @param {string} token - The Oauth token to use for authentication.
 * @param {Object} options - An object containing upload options (2FA credentials).
 * @returns {Promise} - The promise contains the result of deploying the code archive.
 */
function deploy(instance, archive, token, options) {
    const pfx = options.p12;
    const passphrase = options.passphrase;

    return new Promise((resolve, reject) => {
        sfccCodeApi.deploy(instance, archive, token, { pfx, passphrase }, (result) => {
            if (typeof (result) !== 'undefined') {
                reject(result);
                return;
            }
            resolve(true);
        });
    });
}

/**
 * Upload code archives on Commerce Cloud instances.
 * @param {string[]} instances - An array of hostnames for Commerce Cloud instances.
 * @param {string[]} archives - The file paths to the local archive files.
 * @param {string} token - The Oauth token to use for authentication.
 * @param {Object} options - An object containing upload options (2FA credentials).
 * @returns {Promise[]} - Contains the results of deploying the code archives.
 */
module.exports = (instances, archives, token, options) => {
    if (!instances || !instances.length) {
        throw new Error('An activation hostname is required');
    }

    return Promise.all(...instances.map(instance =>
                           archives.map(archive => deploy(instance, archive, token, options))
    ));
};

