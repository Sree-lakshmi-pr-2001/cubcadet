'use strict';

const path = require('path');
const sfccInstanceApi = require('sfcc-ci').instance;
const sfccJobApi = require('sfcc-ci').job;

/**
 * Import data on a Commerce Cloud instance.
 * @param {string} instance - The hostname for a Commerce Cloud instance.
 * @param {string} archive - The file path to the local archive file.
 * @param {string} token - The Oauth token to use for authentication.
 * @returns {Promise} - Contains the result of importing data. If successful, the result will include
 * details about the job.
 */
function startImportJob(instance, archive, token) {
    return new Promise((resolve, reject) => {
        sfccInstanceApi.import(instance, path.basename(archive), token, (result, error) => {
            if (typeof (error) !== 'undefined') {
                reject(error);
                return;
            }
            resolve(result);
        });
    });
}

/**
 * Confirms the completion of a job running on a Commerce Cloud instance.
 * @param {string} instance - The hostname for a Commerce Cloud instance.
 * @param {string} archive - The file path to the local archive file.
 * @param {string} token - The Oauth token to use for authentication.
 * @param {Object} job - A job object returned by a successful call to sfccInstanceApi.import()
 * @returns {Promise} - Contains the result of the job once it completes.
 */
function confirmJobCompletion(instance, archive, token, job) {
    const { job_id, id } = job;

    return new Promise((resolve, reject) => {
        setInterval(function () {
            sfccJobApi.status(instance, job_id, id, token, (result, error) => {
                if (typeof (error) !== 'undefined') {
                    reject(error);
                    clearInterval(this);
                    return;
                } else if (result.status === 'ERROR') {
                    let errorMessage = '';
                    errorMessage += `The error occured when importing the archive "${path.basename(archive)}"\n`;

                    result.step_executions.forEach(step => {
                        if (step.exit_status.message) {
                            errorMessage += `${step.exit_status.message}\n`;
                        }
                    });

                    errorMessage += `See the log file "Impex/log/${result.log_file_name}" for more information`;

                    reject({
                        isCustomError: true,
                        message: errorMessage
                    });
                    clearInterval(this);
                    return;
                } else if (result.status === 'OK') {
                    resolve(result);
                    clearInterval(this);
                    return;
                }
            });
        }, 2000);
    });
}

/**
 * Import data on Commerce Cloud instances.
 * @param {string[]} instances - An array of hostnames for Commerce Cloud instances.
 * @param {string[]} archives - The file paths to the local archive files.
 * @param {string} token - The Oauth token to use for authentication.
 * @returns {Promise[]} - Contains the results of importing data.
 */
module.exports = (instances, archives, token) => {
    if (!instances || !instances.length) {
        throw new Error('An activation hostname is required');
    }

    return Promise.all(instances.map(async instance => {
        const results = [];

        for (const archive of archives) {
            const job = await startImportJob(instance, archive, token);
            const result = await confirmJobCompletion(instance, archive, token, job);
            results.push({
                instance,
                archive,
                logFileName: result.log_file_name
            });
        }

        return results;
    }));
};
