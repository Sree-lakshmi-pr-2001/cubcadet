'use strict';

const sfccCodeApi = require('sfcc-ci').code;

/**
 * Activate the code version on Commerce Cloud instances.
 * @param {string[]} instances - An array of hostnames for Commerce Cloud instances.
 * @param {string} version - The code version.
 * @param {string} token - The Oauth token to use for authentication.
 * @returns {Promise[]} - An array of Promises that represent the result of an attempt to activate per instance.
 */
module.exports = (instances, version, token) => {
    if (!instances || !instances.length) {
        throw new Error('An activation hostname is required');
    }
    // Map the result of activation on each instance to a resolved or rejected promise
    return Promise.all(instances.map(instance =>
        new Promise((resolve, reject) => {
            // console.log('instance => ' + instance);
            // console.log('version => ' + version);
            // console.log('token => ' + token);
            sfccCodeApi.activate(instance, version, token, (result) => {
                // console.log("checking result =>");
                // console.log(result);
                if (typeof (result) !== 'undefined') {
                    reject(result);
                    return;
                }
                resolve(true);
            });
        })
    ));
};
