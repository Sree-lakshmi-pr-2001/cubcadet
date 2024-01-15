'use strict';

const chalk = require('chalk');
const fs = require('fs');
const globs = require('../util/globs');
const jsonlint = require('jsonlint');

/**
 * Lint files using jsonlint
 * https://github.com/zaach/jsonlint
 * @param {Array} files - an array of files
 * @return {Array} - An array of errors
 */
function lint(files) {
    const results = files.reduce((errors, file) => {
        try {
            jsonlint.parse(fs.readFileSync(file, 'utf8'));
            return errors;
        } catch (error) {
            errors.push({ file, msg: error });
            return errors;
        }
    }, []);
    return results;
}

/**
 * Format the result of any invalid JSON files
 * @param {Array} errors - An array of errors
 * @return {Object} - formatted results object
 */
function formatResult(errors) {
    if (errors.length) {
        let message = `${chalk.red('Linting JSON files failed!\n')}` +
                  'The following issues need to be resolved prior to committing:\n\n';

        for (const error of errors) {
            message += `${chalk.red('Error in file:')} ${chalk.underline(`${error.file}\n`)}`;
            message += `${error.msg}\n\n`;
        }

        return {
            isSuccessful: false,
            message
        };
    }

    return {
        isSuccessful: true,
        message: `${chalk.green('Linted JSON files successfully\n')}`
    };
}

/**
 * Lint JSON files
 * @returns {boolean} isSuccessful
 */
exports.lintJsonFiles = () => {
    console.log('Linting JSON files');

    const files = globs.getJsonFiles();
    const result = lint(files);
    const { message, isSuccessful } = formatResult(result);
    console.log(message);

    return isSuccessful;
};
