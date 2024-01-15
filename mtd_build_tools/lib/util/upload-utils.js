'use strict';

const path = require('path');
const fs = require('fs');
const shell = require('shelljs');
const promisfiedRequest = require('request-promise');
const del = require('del');
const chalk = require('chalk');

const stringUtils = require('./string-utils');
const versionProperties = require('../scaffold/templates/versionProperties');

/**
 * Retrieves the package.json file in the root directory if it exists.
 * @returns {JSON} - A package.json object. It will be empty
 * if the package.json file can't be found.
 */
function getPackageJson() {
    let cwd = process.cwd();
    const folderName = cwd.split(path.sep).pop();

    if (folderName === 'mtd_build_tools') {
        process.chdir('../');
        cwd = process.cwd();
    }

    const packageFile = path.join(cwd, 'package.json');

    if (!fs.existsSync(packageFile)) {
        console.error('A package.json file was not found in the root directory!');
        return undefined;
    }

    return require(packageFile);
}

const packageFile = getPackageJson();
const LAST_DEPLOYMENT_FILE_NAME = packageFile.deployment.dataOptions.lastDeploymentFileName;


function getOptions(instance, webdavPath, token, options, method, simple) {
    // the endpoint including the relative path on the instance's file system to upload to
    const endpoint = exports.environment.WEBDAV_BASE + webdavPath;

    const opts = {
        baseUrl: 'https://' + instance,
        uri: endpoint,
        auth: {
            bearer: token
        },
        strictSSL: true,
        method,
        simple
    };

    // allow self-signed certificates, if needed (only supported for configuration via dw.json)
    if (options.selfSigned) {
        opts.strictSSL = false;

        console.warn('Allow self-signed certificates. Be caucious as this may expose secure information to an ' +
            'untrusted party.');
    }
    // allow client certificate and related passphrase if provided
    if (options && options.p12 && fs.existsSync(options.p12)) {
        const stat = fs.statSync(options.p12);
        if (stat.isFile()) {
            opts.agentOptions = {
                pfx: fs.readFileSync(options.p12),
                passphrase: options.passphrase // as passphrase is optional, it can be undefined here
            };
        }
    }

    return opts;
}

/**
 * Environment variables related to upload routines
 */
exports.environment = {
    WEBDAV_BASE: '/on/demandware.servlet/webdav/Sites',
    WEBDAV_INSTANCE_IMPEX: '/impex/src/instance',
    WEBDAV_CODE: '/cartridges',
    TEMP_DIR: path.join(process.cwd(), 'mtd_build_tools', 'temp')
};

exports.getPackageJson = getPackageJson;

exports.check2FA = (hostnames, certHostnames, p12, passphrase) => {
    console.log("checking hostnames...");
    for (const hostname of hostnames) {
        
        console.log("hostname => " + hostname);
        if (hostname.indexOf('staging') >= 0) {
            if (!certHostnames || !certHostnames.length || !p12 || !passphrase) {
                throw Error('Missing 2FA credentials!');
            }
        }
    }
};

exports.getJobResultsInfo = (jobResults) => {
    const LOG_FILE_DIR = '/on/demandware.servlet/webdav/Sites/Impex/log/';
    return jobResults.map(jobResult => {
        const jobLog = jobResult.reduce((log, result, index) => {
            if (index === 0) {
                log += `Instance ${chalk.bold(result.instance)} imported data bundles:\n`;
            }

            log += `  ${chalk.bold(path.parse(result.archive).name)} ` +
                       `- https://${result.instance + LOG_FILE_DIR}` +
                       `${result.logFileName}\n`;

            return log;
        }, '');

        return jobLog;
    });
};

exports.deleteFile = (instances, file, token, options) =>
    Promise.all(instances.map(instance => {
        const filePath = path.join(exports.environment.WEBDAV_CODE, file);

        // build the request options
        const requestOpts = getOptions(instance, filePath, token, options, 'DELETE', false);

        return promisfiedRequest(requestOpts);
    }));

exports.deleteData = (instances, archives, token, options) =>
    Promise.all(...instances.map(instance => archives.map(archive => {
        const filePath = path.join(exports.environment.WEBDAV_INSTANCE_IMPEX, path.basename(archive));

        // build the request options
        const requestOpts = getOptions(instance, filePath, token, options, 'DELETE', false);

        return promisfiedRequest(requestOpts);
    })));

