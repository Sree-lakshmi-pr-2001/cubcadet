/* global session request */
'use strict';

/**
 * API dependencies
 */

/**
 * Include Modules
 */

/**
 * Get Address Validation Request
 *
 * @returns {Object} - return request object
 */
exports.getRequest = function () {
    var userLocale = request.locale;
    var language;
    if (userLocale !== 'default') {
        var localeParts = userLocale.split('_');
        language = localeParts[0];
    } else {
        language = 'en';
    }
    var requestObj = {
        address1: request.httpParameterMap.address1.value,
        address2: (request.httpParameterMap.address2.value) ? request.httpParameterMap.address2.value : '',
        cityOrMunicipality: request.httpParameterMap.city.value,
        country: request.httpParameterMap.countryCode.value.toUpperCase(),
        language: language,
        postalCode: request.httpParameterMap.postalCode.value,
        stateOrProvince: request.httpParameterMap.stateCode.value
    };

    return requestObj;
};
