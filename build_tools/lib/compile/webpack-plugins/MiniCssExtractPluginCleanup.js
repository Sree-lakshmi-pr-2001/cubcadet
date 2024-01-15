/* eslint-disable */
'use strict';

const minimatch = require('minimatch');

/**
 * A custom Webpack plugin to remove unneeded JavaScript files that
 * are generated during the Scss compilation
 */
module.exports = class MiniCssExtractPluginCleanup {
    apply(compiler) {
        compiler.hooks.emit.tapAsync('MiniCssExtractPluginCleanup', (compilation, callback) => {
            Object.keys(compilation.assets)
                .filter(asset => {
                    return ['*/css/**/*.js', '*/css/**/*.js.map'].some(pattern => {
                        return minimatch(asset, pattern);
                    });
                })
                .forEach(asset => {
                    delete compilation.assets[asset];
                });

            callback();
        });
    }
};
