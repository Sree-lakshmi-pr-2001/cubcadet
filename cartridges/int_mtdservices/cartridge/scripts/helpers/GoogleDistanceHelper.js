'use strict';

/**
 * Include Modules
 */
var Logger = require('dw/system/Logger');
var GoogleDistaceModel = require('*/cartridge/scripts/models/GoogleDistance');

/**
 * Get distance to stores
 *
 *
 * @param {Object} originCoordinates - originCoordinates object
 * @param {Array} destinationCoordinatesList - destinationCoordinatesList list with coordinate objects
 * @returns {Object} - return result object
 */
exports.getDistanceToStores = function (originCoordinates, destinationCoordinatesList) {
    var result = {
        error: false,
        distanceList: []
    };
    try {
        // Make a request to Google Distance API
        var distanceResult = GoogleDistaceModel.getDistanceToStores(originCoordinates, destinationCoordinatesList);

        // If API return no errors handle response
        if (!distanceResult.error) {
            // Get response from Dealer API
            var response = distanceResult.getDetail('response');

            if (response.status === 'OK') {
                var elements = response.rows[0].elements;
                for (var i = 0; i < elements.length; i++) {
                    var element = elements[i];
                    if (element.status === 'OK') {
                        result.distanceList.push(element.distance.text);
                    } else {
                        result.error = true;
                        Logger.error('GoogleDistanceHelper: Element status = {0}', element.status);
                        break;
                    }
                }
            } else {
                result.error = true;
                Logger.error('GoogleDistanceHelper: Response status = {0}', response.status);
            }
        } else {
            result.error = true;
            Logger.error('GoogleDistanceHelper: Google distance service error');
        }
    } catch (e) {
        result.error = true;
        Logger.error('{0}: {1}', e, e.stack);
    }

    return result;
};
