'use strict';

var collection = require('*/cartridge/scripts/util/collections');

/**
 *
 * @param {dw.catalog.Product} apiProduct - Product returned by the API
 * @param {Object} factory - Product Factory object
 *
 * @returns {Array<Object>} - Array of sub-product models
 */
function getIndividualProductIds(apiProduct) {
    return collection.map(apiProduct.bundledProducts, function (product) {
        return product.ID;
    });
}

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'individualProductIds', {
        enumerable: true,
        value: getIndividualProductIds(apiProduct)
    });
};
