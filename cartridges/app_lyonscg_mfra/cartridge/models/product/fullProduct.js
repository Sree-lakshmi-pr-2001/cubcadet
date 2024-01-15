'use strict';

/**
 * Base fullProduct model overridden to decorate additional product image type 'hi-res'
 * 'hi-res' product image type uses on PDP for zoom
 */
var base = module.superModule;
var imageZoomDecorator = require('*/cartridge/models/product/decorators/imagesZoom');

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

    if (options.variationModel) {
        imageZoomDecorator(product, options.variationModel, { types: ['hi-res'], quantity: 'all' });
    } else {
        imageZoomDecorator(product, apiProduct, { types: ['hi-res'], quantity: 'all' });
    }

    return product;
};
