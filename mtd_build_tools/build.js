#!/usr/bin/env node

'use strict';

const spawn = require('child_process').spawn;
const path = require('path');
const chalk = require('chalk');
const optionatorConfig = require('./lib/util/optionator');
const stringUtils = require('./lib/util/string-utils');
const uploadUtils = require('./lib/util/upload-utils');
const optionator = require('optionator')(optionatorConfig);
const deployCartridges = require('./tasks/deployCartridges');
const deployData = require('./tasks/deployData');
// const activateCodeVersion = require('./tasks/activateCodeVersion');
const linter = require('./tasks/lint');
const generateBuildReports = require('./tasks/buildReport');
const generateSystemObjectReports = require('./tasks/systemObjectsReport');
const createCartridge = require('./tasks/createCartridge');
const clean = require('./tasks/clean');

let cwd = process.cwd();
const folderName = cwd.split(path.sep).pop();
if (folderName === 'mtd_build_tools') {
    process.chdir('../');
    cwd = process.cwd();
}

const options = optionator.parse(process.argv);
// console.log("options:");
// console.log(JSON.stringify(options));
const packageFile = uploadUtils.getPackageJson();

console.log(chalk.bgYellow.black.bold(`Starting LyonsCG Build Script v${packageFile.lcgversion} ` +
                                      `for SFRA v${packageFile.version}`));

/* Help */
if (options.help) {
    console.log(optionator.generateHelp());
    process.exit(0);
}

/* Lint */
if (options.lint) {
    let types = options._;
    if (!types.length) {
        // types = ['server-js', 'client-js', 'scss', 'json', 'build-tools'];
        types = ['server-js', 'client-js', 'scss'];
    }

    // Disable the linter's cache git commit and production builds
    if (options.lintNoCache) {
        process.env.lintNoCache = true;
    }

    linter.run(types);
}

// /* Activate Code Version */
// if (options.activateCodeVersion) {
//     activateCodeVersion(options);
// }

/* Deploy Code */
if (options.deployCartridges) {
    deployCartridges(options);
}

/* Deploy Data */
if (options.deployData) {
    deployData(options);
}

/* Unit Tests */
if (options.test) {
    const mocha = path.resolve(cwd, './node_modules/.bin/_mocha');
    const subprocess = spawn(
        mocha +
        ' --reporter spec ' +
        options.test.join(' '), { stdio: 'inherit', shell: true, cwd });

    subprocess.on('exit', code => {
        process.exit(code);
    });
}

if (options.cover) {
    const istanbul = path.resolve(cwd, './node_modules/.bin/istanbul');
    const mocha = path.resolve(cwd, './node_modules/mocha/bin/_mocha');

    const subprocess = spawn(
        istanbul +
        ' cover ' +
        stringUtils.createIstanbulParameter(options.exclude, 'x') +
        stringUtils.createIstanbulParameter(options.include, 'i') +
        mocha +
        ' -- -R spec test/unit/**/*.js', { stdio: 'inherit', shell: true, cwd });

    subprocess.on('exit', code => {
        process.exit(code);
    });
}

/* Generate System Object Report */
if (options.systemObjectReport) {
    console.log(chalk.green('Generating System Objects Report'));
    generateSystemObjectReports(options);
}

/* Generate Build Report */
if (options.buildReport) {
    console.log(chalk.green('Generating Build Report'));
    generateBuildReports(options);
}

/* Create Cartridge */
if (options.createCartridge) {
    const cartridgeName = options.createCartridge;
    console.log(chalk.green('Creating folders and files for cartridge ' + cartridgeName));
    createCartridge(cartridgeName, cwd);
}

if (options.clean) {
    clean();
}
