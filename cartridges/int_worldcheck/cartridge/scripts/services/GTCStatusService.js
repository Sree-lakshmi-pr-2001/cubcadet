'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site').getCurrent();

var credentialErrorMsg = 'Missing service user value (groupId)';


function checkCompliance(firstName, lastName, countryCode) {
    if (empty(firstName) || empty(lastName) || empty(countryCode)) {
        return {
            error: true,
            errorMessage: 'Missing required parameters'
        };
    }

    var params = {
        entityType: 'INDIVIDUAL',
        groupId: '', // Is set on the service call, the value is saved on the service user
        name: firstName + lastName,
        providerTypes: [
            'WATCHLIST'
        ],
        secondaryFields: [
            {
                typeId: 'SFCT_3',
                value: countryCode == 'CA' ? 'CAN' : 'USA'
            }
        ]
    };

    var result = checkGTCStatusCall(params);
    if (!result.error && result.results && result.results.length == 0) {
        return {
            isGTCApproved: true
        };
    } else if (!result.error && result.results && result.results.length > 0) {
        return {
            isGTCApproved: false,
            response: result
        };
    }

    // If it reaches this code it means an error happened, we can return it to treat the error outside
    return result;
}

function checkGTCStatusCall(params) {
    var checkGTCStatusService = LocalServiceRegistry.createService('gtc.world.check.rest', {
        createRequest: function (service) {
            var serviceUser = service.getConfiguration().getCredential().getUser();
            var servicePassword = service.getConfiguration().getCredential().getPassword();
            var serviceUrl = service.getConfiguration().getCredential().getURL();
            if (empty(serviceUser)) {
                throw new Error(credentialErrorMsg);
            }
            serviceUrl = serviceUrl + servicePassword;
            params.groupId = serviceUser;
            service.setRequestMethod('POST');
            service.addHeader('Content-Type', 'application/json');
            service.setURL(serviceUrl);
            return JSON.stringify(params);
        },
        parseResponse: function (service, response) {
            return response.text;
        }
    });

    try {
        var httpResponse = checkGTCStatusService.call();
        return responseFilter(httpResponse);
    } catch (e) {
        Logger.getLogger('GTC Status Call', '').fatal('Error: GTC Status Call was interrupted: {0}', e.toString());
        return {error: true};
    }
}

/**
 * Filters the service response object.
 * Returns error details if unsuccessful. Otherwise, the response JSON.
 */
function responseFilter(httpResponse) {
    if (httpResponse.status != 'OK') {
        Logger.error(httpResponse.status + ' error occurred ' + JSON.parse(httpResponse.getErrorMessage()));
        var errorResult = {
            error: true,
            statusCode: httpResponse.status,
            errorMessage: JSON.parse(httpResponse.getErrorMessage())
        };
        return errorResult;
    } else {
        // return a plain javascript object
        return JSON.parse(httpResponse.object);
    }
}

module.exports = {
    checkCompliance: checkCompliance
};
