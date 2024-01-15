'use strict';

const uploadUtils = require('../lib/util/upload-utils');
const Confluence = require('confluence-api');
const exec = require('shelljs').exec;
const entities = require('entities');

/**
 * Get a data structure representing combined environment data from the Jenkins build.
 * @param {object} options - A configuration object used to execute the current build.
 * @param {string} options.confluenceExpandMacroId - A valid macro ID for the "expand" macro in Confluence.
 * @returns {object} - A data structure representing this build's report.
 */
function getBuildReportData(options) {
    // defaults
    const buildReportsData = {
        macroId: options.confluenceExpandMacroId,
        number: process.env.BUILD_NUMBER,
        branch: process.env.GIT_BRANCH,
        commit: process.env.GIT_COMMIT,
        changes: ''
    };
    const shellConfig = { silent: true };
    const shellError = 'An error was encountered when trying to access the git data:';

    if (process.env.GIT_PREVIOUS_SUCCESSFUL_COMMIT) {
        const logResponse = exec(`git log ${process.env.GIT_PREVIOUS_SUCCESSFUL_COMMIT}..HEAD --oneline --no-merges`, shellConfig);
        if (!logResponse.stderr) {
            buildReportsData.changes = logResponse.stdout.trim();
        } else {
            console.error(shellError, logResponse.stderr);
        }
    } else {
        const describeResponse = exec('git describe --abbrev=0 --tags', shellConfig);
        if (!describeResponse.stderr) {
            const logResponse = exec(`git log ${describeResponse.stdout.trim()}..HEAD --oneline --no-merges`, shellConfig);
            if (!logResponse.stderr) {
                buildReportsData.changes = logResponse.stdout.trim();
            } else {
                console.error(shellError, logResponse.stderr);
            }
        } else {
            console.error(shellError, describeResponse.stderr);
        }
    }

    return buildReportsData;
}

/**
 * Create an HTML string from the build reports data structure.
 * @param {object} buildReportsData - A data structure representing this build's report.
 * @returns {string} - An HTML string for representing this build's report data.
 */
function createBuildReportHTML(buildReportsData) {
    let changes = 'No changes.';

    if (buildReportsData.changes.length) {
        changes = entities.encodeXML(buildReportsData.changes).replace(/(\r\n|\r|\n)/g, '<br />');
    }

    return `<h2>Build #${buildReportsData.number} Report</h2><hr />` +
        `<p><strong>Git Commit: ${buildReportsData.branch} : ${buildReportsData.commit}</strong></p>` +
        '<ac:structured-macro ac:name="expand" ac:schema-version="1" ac:macro-id="${buildReportsData.macroId}">' +
        `<ac:rich-text-body>${changes}</ac:rich-text-body>` +
        '</ac:structured-macro>';
}

/**
 * Post HTML string for representing the build reports data to a LYONSCG Confluence space.
 * @param {object} options - A configuration object used to execute the current build.
 * @param {string} options.atlassianUsername - A valid Atlassian username.
 * @param {string} options.atlassianApiKey - A valid Atlassian API Key.
 * @param {string} options.confluenceBaseUrl - The base URL for the Confluence Space where reports will be posted.
 * @param {string} options.confluenceSpaceKey - A valid Confluence Space Key.
 * @param {string} options.confluenceBuildReportsPage - A valid Confluence Page Title.
 * @param {string} htmlString - An HTML string for representing this build's report data.
 */
function postBuildReportHTML(options, htmlString) {
    const spaceKey = options.confluenceSpaceKey;
    const pageTitle = options.confluenceBuildReportsPage;
    const config = {
        username: options.atlassianUsername,
        password: options.atlassianApiKey,
        baseUrl: options.confluenceBaseUrl
    };
    const confluence = new Confluence(config);

    // retrieve data from the existing 'Build Reports' page
    confluence.getContentByPageTitle(spaceKey, pageTitle, (err, data) => {
        if (!err) {
            // prepend new data to existing and update
            const pageBody = htmlString + data.results['0'].body.storage.value;
            const newVersionNumber = ++data.results[0].version.number;
            const pageID = data.results[0].id;

            // post and replace page content with updated data
            confluence.putContent(spaceKey, pageID, newVersionNumber, pageTitle, pageBody, (err) => {
                if (!err) {
                    console.log(`${pageTitle} Confluence page updated.`);
                } else {
                    console.error(`An error occurred when trying to update the ${pageTitle} Confluence page:\n`, err);
                }
            }, true);
        } else {
            console.error(`An error occurred when trying to retrieve the ${pageTitle} Confluence page:\n`, err);
        }
    });
}

/**
 * Post build report updates to Confluence using the currently deployed version's changelog.
 * @param {Object} cliArgs - An options object created by optionator containing CLI arguments.
 */
module.exports = cliArgs => {
    const options = uploadUtils.mergeUploadProperties(cliArgs);
    const buildReportsData = getBuildReportData(options);
    const htmlString = createBuildReportHTML(buildReportsData);

    postBuildReportHTML(options, htmlString);
};
