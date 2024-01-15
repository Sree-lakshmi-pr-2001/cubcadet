'use strict';

const path = require('path');
const chalk = require('chalk');
const cliSpinners = require('cli-spinners');
const ora = require('ora');

const authenticate = require('../lib/deploy/authenticate');
const zipData = require('../lib/deploy/zip-data');
const deployData = require('../lib/deploy/deploy-data');
const importData = require('../lib/deploy/import-data');
const uploadUtils = require('../lib/util/upload-utils');

const packageFile = uploadUtils.getPackageJson();
const spinner = new ora({ spinner: cliSpinners.simpleDotsScrolling });

/**
 * Deploy and import data on Commerce Cloud instances.
 * @param {Object} cliArgs - An options object created optionator containing CLI arguments.
 */
module.exports = async (cliArgs) => {
    // Gather upload properties
    let {
        clientId, clientSecret,
        hostname, deployHostname, dataBundle,
        certHostname = null, p12 = null, passphrase = null, selfSigned = null,
        codeVersion
    } = uploadUtils.mergeUploadProperties(cliArgs);

    // use deployHostname if set, else fall back to hostname
    if (deployHostname) {
        if (!Array.isArray(deployHostname)) {
            hostname = deployHostname.split(',');
        } else {
            hostname = deployHostname;
        }
    } else {
        if (!Array.isArray(hostname)) {
            hostname = [].concat(hostname);
        }
    }

     if (certHostname && !Array.isArray(certHostname)) {
         certHostname = [].concat(certHostname);
     }

    try {
        // Log the last time of a data deployment
        uploadUtils.logTimeOfLastDeployment();

        // Check if 2FA is required
        uploadUtils.check2FA(hostname, certHostname, p12, passphrase);

        // Authenticate
        spinner.start(chalk.yellow('Authenticating'));
        const token = await authenticate(clientId, clientSecret);
        spinner.succeed(chalk.green('Authenticated'));

        // Create zip files
        spinner.start(chalk.yellow('Preparing data for upload'));
        const dataBundles = packageFile.deployment.dataBundles[dataBundle];
        const data = await zipData(dataBundles,codeVersion);
        spinner.succeed(chalk.green('Data compressed'));

        // Deploy data
        spinner.start(chalk.yellow('Uploading data'));
        await deployData(certHostname || hostname, data, token, { p12, passphrase });
        spinner.succeed(chalk.green('Data uploaded'));

        // Import data
        spinner.start(chalk.yellow('Importing data'));
        const results = await importData(hostname, data, token);
        spinner.succeed(chalk.green('Data imported'));

        // Clean up data
        spinner.start(chalk.yellow('Deleting temporary data archives'));
        await uploadUtils.deleteData(certHostname || hostname, data, token, { p12, passphrase, selfSigned });
        uploadUtils.deleteTempDirectory(codeVersion);
        spinner.succeed(chalk.green('Deleted temporary data archives\n'));

        // Log results
        const jobLogs = uploadUtils.getJobResultsInfo(results);
        jobLogs.forEach(jobLog => console.log(jobLog));

        // Save timestamp of current deployment
        uploadUtils.saveTimeOfDeployment();
    } catch (error) {
        spinner.fail(chalk.red('An error occured!'));
        if (error && error.isCustomError) {
            console.log(chalk.red(error.message));
        } else {
            console.log(chalk.red(error));
            console.log(chalk.red('Please verify all credentials, upload arguments, and ocapi configurations'));
        }
        process.exit(1);
    }
};
