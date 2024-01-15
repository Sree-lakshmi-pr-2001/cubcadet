'use strict';

var base = module.superModule;

var decorators = require('*/cartridge/models/product/decorators/index');

/**
 * Decorate product with product tile information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {string} productType - Product type information
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function productTile(product, apiProduct, productType) {
    base(product, apiProduct, productType);

    decorators.setIndividualProductIds(product, apiProduct);

    return product;
};
