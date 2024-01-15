'use strict';

/**
 * Base fullProduct model overridden to decorate additional 'relatedContent' attr.
 * 'relatedContent' for product
 */
var base = module.superModule;
var blogHelpers = require('*/cartridge/scripts/helpers/blogHelpers');

/**
 * Decorate product with full product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {string} options - Options passed in from the factory
 * @property {dw.catalog.ProductVarationModel} options.variationModel - Variation model returned by the API
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function fullProduct(product, apiProduct, options) {
    base.call(this, product, apiProduct, options);
    if ('relatedContent' in apiProduct.custom) {
        product.relatedContent = blogHelpers.getRelatedContent(apiProduct);
    }
    return product;
};
