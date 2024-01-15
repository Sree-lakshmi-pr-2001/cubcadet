'use strict';

const notifier = require('node-notifier');
const linter = require('../../lint/lint-js');

/**
 * A custom Webpack plugin to lint client-side JS files
 */
module.exports = class LintJsPlugin {
    constructor(options) {
        this.notifications = options.notifications;
    }

    apply(compiler) {
        compiler.hooks.beforeRun.tap('LintJsPlugin', () => {
            process.webpack.activeJsCompilers++;
        });

        compiler.hooks.watchRun.tap('LintJsPlugin', () => {
            process.webpack.activeJsCompilers++;
        });

        compiler.hooks.done.tap('LintJsPlugin', () => {
            process.webpack.activeJsCompilers--;
            if (!process.webpack.activeJsCompilers) {
                const isSuccessful = linter.lintClientJsFiles();
                if (!isSuccessful && this.notifications) {
                    notifier.notify({
                        title: 'Client-side JS Linter',
                        message: 'Linting issues found! See console'
                    });
                }
            }
        });
    }
};
