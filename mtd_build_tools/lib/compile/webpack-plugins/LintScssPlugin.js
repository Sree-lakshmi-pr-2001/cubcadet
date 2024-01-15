'use strict';

const notifier = require('node-notifier');
const linter = require('../../lint/lint-scss');

/**
 * A custom Webpack plugin to lint client-side Sass files
 */
module.exports = class LintScssPlugin {
    constructor(options) {
        this.notifications = options.notifications;
    }

    apply(compiler) {
        compiler.hooks.beforeRun.tap('LintScssPlugin', () => {
            process.webpack.activeScssCompilers++;
        });

        compiler.hooks.watchRun.tap('LintScssPlugin', () => {
            process.webpack.activeScssCompilers++;
        });

        compiler.hooks.done.tap('LintScssPlugin', async () => {
            process.webpack.activeScssCompilers--;
            if (!process.webpack.activeScssCompilers) {
                const isSuccessful = await linter.lintScssFiles();
                if (!isSuccessful && this.notifications) {
                    notifier.notify({
                        title: 'Scss Linter',
                        message: 'Linting issues found! See console'
                    });
                }
            }
        });
    }
};
