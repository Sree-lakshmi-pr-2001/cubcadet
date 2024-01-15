'use strict';

const lintJs = require('../lib/lint/lint-js');
const lintScss = require('../lib/lint/lint-scss');
const lintJson = require('../lib/lint/lint-json');

/**
 * Runs the specified linting routines
 * @param {Array} types - the types of linters to run against the code base
 */
exports.run = async (types) => {
    // Maps command line arguments to functional linting routines
    const linters = {
        'client-js': lintJs.lintClientJsFiles,
        'server-js': lintJs.lintServerJsFiles,
        'scss': lintScss.lintScssFiles, // eslint-disable-line quote-props
        'json': lintJson.lintJsonFiles,  // eslint-disable-line quote-props
        'build-tools': lintJs.lintBuildToolsJSFiles
    };

    const results = [];
    for (const type of types) {
        // Check that the linter is valid
        if (!linters[type]) {
            console.log(`"${type}" is not a valid argument!`);
            process.exit(1);
        }
        // Run the linter and return its result
        const result = await linters[type]();
        results.push(result);
    }

    // If one or more linters found issues, fail the process
    // (this prevents a git commit with the Husky git hooks enabled)
    if (results.includes(false)) {
        process.exit(1);
    }

    return;
};
