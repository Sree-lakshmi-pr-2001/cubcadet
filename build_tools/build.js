#!/usr/bin/env node

'use strict';

/**
 * build.js module adapted for LyonsCG use from SFCC's community suite sgmf-scripts
 */

const shell = require('shelljs');
const spawn = require('child_process').spawn;
const path = require('path');
const fs = require('fs');
const createCartridge = require('./createCartridge');
const deployData = require('./deployData');
const generateSystemObjectReports = require('./systemObjectsReport');
const createVersionPropertiesFile = require('./createVersionPropertiesFile');
const Webdav = require('./lib/webdav');
const chalk = require('chalk');
const os = require('os');

// current working directory is meant to be the root of the project, not build_tools
var cwd = process.cwd();
var folderName = cwd.split(path.sep).pop();
if (folderName == 'build_tools') {
    process.chdir('../');
    cwd = process.cwd();
}

const pwd = __dirname;
const TEMP_DIR = path.resolve(cwd,'./tmp');

/** Identify the script as soon as it starts. */
const packageFile = require(path.join(cwd, './package.json'));
console.log(chalk.bgYellow.black.bold('Starting LyonsCG Build Script v' + packageFile.lcgversion + ' for SFRA v' + packageFile.version));

/** Base Build Options */
const optionator = require('optionator')({
    options: [{
        option: 'help',
        alias: 'h',
        type: 'Boolean',
        description: 'Generate help message'
    }, {
        option: 'upload',
        type: '[path::String]',
        description: 'Upload a file to a sandbox. Requires dw.json file in the build_tools directory.'
    }, {
        option: 'uploadCartridge',
        type: '[String]',
        description: 'Upload a cartridge. Requires dw.json file in the build_tools directory.'
    }, {
        option: 'test',
        type: '[path::String]',
        description: 'Run unittests on specified files/directories.'
    }, {
        option: 'cover',
        type: 'Boolean',
        description: 'Run all unittests with coverage report.'
    }, {
        option: 'lint',
        type: 'Boolean',
        description: 'Lint scss/js files.'
    },
    {
        option: 'lint-no-cache',
        type: 'Boolean',
        description: 'Disables the linters\' caches',
        required: false
    },
    {
        option: 'createCartridge',
        type: 'String',
        description: 'Create new cartridge structure'
    }, {
        option: 'onlycompile',
        type: 'Boolean',
        description: 'Only compile during the watch option.'
    }, {
        option: 'deploy-data',
        type: 'Boolean',
        description: 'Deploy data using the settings in package.json',
        required: false
    }, {
        option: 'cartridge',
        type: '[String]',
        description: 'List of cartridges to be uploaded',
        required: false
    }, {
        option: 'username',
        type: 'String',
        description: 'Username to log into sandbox',
        required: false
    }, {
        option: 'password',
        type: 'String',
        description: 'Password to log into sandbox',
        required: false
    }, {
        option: 'hostname',
        type: '[String]',
        description: 'Sandbox URL(s) (without the "https://" prefix)',
        required: false
    }, {
        option: 'cert-hostname',
        type: '[String]',
        description: 'Certificate Sandbox URL(s) (without the "https://" prefix)',
        required: false
    }, {
        option: 'activation-hostname',
        type: '[String]',
        description: 'Activation Sandbox URL(s) (without the "https://" prefix)',
        required: false
    }, {
        option: 'code-version',
        type: 'String',
        description: 'Code version folder name',
        required: false
    }, {
        option: 'verbose',
        alias: 'v',
        type: 'Boolean',
        description: 'Activate verbose mode',
        required: false
    }, {
        option: 'skip-upload',
        type: 'Boolean',
        description: 'Skips the upload step',
        required: false,
        default: false
    }, {
        option: 'root',
        type: 'String',
        description: 'The root file path to resolve to relative to the actual file path on disk. This option is useful for deleting or uploading a file. Do not use this if uploading a cartridge, that is taken care of for you.',
        required: false,
        default: '.'
    }, {
        option: 'exclude',
        type: '[path::String]',
        description: 'Exclude patterns. This works for both files and folders. To exclude a folder, use `**/foldername/**`. The `**` after is important, otherwise child directories of `foldername` will not be excluded.',
        required: false
    }, {
        option: 'include',
        type: '[path::String]',
        description: 'Include paths.'
    }, {
        option: 'p12',
        type: 'path::String',
        description: 'The p12 file to be used for 2-factor authentication.',
        required: false
    }, {
        option: 'passphrase',
        type: 'String',
        description: 'The passphrase to be used for 2-factor authentication.',
        required: false
    }, {
        option: 'self-signed',
        type: 'Boolean',
        description: 'Stops the check for a signature on the SSL cert.',
        required: false,
        default: false
    }, {
        option: 'data-bundle',
        type: 'String',
        description: 'The data bundle that will be deployed. Data bundles are defined in package.json',
        required: false
    }, {
        option: 'generate-object-report',
        type: 'Boolean',
        description: 'Generates a text file that contains HTML with a table of system objects',
        required: false
    }, {
        option: 'deployCartridges',
        type: 'Boolean',
        description: 'Deploys cartridges specified in the package.json file to the server',
        required: false
    }, {
        option: 'activateCodeVersion',
        type: 'Boolean',
        description: 'Activates code version',
        required: false
    }, {
        option: 'version-cartridge-name',
        type: 'String',
        description: 'cartridge name version.properties should be created within',
        required: false
    }
    ]
});

