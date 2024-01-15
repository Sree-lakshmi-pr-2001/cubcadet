'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site').getCurrent();

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var Calendar = require('dw/util/Calendar');
const customObjectName = 'SFDCAuthToken';

// var sfdcHelper = require('~/cartridge/scripts/helpers/sfdcAuthHelper');
var credentialErrorMsg = 'Missing Required service creds ';

function getSFDCAuthToken(generateNewToken) {
    var responseObject;
    var token = null;
    try {
        // Verify if we have a valid token in CO
        if (!generateNewToken) {
            token = getSFDCTokenFromCO();
        }
        // If generateNewToken or we don't have a valid token in CO
        if (generateNewToken || !token) {
            // Make API call
            var authResult = getSFDCAuthTokenByApi();
            if (authResult && authResult.Result.access_token) {
                token = authResult.Result.access_token;
                // Save token data to CO
                saveNewSFDCToken(authResult.Result);
            }
        }
    } catch (e) {
        Logger.error('Error: getSFDCAuthToken was interrupted: {0}', e.toString());
    }

    return token;
}

function getSFDCAuthTokenByApi() {

    let sfdcClientId = getSitePreference('sfdcClientId');
    let sfdcClientSecret =getSitePreference('sfdcClientSecret');

    var sfdcAuthService = LocalServiceRegistry.createService('sfdc.rest.auth', {
        createRequest: function (service) {
            var serviceUser = service.getConfiguration().getCredential().getUser();
            var servicePassword = service.getConfiguration().getCredential().getPassword();
            if (empty(serviceUser)) {
                throw new Error(credentialErrorMsg);
            }
            var serviceUrl = service.configuration.credential.URL;
            service.setRequestMethod('POST');
            service.addHeader('Content-Type', 'application/json');
            serviceUrl += '?client_id=' + sfdcClientId;
            serviceUrl += '&client_secret=' + sfdcClientSecret;
            serviceUrl += '&username=' + serviceUser;
            serviceUrl += '&password=' + servicePassword;
            serviceUrl += '&grant_type=' + 'password';
            service.setURL(serviceUrl);
            return null;
        },
        parseResponse: function (service, response) {
            return response.text;
        }
    });

    try {
        var httpResponse = sfdcAuthService.call();
        return responseFilter(httpResponse);
    } catch (e) {
        Logger.getLogger('SFDC Auth Call', '').fatal('Error: SFDC Auth Call was interrupted: {0}', e.toString());
        return {error: true};
    }
}

function updateSFDCStatus(sfdcCaseNumber,sfccOrderNo,totalPrice,orderStatus) {
    if (empty(sfdcCaseNumber) || empty(sfccOrderNo) || empty(totalPrice) || empty(orderStatus)) {
        return {
            error: true,
            errorMessage: 'Missing required parameters'
        };
    }
    var params = {
        epcotOrderNumber: sfccOrderNo,
        epcotOrderStatus: orderStatus,
        epcotOrderTotal: totalPrice,
        CaseNumber: sfdcCaseNumber
    };

    var result = sfdcServiceCall(sfdcCaseNumber, params, 'PATCH');
    if (!result.error) {
        return {
            isOrderSynced: true
        };
    } else if (result.error) {
        return {
            isOrderSynced: false,
            response: result
        };
    }

    // If it reaches this code it means an error happened, we can return it to treat the error outside
    return result;
}

function getSFDCCaseDetails(sfdcCaseNumber) {
    if (empty(sfdcCaseNumber)) {
        return {
            error: true,
            errorMessage: 'Required Case Number'
        };
    }
    
    var result = sfdcServiceCall(sfdcCaseNumber, null, 'GET');
    if (!result.error && result.Result) {
        return {
            response: result
        };
    } else if (result.error) {
        return {
            response: result
        };
    }

    // If it reaches this code it means an error happened, we can return it to treat the error outside
    return result;
}

function sfdcServiceCall(sfdcCaseNumber, params, requestType) {
    var updateSFDCStatus = LocalServiceRegistry.createService('sfdc.casedetails', {
        createRequest: function (service) {
            var serviceUrl = service.getConfiguration().getCredential().getURL();
            if (empty(serviceUrl)) {
                throw new Error(credentialErrorMsg);
            }
            serviceUrl = serviceUrl  + sfdcCaseNumber;
            service.setRequestMethod(requestType);
            service.addHeader('Content-Type', 'application/json');
            service.addHeader('Sforce-Auto-Assign',false);
            var token = getSFDCAuthToken(false);
            if (!token) {
                getSFDCAuthToken(true);
            }
            service.addHeader('Authorization' ,'Bearer ' + token);
            service.setURL(serviceUrl);
            return params ? JSON.stringify(params) : null;
        },
        parseResponse: function (service, response) {
            return response.text;
        }
    });

    try {
        var httpResponse = updateSFDCStatus.call();
        return responseFilter(httpResponse);
    } catch (e) {
        Logger.getLogger('SFDC Status Call', '').fatal('Error: SFDC Status Call was interrupted: {0}', e.toString());
        return {error: true};
    }
}


function getSFDCTokenFromCO() {
    
    var sfdcToken = null;
    var siteId = Site.current.ID;
    // Get all tokens
    var tokenObj = CustomObjectMgr.getCustomObject(customObjectName, siteId);
    if (tokenObj) {
        var tokenCreationDate = tokenObj.lastModified || tokenObj.creationDate;
        var tokenExpiresInSeconds = tokenObj.custom.tokenExpiresInSeconds;
        var currentCalendar = new Calendar();
        var expireCalendar = new Calendar(tokenCreationDate);
        expireCalendar.add(Calendar.SECOND, tokenExpiresInSeconds);
        // Check if token is still valid
        if (currentCalendar.compareTo(expireCalendar) <= 0) {
            sfdcToken = tokenObj.custom.accessToken;
        }
    }

    return sfdcToken;
};

function saveNewSFDCToken(tokenData) {

    var siteId = Site.current.ID;
    // Get all tokens
    var tokenObj = CustomObjectMgr.getCustomObject(customObjectName, siteId);

    // Save a new token
    Transaction.wrap(function () {
        // Create an object if it doesn't exist
        if (!tokenObj) {
            tokenObj = CustomObjectMgr.createCustomObject(customObjectName, siteId);
            tokenObj.custom.tokenExpiresInSeconds = 72000;
        }
        tokenObj.custom.accessToken = tokenData.access_token;
        tokenObj.custom.refreshToken = tokenData.refresh_token;
        tokenObj.custom.tokenType = tokenData.token_type;
    });

    Logger.info('SFDC token details updated successfully in Custom Object');
};

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
            errorCode: httpResponse.error,
            errorMessage: JSON.parse(httpResponse.getErrorMessage())
        };
        return errorResult;
    } else {
        // return a plain javascript object
        var okResult = {
            error: false,
            statusCode: httpResponse.status,
            Result: JSON.parse(httpResponse.object)
        };
        return okResult;
        //return JSON.parse(httpResponse.object);
    }
}

function getSitePreference(key) {
    return Site.getCurrent().getCustomPreferenceValue(key);
}

module.exports = {
    updateSFDCStatus: updateSFDCStatus,
    getSFDCAuthToken: getSFDCAuthToken,
    getSFDCCaseDetails: getSFDCCaseDetails
};
