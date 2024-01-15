'use strict';

/**
 * API dependencies
 */

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var credentialErrorMsg = 'Missing service user value (groupId)';

/**
 * Get distance to Stores
 *
 * @param {Object} addressRequest - address object 
 * @returns {dw.system.Status} - return status of fulfillment API call
 */
exports.verify = function (addressRequest) {

    var checkGoogleAddressValidationervice = LocalServiceRegistry.createService('google.addressvalidation.api', {
        createRequest: function (service) {
            var serviceUser = service.getConfiguration().getCredential().getUser();
            var serviceUrl = service.getConfiguration().getCredential().getURL();
            if (empty(serviceUser)) {
                throw new Error(credentialErrorMsg);
            }
            serviceUrl = serviceUrl + serviceUser;
            service.setRequestMethod('POST');
            service.addHeader('Content-Type', 'application/json');
            service.setURL(serviceUrl);
            return JSON.stringify(addressRequest);
        },
        parseResponse: function (service, response) {
            return response.text;
        }
    });
    var httpResponse = checkGoogleAddressValidationervice.call();
    if (httpResponse.status == 'OK') {
        httpResponse = JSON.parse(httpResponse.object);
        return httpResponse;
    } else {
        httpResponse = '';
    }
};
