'use strict';

const path = require('path');
const glob = require('glob');

/**
 * Get all client-side JS files
 * @returns {Array} - an array of files
 */
exports.getClientJsFiles = () =>
    glob.sync(path.resolve('cartridges', '*', 'cartridge/client', '*', 'js', '**', '*.js')
);

/**
 * Get all server-side JS files
 * @returns {Array} - an array of files
 */
exports.getServerJsFiles = () =>
    glob.sync(path.resolve('cartridges', '**', '*.js'),
        {
            ignore: [
                path.resolve(process.cwd(), 'cartridges', '*', 'cartridge/client', '**'),
                path.resolve(process.cwd(), 'cartridges', '*', 'cartridge/static', '**')
            ]
        }
);

/**
 * Get all JS files in the build_tools directory
 * @returns {Array} - an array of files
 */
exports.getBuildToolsJsFiles = () =>
    glob.sync(path.resolve('build_tools', '**', '*.js')
);

/**
 * Get all Scss files
 * @returns {Array} - an array of files
 */
exports.getScssFiles = () =>
    glob.sync(path.resolve('cartridges', '*', 'cartridge/client', '*', 'scss', '**', '*.scss')
);

/**
 * Get all JSON files
 * @returns {Array} - an array of files
 */
exports.getJsonFiles = () =>
    glob.sync(path.resolve('**', '*.json'),
        {
            ignore: path.resolve(process.cwd(), 'node_modules', '**')
        }
);