/**
 * @name isBuildEnvironment
 * @description checks whether the build environment flag exists 
 * and is either equal to true or the passed value
 * @param {String} key
 * @param {String} value - optional
 * @returns {Boolean}
 */
function isBuildEnvironment(key, value) {
    return (value) ? (process.env.hasOwnProperty(key) && process.env[key] === value) : 
                     (process.env.hasOwnProperty(key) && process.env[key] === 'true')
}

/**
 * @name setBuildEnvironmentFlags
 * @description set environmental flags on the global process object
 * Any options passed via the CLI (that are also accepted / parsed by optionator) will override the package.json file's "buildEnvironment" settings
 * @param {File} packageFile
 * @param {Object} options 
 */
function setBuildEnvironmentFlags(packageFile, options) {
    const buildEnvironment = (options.buildEnvironment && options.buildEnvironment === 'production') ? packageFile.buildEnvironment.production : 
                                                                                                       packageFile.buildEnvironment.development
    Object.assign(process.env, buildEnvironment, options);
}

/**
 * Checks for the dw.json config file in the build_tools subfolder
 * @returns {boolean}
 */
function checkForDwJson() {
    return fs.existsSync(path.join(cwd, './build_tools/dw.json'));
}

/**
 * Deletes all files in the tmp directory
 */
function clearTmp() {
    if (isBuildEnvironment('verbose')) {
        console.log(chalk.green('build.js:clearTmp()'));
    }
    shell.rm('-rf', TEMP_DIR);
}

/**
 * Returns full path to the dwupload binary utility on the workstation
 * @returns {string} Path to dwupload binary
 */
function dwuploadModule() {

    let dwupload = fs.existsSync(path.resolve(cwd, './node_modules/.bin/dwupload')) ?
        path.resolve(cwd, './node_modules/.bin/dwupload') :
        path.resolve(pwd, './node_modules/.bin/dwupload');

    if (os.platform() === 'win32') {
        dwupload += '.cmd';
    }
    return dwupload;
}

/**
 * Formats commandline string for dwupload
 * @param {string} param
 * @param {string} fileOrCartridge
 */
function shellCommands(param, fileOrCartridge) {
    const dwupload = dwuploadModule();

    if (os.platform() === 'win32') {
        return `cd ./cartridges && ${dwupload} ${param} ${fileOrCartridge} && cd..`;
    }
    return `cd ./cartridges && node ${dwupload} ${param} ${fileOrCartridge} && cd ..`;
}

/**
 * Uploads the list of files given config info found in build_tools/dw.json
 * @param {array} files - list of files to upload
 */
