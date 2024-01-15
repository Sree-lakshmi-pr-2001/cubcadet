'use strict';

/**
 * API dependencies
 */
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');

/**
 * Include dependencies
 */
var GoogleDistanceService = require('*/cartridge/scripts/services/GoogleDistanceService');

/**
 * Get distance to Stores
 *
 * @param {Object} originCoordinates - originCoordinates object
 * @param {Array} destinationCoordinatesList - destinationCoordinatesList list with coordinate objects
 * @returns {dw.system.Status} - return status of fulfillment API call
 */
exports.getDistanceToStores = function (originCoordinates, destinationCoordinatesList) {
    var status;
    var code;
    var responseObject;
    try {
        // Verify if we have params
        if (!originCoordinates || !destinationCoordinatesList) {
            throw new Error('No required parameters passed');
        }

        var request = {
            origins: originCoordinates,
            destinations: destinationCoordinatesList
        };

        // Make API call
        var result = GoogleDistanceService.GoogleDistanceService.call({
            request: request
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
        Logger.error('{0} - {1}', e, e.stack);
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
