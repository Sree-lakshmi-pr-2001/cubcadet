'use strict';

/**
 * Standardize postal code for comparisons
 * @param {string} serialNumber - postal or zipcode
 * @returns {string} postal or zipcode formatted
 */
 function getWarrantyInfo(sourceSystem, sourceOrderSiteId, serialNumber, countryCode) {
    var Warranty = require('*/cartridge/scripts/models/Warranty');

    var warrantyLookupResult = Warranty.lookup(sourceSystem, sourceOrderSiteId, serialNumber, countryCode);

    return warrantyLookupResult;
}

module.exports.getWarrantyInfo = getWarrantyInfo;