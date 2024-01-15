'use strict';

const chalk = require('chalk');
const globs = require('../util/globs');
const CLIEngine = require('eslint').CLIEngine;

/**
 * Lint files using ESLint
 * https://eslint.org/docs/developer-guide/nodejs-api#cliengineexecuteonfiles
 * @param {Array} files - an array of files
 * @return {Object} - ESLint results object
 */
function lint(files) {
    const eslint = new CLIEngine({
        cache: !process.env.lintNoCache
    });
    return eslint.executeOnFiles(files);
}

/**
 * Format the ESLint report object
 * https://eslint.org/docs/developer-guide/nodejs-api#cliengineexecuteonfiles
 * @param {Object} result - ESLint results object
 * @param {string} fileTypeString - context / type of JS file
 * @return {Object} - formatted results object
 */
function formatResult(result, fileTypeString) {
    const formatter = new CLIEngine().getFormatter();

    if (result.errorCount) {
        return {
            isSuccessful: false,
            message: chalk.red('Linting issues were found!\n') +
                              'The following issues need to be resolved prior to committing\n' +
                              `${formatter(result.results)}`
        };
    }

    return {
        isSuccessful: true,
        message: `${chalk.green(`Linted ${fileTypeString} successfully\n`)}`
    };
}

/**
 * Lint client-side JS files
 * @returns {boolean} isSuccessful
 */
exports.lintClientJsFiles = () => {
    const fileTypeString = 'client-side JS files';
    console.log(`Linting ${fileTypeString}`);

    const files = globs.getClientJsFiles();
    const result = lint(files);
    const { message, isSuccessful } = formatResult(result, fileTypeString);
    console.log(message);

    return isSuccessful;
};

/**
 * Lint server-side JS files
 * @returns {boolean} isSuccessful
 */
exports.lintServerJsFiles = () => {
    const fileTypeString = 'server-side JS files';
    console.log(`Linting ${fileTypeString}`);

    const files = globs.getServerJsFiles();
    const result = lint(files);
    const { message, isSuccessful } = formatResult(result, fileTypeString);
    console.log(message);

    return isSuccessful;
};

/**
 * Lint JS files in the build_tools directory
 * @returns {boolean} isSuccessful
 */
exports.lintBuildToolsJSFiles = () => {
    const fileTypeString = 'Build Tools JS files';
    console.log(`Linting ${fileTypeString}`);

    const files = globs.getBuildToolsJsFiles();
    const result = lint(files);
    const { message, isSuccessful } = formatResult(result, fileTypeString);
    console.log(message);

    return isSuccessful;
};