function uploadFiles(files) {
    if (checkForDwJson()) {
        shell.cp(path.join(cwd, './build_tools/dw.json'), './cartridges/'); // copy dw.json file into cartridges directory temporarily

        files.forEach(file => {
            const relativePath = path.relative(path.join(cwd, './cartridges/'), file);
            shell.exec(shellCommands('--file', relativePath));
        });
        shell.rm('./cartridges/dw.json'); // remove dw.json file from cartridges directory
    }
}

/**
 * Filters a string to change it to camel case
 * @param {string} str - input string to process
 * @returns {string} - processed for camel case
 */
function camelCase(str) {
    return str.replace(/^.|-./g, function(letter, index) {
        return index == 0 ? letter.toLowerCase() : letter.substr(1).toUpperCase();
    });
}

/**
 * Use the dwupload binary to delete files off the server
 * @param {array} files - files to be deleted from the server
 */
function deleteFiles(files) {
    if (checkForDwJson()) {
        shell.cp(path.join(cwd, './build_tools/dw.json'), './cartridges/'); // copy dw.json file into cartridges directory temporarily

        files.forEach(file => {
                const relativePath = path.relative(path.join(cwd, './cartridges'), file);
                shell.exec(shellCommands('delete --file', relativePath));
        });
        shell.rm('./cartridges/dw.json'); // remove dw.json file from cartridges directory
    }
}

/**
 * Create parameter string for use with Istanbul testing
 * @param {*} option
 * @param {*} command
 */
function createIstanbulParameter(option, command) {
    let commandLine = ' ';
    if (option) {
        commandLine = option.split(',').map(commandPath => ' -' + command + ' ' + commandPath.join(' ') | ' ');
    }
    return commandLine;
}

/**
 * @function
 * @desc Builds the upload options based on the arguments passed in
 * @param {boolean} isData - Is this is a data upload
 * @returns {string}
 */
function getUploadOptions(isData) {
    let uploadOptions = [
        'cartridge',
        'username',
        'password',
        'hostname',
        'cert-hostname',
        'activation-hostname',
        'code-version',
        'verbose',
        'skip-upload',
        'root',
        'exclude',
        'p12',
        'passphrase',
        'self-signed',
        'data-bundle',
        'version-cartridge-name'
    ],
    uploadArguments = {};

    // Create the argument list/object based on the dw.json file if present
    if (checkForDwJson()) {
        const localSettings = require(path.join(pwd, './dw.json'));

        Object.keys(localSettings).forEach(uploadOption => {
            if (localSettings[uploadOption]) {
                uploadArguments[camelCase(uploadOption)] = localSettings[uploadOption];
            }
        });
    }

    // Create the argument list/object based on the argv options if present and override any previous dw.json options
    uploadOptions.forEach(uploadOption => {
        if (options[camelCase(uploadOption)]) {
            if (uploadOption === 'code-version') {
                let versionName = 'version1';

                if (options['codeVersion']) {
                    versionName = options.codeVersion;
                } else if (process.env.BUILD_TAG) {
                    versionName = process.env.BUILD_TAG;
                }

                uploadArguments[camelCase(uploadOption)] = versionName;
            } else {
                uploadArguments[camelCase(uploadOption)] = options[camelCase(uploadOption)];
            }
        }
    });

    return uploadArguments;
}

/**
 * activates specified code version for all activationHostnames
 * @param {array} uploadArguments - the current uploadArguments
 */
function activateCodeVersion(uploadArguments) {
    if (uploadArguments.activationHostname && uploadArguments.activationHostname.length > 0) {
        console.log(chalk.green('Starting activateCodeVersion routine...'));
        const activationHostnames = uploadArguments.activationHostname;
        delete uploadArguments.activationHostname;
        delete uploadArguments.hostname;
        activationHostnames.forEach((activationHostname) => {
            console.log(chalk.blue('activating code on host: ' + activationHostname));
            uploadArguments['activationHostname'] = activationHostname;
            uploadArguments['hostname'] = activationHostname;
            const webdav = new Webdav(uploadArguments);
            webdav.formLogin().then(() => {
                webdav.activateCode();
            });
        });
    } else {
        console.log(chalk.yellow('No activationHostname defined. Skipping code version activiation.'));
        process.exit(0);
    }
}

