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
 * Authorize credit
 * @param {Object} data - data object
 * @returns {dw.system.Status} - return status
 */
exports.authorize = function (data) {
    var status;
    var code;
    var responseObject;
    try {
        // Make API call
        var result = SoapServices.TransactionService.call({
            data: data,
            type: 'Sale'
        });
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
    // Add redirect URL data to Status
    if (!responseStatus.isError()) {
        responseStatus.addDetail('response', responseObject.responses.responseArray[0]);
    }
    return responseStatus;
};

/**
 * Void credit
 * @param {Object} data - data object
 * @returns {dw.system.Status} - return status
 */
exports.void = function (data) {
    var status;
    var code;
    var responseObject;
    try {
        // Make API call
        var result = SoapServices.TransactionService.call({
            data: data,
            type: 'Void'
        });
        responseObject = result.object;
        if (!result.ok) {
            status = Status.ERROR;
            code = result.error;
        } else {
            if ('validationResponse' in responseObject && responseObject.validationResponse && responseObject.validationResponse.returnCode !== 1) { // eslint-disable-line
                status = Status.ERROR;
                code = 'ERROR';
            } else {
                status = Status.OK;
                code = 'OK';
            }
        }
        Logger.debug('td bank order #' + data.orderNumber + ', status : ' + status + ', code : ' + code);
    } catch (e) {
        // var exception = e;
        Util.log.error('{0} - {1}', e, e.stack);
        status = Status.ERROR;
        code = 'SYSTEM_ERROR';
    }

    var responseStatus = new Status(status, code);
    // Add redirect URL data to Status
    if (!responseStatus.isError()) {
        responseStatus.addDetail('response', responseObject.responses.responseArray[0]);
    }
    return responseStatus;
};
