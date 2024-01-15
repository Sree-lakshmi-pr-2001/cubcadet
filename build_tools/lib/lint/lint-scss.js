'use strict';

const chalk = require('chalk');
const path = require('path');
const globs = require('../util/globs');
const stylelint = require('stylelint');

/**
 * Lint files using stylelint
 * https://github.com/stylelint/stylelint/blob/master/docs/user-guide/node-api.md
 * @param {Array} files - an array of files
 * @return {Promise} - stylelint results
 */
function lint(files) {
    return stylelint.lint({
        configFile: path.resolve(process.cwd(), '.stylelintrc.json'),
        cache: !process.env.lintNoCache,
        files,
        syntax: 'scss',
        formatter: 'string'
    });
}

/**
 * Format the stylelint result object
 * https://github.com/stylelint/stylelint/blob/master/docs/user-guide/node-api.md
 * @param {Object} result - stylelint results object
 * @return {Object} - formatted results object
 */
function formatResult(result) {
    if (result.errored) {
        return {
            isSuccessful: false,
            message: chalk.red('Linting issues were found!\n') +
                             'The following issues need to be resolved prior to committing\n' +
                             `${(result.output)}`
        };
    }

    return {
        isSuccessful: true,
        message: `${chalk.green('Linted Scss files successfully\n')}`
    };
}

/**
 * Lint Scss files
 * @returns {boolean} isSuccessful
 */
exports.lintScssFiles = async () => {
    console.log('Linting Scss files');

    const files = globs.getScssFiles();
    const result = await lint(files);
    const { message, isSuccessful } = formatResult(result);
    console.log(message);

    return isSuccessful;
};
