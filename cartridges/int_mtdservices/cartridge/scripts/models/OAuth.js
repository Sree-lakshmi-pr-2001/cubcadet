'use strict';

/**
 * API dependencies
 */

/**
 * Include dependencies
 */
var Util = require('~/cartridge/scripts/helpers/Util');
var RestServices = require('~/cartridge/scripts/services/RestServices');

/**
 * Export Values of Util script
 */
exports.VALUE = Util.VALUE;

/**
 * Retrieve a token
 *
 * @param {boolean} forceApiCall - pass true if you want to have API call to service anyway
 * @returns {string} - return token
 */
exports.getToken = function (forceApiCall) {
    var responseObject;
    var token = null;
    try {
        // Verify if we have a valid token in CO
        if (!forceApiCall) {
            token = Util.getValidTokenFromCO();
        }
        // If we force API call or we don't have a valid token in CO
        if (forceApiCall || !token) {
            // Make API call
            var result = RestServices.OAuthService.call({
                clientId: Util.VALUE.CLIENT_ID,
                clientSecret: Util.VALUE.CLIENT_SECRET,
                username: Util.VALUE.USERNAME,
                password: Util.VALUE.PASSWORD,
                grantType: Util.VALUE.GRANT_TYPE
            });
            responseObject = result.object;
            if (result.ok) {
                token = responseObject.access_token;
                // Save token data to CO
                Util.saveNewToken(responseObject);
            }
        }
    } catch (e) {
        // var exception = e;
        Util.log.error('{0} - {1}', e, e.stack);
    }

    return token;
};
