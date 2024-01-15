'use strict';

/**
 * API dependencies
 */
var Status = require('dw/system/Status');

/**
 * Include dependencies
 */
var Util = require('~/cartridge/scripts/helpers/Util');
var OAuthModel = require('~/cartridge/scripts/models/OAuth');
var RestServices = require('~/cartridge/scripts/services/RestServices');

/**
 * Export Values of Util script
 */
exports.VALUE = Util.VALUE;

/**
 * Verify Address
 *
 * @param {Object} addressRequest - request object
 * @returns {dw.system.Status} - return status of address validation API call
 */
exports.verify = function (addressRequest) {
    var status;
    var code;
    var responseObject;
    try {
        // Verify if we have a tax request param
        if (!addressRequest) {
            throw new Error('No required parameters passed');
        }

        // Make API call
        var token = OAuthModel.getToken();
        var result = RestServices.AddressService.call({
            method: 'POST',
            request: addressRequest,
            authorization: Util.VALUE.AUTH_TYPE + ' ' + token
        });
        responseObject = result.object;
        if (result.ok) {
            status = Status.OK;
            code = 'OK';
        } else {
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
