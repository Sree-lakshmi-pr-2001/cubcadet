'use strict';

var base = module.superModule;

var productDecorators = require('*/cartridge/models/product/decorators/index');

/**
 * Decorate product with extended warranty information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 * @property {dw.catalog.ProductVarationModel} options.variationModel - Variation model returned by the API
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function productLineItem(product, apiProduct, options) {
    base(product, apiProduct, options);

    productDecorators.setExtendedWarranty(product, apiProduct, options.variationModel);

    return product;
};
