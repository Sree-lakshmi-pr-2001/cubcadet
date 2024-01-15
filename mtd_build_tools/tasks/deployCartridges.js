'use strict';

const chalk = require('chalk');
const cliSpinners = require('cli-spinners');
const ora = require('ora');

const authenticate = require('../lib/deploy/authenticate');
const zipCode = require('../lib/deploy/zip-code');
const deployCode = require('../lib/deploy/deploy-code');
const activateCode = require('../lib/deploy/activate-code');
const uploadUtils = require('../lib/util/upload-utils');
const fs = require('fs');
const path = require('path');
const { cartridge } = require('sfcc-ci');
const spinner = new ora({ spinner: cliSpinners.simpleDotsScrolling });

function writeToCartridgeFile (codeVersion,codeV){
    return new Promise(async (resolve, reject) => {
        try {
            const tempFilePath = path.join(uploadUtils.environment.TEMP_DIR+'/'+codeVersion,'cartridgeList.json');
            console.log(tempFilePath);
            

            let code = [];

            codeV.forEach(cartridge=>{
                let idx = cartridge.indexOf('mtd_build_tools');
                code.push(cartridge.substring(idx));
            });
            let data = JSON.stringify(code);

            console.log("replaced data:");
            console.log(data);
            fs.writeFileSync(tempFilePath, data);
            console.log("written to "  +tempFilePath);
            resolve();
        } catch (err) {
            console.log(err.message);
            reject(err);
        }
    });
}

function getCodePaths (codeVersion){
    return new Promise(async (resolve, reject) => {
        try {
            const tempFilePath = 'mtd_build_tools/temp/'+codeVersion+'/cartridgeList.json';
            let cartridgesArray = null;

            fs.readFile(tempFilePath, (err, data) => {
                if (err) throw err;
                let cartridgesArray = JSON.parse(data);
                console.log(cartridgesArray);
                resolve(cartridgesArray);
            });

        } catch (err) {
            console.log(err.message);
            reject(err);
        }
    });
}

/**
 * Deploy and activate code on Commerce Cloud instances.
 * @param {Object} cliArgs - An options object created optionator containing CLI arguments.
 */
module.exports = async (cliArgs) => {
    console.log("cliArgs : ");
    console.log(JSON.stringify(cliArgs));
    
    // Gather upload properties
    let {
        clientId, clientSecret,
        hostname, deployHostname, activationHostname,
        codeVersion, versionCartridgeName = null,
        certHostname = null, p12 = null, passphrase = null, selfSigned = null,
        skipUpload,
        uploadOnly
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

    // if (!Array.isArray(activationHostname)) {
    //     activationHostname = activationHostname.split(',');
    // }

    if (certHostname && !Array.isArray(certHostname)) {
        certHostname = [].concat(certHostname);
    }

    try {
        let token = null;
        if (skipUpload !== true){
            console.log("hostname : " + hostname);
            console.log("certHostname : " + certHostname);
            // Check if 2FA is required
            uploadUtils.check2FA(hostname, certHostname, p12, passphrase);
    
            // Authenticate
            spinner.start(chalk.yellow('Authenticating'));
            token = await authenticate(clientId, clientSecret);
            spinner.succeed(chalk.green('Authenticated'));
    
            // Delete the code version (if it exists)
            await uploadUtils.deleteFile(certHostname || hostname, codeVersion, token, { p12, passphrase, selfSigned });
        }
        let code = null;
        if (uploadOnly !== true){

            // Delete local zip files
            spinner.start(chalk.yellow('Deleting temporary code archives'));
            uploadUtils.deleteTempDirectory(codeVersion);
            spinner.succeed(chalk.green('Deleted temporary code archives'));


            // Handle version properties file
            spinner.start('Creating version properties file');
            if (uploadUtils.createVersionPropertiesFile(versionCartridgeName, codeVersion)) {
                spinner.succeed(chalk.green('Created version properties file'));
            } else {
                spinner.warn(chalk.yellow('Version properties file not created. versionCartridgeName not defined.'));
            }

            // Create zip files
            spinner.start(chalk.yellow('Preparing cartridges for upload'));

            code= await zipCode(codeVersion);
            console.log("code paths=>");
            console.log(JSON.stringify(code));
            spinner.succeed(chalk.green('Cartridges compressed'));

            await writeToCartridgeFile(codeVersion,code);
        }
        else {
            console.log("getting Code cartridges, codeVersion=> "+ codeVersion);
            code = await getCodePaths(codeVersion);
        }
        console.log("code=>");
        console.log(JSON.stringify(code));


        if (skipUpload !== true){
                
            // Deploy code
            spinner.start(chalk.yellow('Uploading cartridges'));
            console.log("hostname : " + hostname);
            console.log("code : " + code);
            console.log("token : " + token);
            await deployCode(certHostname || hostname, code, token, { p12, passphrase });
            spinner.succeed(chalk.green('Cartridges uploaded'));

            // // Activate code version
            // spinner.start(chalk.yellow('Activating code version'));
            // await activateCode(activationHostname, codeVersion, token);
            // spinner.succeed(chalk.green('Activated code version'));
            console.log("\nnot activating code version. this has been disabled on purpose - mtd");
            // // Delete local zip files
            // spinner.start(chalk.yellow('Deleting temporary code archives'));
            // uploadUtils.deleteTempDirectory();
            // spinner.succeed(chalk.green('Deleted temporary code archives'));
        }
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
