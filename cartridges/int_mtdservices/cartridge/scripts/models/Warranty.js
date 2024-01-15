'use strict';

/**
 * API dependencies
 */
var Status = require('dw/system/Status');
var StringUtils = require('dw/util/StringUtils');
var Logger = require('dw/system/Logger');

/**
 * Include dependencies
 */
 var Util = require('~/cartridge/scripts/helpers/Util');

/**
 * Export Values of Util script
 */
exports.VALUE = Util.VALUE;

/**
 * Order Inquiry
 *
 * @param {string} orderNumber - model number
 * @param {string} emailAddress - email Address
 * @param {string} postalCode - postal code
 * @returns {dw.system.Status} - return status of manuals search
 */
exports.lookup = function (sourceSystem, sourceOrderSiteId, serialNumber, countryCode) {
    var status;
    var code;
    var responseObject;
    var OAuthModel = require('*/cartridge/scripts/models/OAuth');
    var RestServices = require('*/cartridge/scripts/services/RestServices');

    try {
        // Verify if we have a tax request param
        /* if (!orderNumber) {
            throw new Error('No required parameters passed');
        } */
        var token = OAuthModel.getToken();

        var result = RestServices.AftermarketLookup.call({
            method: 'GET',
            sourceSystem : StringUtils.trim(sourceSystem),
            countryCode : StringUtils.trim(countryCode),
            sourceOrderSiteId : StringUtils.trim(sourceOrderSiteId), 
            serialNumber : StringUtils.trim(serialNumber),
            authorization: Util.VALUE.AUTH_TYPE + ' ' + token
        });
        responseObject = result.object;

        if (result.ok) {
            status = Status.OK;
            code = 'OK';
        } else {
            Logger.info('error retrieving orderNumber :' + orderNumber);
            status = Status.ERROR;
            code = result.error;
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
        responseStatus.addDetail('response', responseObject);
    }
    return responseStatus;
};
