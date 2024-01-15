'use strict';

const chalk = require('chalk');
const cliSpinners = require('cli-spinners');
const ora = require('ora');

const authenticate = require('../lib/deploy/authenticate');
const activateCode = require('../lib/deploy/activate-code');
const uploadUtils = require('../lib/util/upload-utils');

const spinner = new ora({ spinner: cliSpinners.simpleDotsScrolling });

/**
 * Activate a code version on Commerce Cloud instances.
 * @param {Object} cliArgs - An options object created optionator containing CLI arguments.
 */
module.exports = async (cliArgs) => {
    // Gather upload properties
    let {
        clientId, clientSecret,
        activationHostname, codeVersion
    } = uploadUtils.mergeUploadProperties(cliArgs);

     if (!Array.isArray(activationHostname)) {
         activationHostname = activationHostname.split(',');
     }

    try {
        // Authenticate
        spinner.start(chalk.yellow('Authenticating'));
        const token = await authenticate(clientId, clientSecret);
        spinner.succeed(chalk.green('Authenticated'));

        // Activate code version
        spinner.start(chalk.yellow('Activating code version'));
        await activateCode(activationHostname, codeVersion, token);
        spinner.succeed(chalk.green('Activated code version'));
    } catch (error) {
        console.log(chalk.red('An error occured!'));
        console.log(chalk.red(error));
        console.log(chalk.red('Please verify all credentials, upload arguments, and ocapi configurations'));
        process.exit(1);
    }
};