/**
 * Get the names of all the cartridges in the cartridges directory
 * @returns {string[]} - The names of the cartridges
 */
exports.getCartridges = () => {
    const cartridgesDir = path.join(process.cwd(), 'cartridges');
    return fs.readdirSync(cartridgesDir).filter(cartridge =>
        fs.statSync(path.join(cartridgesDir, cartridge)).isDirectory());
};

/**
 * Retrieves the dw.json file in the root directory if it exists.
 * @returns {JSON} - A dw.json object. It will be empty if the dw.json file can't be found.
 */
exports.getDwJson = () => {
    let cwd = process.cwd();
    const folderName = cwd.split(path.sep).pop();

    if (folderName === 'mtd_build_tools') {
        process.chdir('../');
        cwd = process.cwd();
    }

    const dwJsonFile = path.join(cwd, 'dw.json');

    if (!fs.existsSync(dwJsonFile)) {
        console.error('A dw.json file was not found in the root directory!');
        console.error('Only arguments passed via the CLI  will be used\n');
        return undefined;
    }

    return require(dwJsonFile);
};

/**
 * Merges upload properties between CLI arguments and the dw.json file.
 * @param {Object} cliOptions - An options object created optionator containing CLI arguments and their values.
 * @returns {Object} - An object containing upload properties.
 */
exports.mergeUploadProperties = (cliOptions) => {
    const defaultOptions = {
        codeVersion: process.env.BUILD_TAG || 'build'
    };
    const dwOptions = {};
    const dwJson = this.getDwJson();

    if (dwJson) {
        Object.keys(dwJson).forEach(key => {
            dwOptions[stringUtils.camelCase(key)] = dwJson[key];
        });

        return Object.assign(defaultOptions, dwOptions, cliOptions);
    }

    return Object.assign(defaultOptions, cliOptions);
};

/**
 * Creates local temp directory used to store cartridge zip files.
 */
exports.createTempDirectory = (codeVersion) => {
    let tempFolder = this.environment.TEMP_DIR+'/'+codeVersion;
    console.log("tempFolder : "+ tempFolder);

    if (fs.existsSync(tempFolder)){
        console.log("temp folder exists, delete it");
        del.sync(tempFolder);
    }

    fs.mkdirSync(tempFolder, { recursive: true });
    console.log(tempFolder + " created ");
    
    // if (fs.existsSync(this.environment.TEMP_DIR+'/'+codeVersion)) {
    //     del.sync(this.environment.TEMP_DIR+'/'+codeVersion);
    //     fs.mkdirSync(this.environment.TEMP_DIR+'/'+codeVersion);
    // } else {
    //     fs.mkdirSync(this.environment.TEMP_DIR+'/'+codeVersion);
    // }
};

/**
 * Deletes local temp directory used to store cartridge zip files.
 */
exports.deleteTempDirectory = (codeVersion) => {
    let tempFolder = this.environment.TEMP_DIR+'/'+codeVersion;
    console.log("deleting " + tempFolder);
    if (fs.existsSync(tempFolder)) {
        del.sync(tempFolder);
    }
};

exports.createVersionPropertiesFile = (cartridgeName, codeVersion) => {
    if (!cartridgeName || !codeVersion) {
        return false;
    }

    const filePath = path.join(process.cwd(), 'cartridges', cartridgeName, 'cartridge/templates/resources');
    console.log(filePath);
    // create version.properties file for cartridge
    shell.ShellString(versionProperties(codeVersion)).to(path.join(filePath, 'version.properties'));
    return true;
};

exports.logTimeOfLastDeployment = () => {
    if (fs.existsSync(path.join(process.cwd(), LAST_DEPLOYMENT_FILE_NAME))) {
        const lastDeploymentTimeString = fs.readFileSync(LAST_DEPLOYMENT_FILE_NAME, 'utf8');
        const lastDeploymentDate = new Date(parseInt(lastDeploymentTimeString, 10));
        console.log(`Last Deployment Timestamp: ${lastDeploymentDate.toString()}`);
    }
};

exports.saveTimeOfDeployment = () => {
    fs.writeFile(LAST_DEPLOYMENT_FILE_NAME, new Date().getTime(), (err) => {
        if (err) {
            throw err;
        }
    });
};