/**
 * return an array of cartridges that are included in the package.json file
 * @param {file} packageFile - the package.json file to use
 * @returns {array} - array of cartridge names
 */
function getCartridges(packageFile) {
    var cartridges = [];
    for (let site of packageFile.sites) {
        for (let cartridge of site.cartridges) {
            console.log(chalk.blue('passing in "' + cartridge.name + '"'));
            cartridges.push(cartridge.name);
        }
    }

    // always add in modules, assume this is a required cartridge
    if (cartridges.indexOf('modules') == -1) {
        console.log(chalk.blue('passing in "modules"'));
        cartridges.push('modules');
    }

    return cartridges;
}

/**
 * creates version.properties file
 * @param {array} uploadArguments - the current uploadArguments
 */
function createVersionProperties(uploadArguments) {
    if (uploadArguments && uploadArguments.versionCartridgeName && uploadArguments.codeVersion) {
        console.log(chalk.yellow('Creating version.properties in cartridge "' + uploadArguments.versionCartridgeName + '"'));
        const cartridgeName = uploadArguments.versionCartridgeName;
        const codeVersion = uploadArguments.codeVersion;
        createVersionPropertiesFile(cartridgeName, codeVersion, cwd);
    } else {
        console.log(chalk.yellow('No versionCartridgeName defined. Skipping creation of version.properties file.'));
    }
}

const options = optionator.parse(process.argv);
const uploadArguments = getUploadOptions();

setBuildEnvironmentFlags(packageFile, options);

if (options.help) {
    console.log(optionator.generateHelp());
    process.exit(0);
}

// upload a file
if (options.upload) {
    if (!checkForDwJson) {
        console.error(chalk.red('Could not find dw.json file in build_tools folder.'));
        process.exit(1);
    }

    uploadFiles(options.upload);

    process.exit(0);
}

// upload cartridge
if (options.uploadCartridge) {
    if (checkForDwJson()) {
        shell.cp(path.join(pwd, 'dw.json'), path.join(pwd, '../cartridges/'));
        console.log(chalk.green('Loading SFCC instance credentials from build_tools/dw.json'));
    } else {
        console.log(chalk.yellow('Could not find build_tools/dw.json file. Continuing with command line arguments only.'));
    }

    const cartridges = options.uploadCartridge;
    cartridges.forEach(cartridge => {
        console.log('Uploading cartridge ' + chalk.black.bgBlue(cartridge));
        console.log(chalk.gray('    ' + 'cd ./cartridges && node ' +
        path.resolve(cwd, './node_modules/.bin/dwupload') +
        ' -- cartridge ' + cartridge + ' && cd ..'));
        shell.exec('cd ./cartridges && node ' +
            path.resolve(cwd, './node_modules/.bin/dwupload') +
            ' --cartridge ' + cartridge + ' && cd ..');
    });
}

// run unit tests
if (options.test) {
    const mocha = fs.existsSync(path.resolve(cwd, './node_modules/.bin/_mocha')) ?
        path.resolve(cwd, './node_modules/.bin/_mocha') :
        path.resolve(pwd, './node_modules/.bin/_mocha');

    const subprocess = spawn(
        mocha +
        ' --reporter spec ' +
        options.test.join(' '), { stdio: 'inherit', shell: true, cwd });

    subprocess.on('exit', code => {
        process.exit(code);
    });
}

// run unit test coverage
if (options.cover) {
    const istanbul = fs.existsSync(path.resolve(cwd, './node_modules/.bin/istanbul')) ?
        path.resolve(cwd, './node_modules/.bin/istanbul') :
        path.resolve(pwd, './node_modules/.bin/istanbul');

    const mocha = fs.existsSync(path.resolve(cwd, './node_modules/.bin/_mocha')) ?
        path.resolve(cwd, './node_modules/mocha/bin/_mocha') :
        path.resolve(pwd, './node_modules/mocha/bin/_mocha');

    const subprocess = spawn(
        istanbul +
        ' cover ' +
        createIstanbulParameter(options.exclude, 'x') +
        createIstanbulParameter(options.include, 'i') +
        mocha +
        ' -- -R spec test/unit/**/*.js', { stdio: 'inherit', shell: true, cwd });

    subprocess.on('exit', code => {
        process.exit(code);
    });
}

