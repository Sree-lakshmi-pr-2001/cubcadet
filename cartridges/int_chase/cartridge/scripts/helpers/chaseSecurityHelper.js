'use strict';
/* global empty */

var Site = require('dw/system/Site');

/**
 * Validates the endpoint from the request
 * @param {string} endpoint site endpoint
 * @param {string} responseSiteID the siteID/site name from the service response
 * @returns {boolean} true/false
 */
function validateEndpoint(endpoint, responseSiteID) {
    var result = false;
    var siteID = '';
    var siteIdObject = !empty(Site.current.getCustomPreferenceValue('safetechWebsiteShortName')) ? Site.current.getCustomPreferenceValue('safetechWebsiteShortName') : null;
    var siteApiKey = !empty(Site.current.getCustomPreferenceValue('safetechAPIKey')) ? Site.current.getCustomPreferenceValue('safetechAPIKey') : null;

    if (!empty(siteIdObject)) {
        siteID = siteIdObject.displayValue;
    }

    if (!empty(siteApiKey) && !empty(endpoint) && !empty(siteID) && !empty(responseSiteID)) {
        if (siteApiKey === endpoint && siteID.toLowerCase() === responseSiteID.toLowerCase()) {
            result = true;
        }
    }
    return result;
}

module.exports = {
    validateEndpoint: validateEndpoint
};
