'use strict';

var decorators = require('*/cartridge/models/product/decorators/index');
var imageZoomDecorator = require('*/cartridge/models/product/decorators/imagesZoom');
var image360Decorator = require('*/cartridge/models/product/decorators/images360');

/**
 * Decorate product with full product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 * @property {dw.catalog.ProductVarationModel} options.variationModel - Variation model returned by the API
 * @property {Object} options.options - Options provided on the query string
 * @property {dw.catalog.ProductOptionModel} options.optionModel - Options model returned by the API
 * @property {dw.util.Collection} options.promotions - Active promotions for a given product
 * @property {number} options.quantity - Current selected quantity
 * @property {Object} options.variables - Variables passed in on the query string
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function fullProduct(product, apiProduct, options) {
    decorators.base(product, apiProduct, options.productType);
    decorators.price(product, apiProduct, options.promotions, false, options.optionModel);

    if (options.variationModel) {
        decorators.images(product, options.variationModel, { types: ['large', 'xsmall', 'quickview', 'slider-tile-desktop'], quantity: 'all' });
        imageZoomDecorator(product, options.variationModel, { types: ['hi-res'], quantity: 'all' });
        image360Decorator(product, options.variationModel, { types: ['360-view'], quantity: 'all' });
    } else {
        decorators.images(product, apiProduct, { types: ['large', 'xsmall', 'quickview', 'slider-tile-desktop'], quantity: 'all' });
        imageZoomDecorator(product, apiProduct, { types: ['hi-res'], quantity: 'all' });
        image360Decorator(product, apiProduct, { types: ['360-view'], quantity: 'all' });
    }

    decorators.quantity(product, apiProduct, options.quantity);
    decorators.variationAttributes(product, options.variationModel, {
        attributes: '*',
        endPoint: 'Variation'
    });
    decorators.description(product, apiProduct);
    decorators.ratings(product);
    decorators.promotions(product, options.promotions);
    decorators.attributes(product, apiProduct.attributeModel);
    decorators.availability(product, options.quantity, apiProduct.minOrderQuantity.value, apiProduct.availabilityModel);
    Object.defineProperty(product, 'priceAvailability', {
        enumerable: true,
        value: !(product.available && 'sales' in product.price && !product.price.sales.value)
    });
    decorators.options(product, options.optionModel, options.variables, options.quantity);
    decorators.quantitySelector(product, apiProduct.stepQuantity.value, options.variables, options.options);

    var category = apiProduct.getPrimaryCategory();
    if (!category && options.productType !== 'master' && apiProduct.isVariant()) {
        category = apiProduct.getMasterProduct().getPrimaryCategory();
    }

    if (category) {
        decorators.sizeChart(product, category.custom.sizeChartID);
    }

    decorators.currentUrl(product, options.variationModel, options.optionModel, 'Product-Show', apiProduct.ID, options.quantity);
    decorators.readyToOrder(product, options.variationModel);
    decorators.raw(product, apiProduct);
    decorators.pageMetaData(product, apiProduct);
    decorators.licensedProducts(product, apiProduct);
    decorators.videos(product, apiProduct);

    // Specification data
    var apiProductSrc = (apiProduct.variant || apiProduct.variationGroup) ? apiProduct.masterProduct : apiProduct;
    decorators.specification(product, apiProductSrc.attributeModel);

    // PDP Main Image Section - Videos
    decorators.pdpMainVideo(product, apiProduct);

    return product;
};
