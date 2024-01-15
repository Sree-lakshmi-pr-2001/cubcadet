'use strict';

/**
 * Filters a string to change it to camel case
 * @param {string} str - input string to process
 * @returns {string} - processed for camel case
 */

function camelCase(str) {
    return str.replace(/^.|-./g, (letter, index) => {
        if (!index) {
            return letter.toLowerCase();
        }

        return letter.substr(1).toUpperCase();
    });
}

/**
 * Create parameter string for use with Istanbul testing
 * @param {*} option -
 * @param {*} command -
 * @returns {string} commandLine
 */
function createIstanbulParameter(option, command) {
    let commandLine = ' ';
    if (option) {
        commandLine = option.split(',').map(commandPath => ' -' + command + ' ' + commandPath.join(' ') | ' ');
    }
    return commandLine;
}

module.exports = {
    camelCase,
    createIstanbulParameter
};
