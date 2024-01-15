'use strict';

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const xml2js = require('xml2js');
const Confluence = require('confluence-api');
const entities = require('entities');
const uploadUtils = require('../lib/util/upload-utils');

const pwd = path.join(__dirname, '..');
const packageFile = uploadUtils.getPackageJson();
const dataOptions = packageFile.deployment.dataOptions;
const dataBundles = packageFile.deployment.dataBundles;

/**
 * Get array of file paths using configured data bundle.
 * @param {array} dataBundle - An array of data bundle directory names.
 * @returns {array} - An array of system object xml file paths.
 */
function getMetaDataFilePaths(dataBundle) {
    const files = [];

    dataBundle.forEach(bundleDirectory => {
        const dataFiles = glob.sync(path.join(path.resolve(pwd, dataOptions.archivePath), bundleDirectory, 'meta/[!_]*.xml'));

        dataFiles.forEach(file => { files.push(file) });
    });

    return files;
}

/**
 * Get a data structure representing the combined data from system object xml files.
 * @param {array} files - An array of system object xml file paths.
 * @returns {object} - A data structure representing the system objects.
 */
function getSystemObjectsData(files) {
    const parser = new xml2js.Parser(); // set up parser and convert XML file to JS
    const systemObjectsData = {};

    // read each file in order and add to data structure
    files.map(fileIn => {
        parser.parseString(fs.readFileSync(fileIn, { encoding : 'utf8' }), (err, result) => {
            if (!err) {
                // only read from system object extensions
                if (result.metadata.hasOwnProperty('type-extension')) {
                    console.log('System Object extensions found: ' + fileIn);

                    // iterate over each system object type extension
                    let xmlSystemObjects = result.metadata['type-extension'];
                    if (xmlSystemObjects) {
                        xmlSystemObjects.forEach(xmlSystemObject => {

                            // create new property and object for system object, if needed
                            let systemObjectTypeID = xmlSystemObject.$['type-id'];
                            if (!systemObjectsData.hasOwnProperty(systemObjectTypeID)) {
                                systemObjectsData[systemObjectTypeID] = {
                                    attributes: {},
                                    groups: {}
                                };
                            }

                            // add any group definitions to data structure
                            addSystemObjectGroupData(systemObjectsData[systemObjectTypeID], xmlSystemObject);

                            // add any custom attributes to data structure
                            if (xmlSystemObject['custom-attribute-definitions'] && xmlSystemObject['custom-attribute-definitions'][0]) {
                                addSystemObjectAttributesData(systemObjectsData[systemObjectTypeID], xmlSystemObject['custom-attribute-definitions'][0]['attribute-definition']);
                            }

                            // add any system attributes to data structure
                            if (xmlSystemObject['system-attribute-definitions'] && xmlSystemObject['system-attribute-definitions'][0]) {
                                addSystemObjectAttributesData(systemObjectsData[systemObjectTypeID], xmlSystemObject['system-attribute-definitions'][0]['attribute-definition']);
                            }
                        });
                    }
                }
            } else {
                console.error(`An error occurred when trying to parse ${fileIn}:\n`, err);
            }
        });
    });

    return systemObjectsData;
}

/**
 * Add the group definitions to system objects data structure using data parsed from xml.
 * @param {object} systemObjectsData - A data structure representing the system objects.
 * @param {object} xmlSystemObject - A single system object's data, parsed from the xml file.
 */
function addSystemObjectGroupData(systemObjectsData, xmlSystemObject) {
    if (xmlSystemObject.hasOwnProperty('group-definitions')) {
        const groups = xmlSystemObject['group-definitions'][0]['attribute-group'];
        groups.forEach(group => {
            const groupName = group.$['group-id'],
                groupAttributes = group.attribute || [];

            // push all attributes into new group array, since system object groups can only be defined once in bundles
            systemObjectsData.groups[groupName] = [];

            groupAttributes.forEach(groupAttribute => {
                const attributeID = groupAttribute.$['attribute-id'];

                systemObjectsData.groups[groupName].push(attributeID);
            });
        });
    }
}