if (options.lint) {
    const linter = require('./tasks/lint');

    /*
    The types of linters to run against the code base are passed as positional arguments
    If no types are given (ex. 'npm run lint'), then all linters are run against the code base
    */
    let types = options._;
    if (!types.length) {
        types = ['server-js', 'client-js', 'scss', 'json', 'build-tools'];
    }

    // Disable the linter's cache git commit and production builds
    if (options.lintNoCache) {
        process.env.lintNoCache = true;
    }

    linter.run(types);
}

if (options.createCartridge) {
    const cartridgeName = options.createCartridge;
    console.log(chalk.green('Creating folders and files for cartridge ' + cartridgeName));
    createCartridge(cartridgeName, cwd);
}

if (options.deployData) {
    console.log('Deploying data...');
    const uploadArguments = getUploadOptions();

    if (uploadArguments.hostname && uploadArguments.username && uploadArguments.password) {
        deployData(uploadArguments);
    } else if (!uploadArguments.hostname) {
        console.log(chalk.red('Error: Please provide a hostname to deploy data'));
    } else if (!uploadArguments.username) {
        console.log(chalk.red('Error: Please provide a username to deploy data'));
    } else if (!uploadArguments.password) {
        console.log(chalk.red('Error: Please provide a password to deploy data'));
    }
}

if (options.generateObjectReport) {
    console.log(chalk.green('Generating Object Report'));
    const uploadArguments = getUploadOptions();
    generateSystemObjectReports(uploadArguments);
}

/**
 * uploads all cartridges to the server and activates code version
 */
if (options.deployCartridges) {
    console.log(chalk.green('Starting deployCartridges routine...'));

    if (checkForDwJson()) {
        console.log(chalk.green('Loading SFCC instance credentials from build_tools/dw.json'));
    } else {
        console.log(chalk.yellow('Could not find build_tools/dw.json file. Continuing with command line arguments.'));
    }

    const dwupload = dwuploadModule();
    let uploadArguments = getUploadOptions();

    if (!uploadArguments.hostname) {
        console.log(chalk.red('Error: Please provide a hostname to deploy cartridges!'));
        process.exit(0);
    } else if (!uploadArguments.username) {
        console.log(chalk.red('Error: Please provide a username to deploy cartridges!'));
        process.exit(0);
    } else if (!uploadArguments.password) {
        console.log(chalk.red('Error: Please provide a password to deploy cartridges!'));
        process.exit(0);
    }

    // creates a version.properties file if "version-cartridge-name" was specified as a command line argument
    createVersionProperties(uploadArguments);

    var commandLineArgs = [];
    Object.keys(uploadArguments).forEach((uploadOption) => {
        if (uploadOption !== 'hostname' && uploadOption !== 'activationHostname') {
            if (uploadArguments[uploadOption]) {
                commandLineArgs.push('--' + uploadOption, uploadArguments[camelCase(uploadOption)]);
            } else if (options[uploadOption]) {
                commandLineArgs.push('--' + uploadOption, options[camelCase(uploadOption)]);
            }
        }
    });

    // include all the cartridges from the package.json file
    var cartridges = getCartridges(packageFile);
    if (cartridges.length > 0) {
        commandLineArgs.push('--cartridge', cartridges.join(','));
    }

    // loop through each hostname provided and upload to the SFCC server
    if (uploadArguments.hostname && uploadArguments.hostname.length > 0) {
        uploadArguments['hostname'].forEach((hostname) => {
            console.log(chalk.blue('Uploading code to host: ' + hostname));
            let argsClone = commandLineArgs.slice(0);
            argsClone.push('--hostname', hostname);
            const dwuploadScript = 'cd ./cartridges && ' + dwupload + ' ' + argsClone.join(' ');
            shell.exec(dwuploadScript);
        });
    }

    // activate code version
    uploadArguments = activateCodeVersion(uploadArguments);
}

// activates code version
if (options.activateCodeVersion) {
    const uploadArguments = getUploadOptions();
    activateCodeVersion(uploadArguments);
}
