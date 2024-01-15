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

/**
 * Export Values of Util script
 */
exports.VALUE = Util.VALUE;

/**
 * Get Token
 * @param {Object} data - data object
 * @returns {dw.system.Status} - return status
 */
exports.getCardNumber = function (data) {
    var status;
    var code;
    var responseObject;
    try {
        // Make API call
        var result = SoapServices.CardholderService.call(data);
        responseObject = result.object;
        if (!result.ok) {
            status = Status.ERROR;
            code = result.error;
        } else {
            if ('validationResponse' in responseObject && responseObject.validationResponse
                && responseObject.validationResponse.returnCode !== 1) {
                status = Status.ERROR;
                code = 'ERROR';
            } else {
                status = Status.OK;
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
    // Add card number
    if (!responseStatus.isError()) {
        var accountNumber = null;
        var openToBuy = null;
        if (responseObject.custCareT1GetResponses.custCareT1GetResponses[0].result > 0) {
            var custCares = responseObject.custCareT1GetResponses.custCareT1GetResponses[0].custCares;
            if (custCares.length > 0) {
                accountNumber = custCares[0].accountNumber.toString().replace(/^[0]{3}/i, '');
                openToBuy = Number(custCares[0].openToBuy);
            }
        }
        responseStatus.addDetail('accountNumber', accountNumber);
        responseStatus.addDetail('openToBuy', openToBuy);
    }
    return responseStatus;
};