/**
 * Add the attribute definitions to system objects data structure using data parsed from xml.
 * @param {object} systemObjectsData - A data structure representing the system objects.
 * @param {object} xmlSystemObjectAttributes - A single system object's attribute data, parsed from the xml file.
 */
function addSystemObjectAttributesData(systemObjectsData, xmlSystemObjectAttributes) {
    xmlSystemObjectAttributes.forEach(xmlAttribute => {
        const attributeID = xmlAttribute.$['attribute-id'];
        if (!systemObjectsData.attributes.hasOwnProperty(attributeID)) {
            systemObjectsData.attributes[attributeID] = { groups: [] };
        }

        const attribute = systemObjectsData.attributes[attributeID];

        // migrate attribute data from XML to data structure
        attribute['display-name'] = xmlAttribute['display-name'] ? xmlAttribute['display-name'][0]._ : '';
        attribute['type'] = xmlAttribute['type'] || '';
        attribute['description'] = xmlAttribute['description'] ? xmlAttribute['description'][0]._ : '';
        attribute['mandatory-flag'] = xmlAttribute['mandatory-flag'] || '';
        attribute['externally-managed-flag'] = xmlAttribute['externally-managed-flag'] || '';

        // add assigned groups to data structure
        Object.keys(systemObjectsData.groups).forEach(groupID => {
            // group contains attribute, add group to attribute data if it's not there already
            if (systemObjectsData.groups[groupID].includes(attributeID)) {
                if (!systemObjectsData.attributes[attributeID].groups.includes(groupID)) {
                    systemObjectsData.attributes[attributeID].groups.push(groupID);
                }

            // group doesn't contain attribute, if attribute data contains the group, remove it (group defined twice)
            } else if (systemObjectsData.attributes[attributeID].groups.includes(groupID)) {
                let index = systemObjectsData.attributes[attributeID].groups.indexOf(groupID);

                systemObjectsData.attributes[attributeID].groups.splice(index, 1);
            }
        });
    });
}

/**
 * Create an HTML string from the system object data structure.
 * @param {object} systemObjectsData - A data structure representing the system objects.
 * @returns {string} - An HTML string for representing the system objects data.
 */
function createSystemObjectHTML(systemObjectsData) {
    let htmlString =
        // document heading
        '<h1>System Objects: Custom Attribute Report</h1>' +
        '<p>This page is auto-generated using metadata in the repository. <strong>Do not edit manually.</strong></p>';

    Object.keys(systemObjectsData).forEach(objectID => {
        const systemObject = systemObjectsData[objectID];
        const attributeKeys = Object.keys(systemObject.attributes);
        const groupKeys = Object.keys(systemObject.groups);

        // only add system object to HTML if data has been defined in any way
        if (attributeKeys.length || groupKeys.length) {
            // system object heading
            htmlString +=
                `<h2>${objectID}</h2>` +
                '<hr />';

            // if there are attributes for this object, add attributes table
            if (attributeKeys.length) {
                // start attribute table
                htmlString +=
                    '<h3>Attributes</h3>' +
                    '<table width="100%">' +
                    '<thead>' +
                    '<tr>' +
                    '<th>ID</th>' +
                    '<th>Name</th>' +
                    '<th>Type</th>' +
                    '<th>Description</th>' +
                    '<th>Mandatory</th>' +
                    '<th>Externally Managed</th>' +
                    '<th>Groups</th>' +
                    '</tr>' +
                    '</thead>' +
                    '<tbody>';

                // print attributes data
                attributeKeys.forEach(attributeID => {
                    const attribute = systemObject.attributes[attributeID];

                    htmlString +=
                        '<tr>' +
                        `<td>${attributeID}</td>` +
                        `<td>${attribute['display-name']}</td>` +
                        `<td>${attribute['type']}</td>` +
                        `<td>${attribute['description']}</td>` +
                        `<td>${attribute['mandatory-flag']}</td>` +
                        `<td>${attribute['externally-managed-flag']}</td>` +
                        `<td>${attribute.groups.join(', ')}</td>` +
                        '</tr>';
                });

                // end attributes table
                htmlString +=
                    '</tbody>' +
                    '</table>';
            }

            // if there are groups for this object, add groups table
            if (groupKeys.length) {
                // start groups table
                htmlString +=
                    '<h3>Groups</h3>' +
                    '<table width="100%">' +
                    '<thead>' +
                    '<tr>' +
                    '<th>Name</th>' +
                    '<th>Assigned Attributes</th>' +
                    '</tr>' +
                    '</thead>' +
                    '<tbody>';

                // print groups data
                groupKeys.forEach(groupID => {
                    htmlString +=
                        '<tr>' +
                        `<td>${groupID}</td>` +
                        `<td>${systemObject.groups[groupID].join(', ')}</td>` +
                        '</tr>';
                });

                // end groups table
                htmlString +=
                    '</tbody>' +
                    '</table>';
            }
        }
    });

    return htmlString;
}

