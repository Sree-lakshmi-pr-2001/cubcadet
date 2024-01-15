'use strict';

/**
 * API dependencies
 */
var Status = require('dw/system/Status');

/**
 * Include dependencies
 */
var Util = require('~/cartridge/scripts/helpers/Util');
var SoapServices = require('~/cartridge/scripts/services/SoapServices');
var Logger = require('dw/system/Logger');

/**
 * Export Values of Util script
 */
exports.VALUE = Util.VALUE;

/**
 * Get Token
 *
 * @returns {dw.system.Status} - return status
 */
exports.getToken = function (prequal) {
    var status;
    var code;
    var responseObject;
    try {
        // Make API call
        var result = SoapServices.BrokerService(prequal);
        responseObject = result.object;
        if (!result.ok) {
            status = Status.ERROR;
            code = result.error;
        } else {
            if ('accessTokenResponses' in responseObject && responseObject.accessTokenResponses) {
                status = Status.OK;
                code = 'ERROR';
            } else {
                status = Status.ERROR;
            }
            code = 'OK';
        }
    } catch (e) {
        // var exception = e;
        Util.log.error('{0} - {1}', e, e.stack);
        status = Status.ERROR;
        code = 'SYSTEM_ERROR';
    }

    var responseStatus = new Status(status, code);
    // Add redirect URL data to Status
    if (!responseStatus.isError()) {
        var urlRedirect;
        if(prequal === 'true'){
            if(responseObject.accessTokenResponses.accessTokenResponse[0].entryURLPath){
                urlRedirect = Util.VALUE.APP_DOMAIN.replace(/\/$/i, '') +'/'+ 
                responseObject.accessTokenResponses.accessTokenResponse[0].entryURLPath +'&StoreID=' + 
                Util.VALUE.STORE_ID + '&LanguageCode=en';
                Logger.error('prequal-redirect url when url is coming form response: ' + urlRedirect);
            } else {
                urlRedirect = Util.VALUE.APP_DOMAIN.replace(/\/$/i, '') + Util.VALUE.URL_REDIRECT_PART +
                '?AccessToken=' + responseObject.accessTokenResponses.accessTokenResponse[0].accessToken;
                urlRedirect += '&StoreID=' + Util.VALUE.STORE_ID + '&LanguageCode=en';
                Logger.error('prequal-redirect url when url is not coming form response: ' + urlRedirect);
            }

        } else {
            urlRedirect = Util.VALUE.APP_DOMAIN.replace(/\/$/i, '') + Util.VALUE.URL_REDIRECT_PART +
            '?AccessToken=' + responseObject.accessTokenResponses.accessTokenResponse[0].accessToken;
            urlRedirect += '&StoreID=' + Util.VALUE.STORE_ID + '&LanguageCode=en';  
            Logger.error('non-prequal-redirect url when url is not coming form response: ' + urlRedirect);
        }
        responseStatus.addDetail('url', urlRedirect);

    }
    return responseStatus;
};