/**
 * Post HTML string for representing the system objects data to a LYONSCG Confluence space.
 * @param {object} options - A configuration object used to execute the current build.
 * @param {string} options.atlassianUsername - A valid Atlassian username.
 * @param {string} options.atlassianApiKey - A valid Atlassian API Key.
 * @param {string} options.confluenceBaseUrl - The base URL for the Confluence Space where reports will be posted.
 * @param {string} options.confluenceSpaceKey - A valid Confluence Space Key.
 * @param {string} options.confluenceSystemObjectsPage - A valid Confluence Page Title.
 * @param {string} htmlString - An HTML string for representing the system objects data.
 */
function postSystemObjectsHTML(options, htmlString) {
    const spaceKey = options.confluenceSpaceKey;
    const pageTitle = options.confluenceSystemObjectsPage;
    const config = {
        username: options.atlassianUsername,
        password: options.atlassianApiKey,
        baseUrl: options.confluenceBaseUrl
    };
    const confluence = new Confluence(config);

    // retrieve data from the existing 'System Objects' page
    confluence.getContentByPageTitle(spaceKey, pageTitle, (err, data) => {
        if (!err) {
            // confluence automatically encodes entities, so decode to compare to original for changes
            const pageBody = entities.decodeHTML(data.results['0'].body.storage.value);
            const newVersionNumber = ++data.results[0].version.number;
            const pageID = data.results[0].id;

            // if there are no changes, prevent a new version of the page from being published needlessly
            if (htmlString === pageBody) {
                console.log(`No changes needed to the ${pageTitle} Confluence page.`);
            } else {
                // encode ampersands
                htmlString = htmlString.replace(/&(?!amp;)/g, '&amp;');
                confluence.putContent(spaceKey, pageID, newVersionNumber, pageTitle, htmlString, (err) => {
                    if (!err) {
                        console.log(`${pageTitle} Confluence page updated.`);
                    } else {
                        console.error(`An error occurred when trying to update the ${pageTitle} Confluence page:\n`, err);
                    }
                }, true);
            }
        } else {
            console.error(`An error occurred when trying to retrieve the ${pageTitle} Confluence page:\n`, err);
        }
    });
}

/**
 * Post the system objects data to Confluence using the configured data bundle.
 * @param {Object} cliArgs - An options object created by optionator containing CLI arguments.
 */
module.exports = cliArgs => {
    const options = uploadUtils.mergeUploadProperties(cliArgs);
    const dataBundle = dataBundles[options.dataBundle];
    const files = getMetaDataFilePaths(dataBundle);
    const systemObjectsData = getSystemObjectsData(files);
    const htmlString = createSystemObjectHTML(systemObjectsData);

    postSystemObjectsHTML(options, htmlString);
};
