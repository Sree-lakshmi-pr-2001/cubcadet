'use strict';

var decorators = require('*/cartridge/models/product/decorators/index');

/**
 * Decorate product with set product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 * @property {dw.catalog.ProductVarationModel} options.variationModel - Variation model returned by the API
 * @property {Object} options.options - Options provided on the query string
 * @property {dw.catalog.ProductOptionModel} options.optionModel - Options model returned by the API
 * @property {dw.util.Collection} options.promotions - Active promotions for a given product
 * @property {number} options.quantity - Current selected quantity
 * @property {Object} options.variables - Variables passed in on the query string
 * @param {Object} factory - Reference to product factory
 *
 * @returns {Object} - Set product
 */
module.exports = function bundleProduct(product, apiProduct, options, factory) {
    decorators.base(product, apiProduct, options.productType);
    decorators.price(product, apiProduct, options.promotions, false, options.options);
    decorators.images(product, apiProduct, { types: ['large', 'xsmall', 'quickview'], quantity: 'all' });
    decorators.quantity(product, apiProduct, options.quantity);
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
    var category = apiProduct.getPrimaryCategory()
        ? apiProduct.getPrimaryCategory()
        : apiProduct.getMasterProduct().getPrimaryCategory();
    decorators.sizeChart(product, category.custom.sizeChartID);
    decorators.currentUrl(product, options.variationModel, options.optionModel, 'Product-Show', apiProduct.ID, options.quantity);
    decorators.bundledProducts(product, apiProduct, options.quantity, factory);
    decorators.bundleReadyToOrder(product);
    decorators.raw(product, apiProduct);

    // Specification data
    var apiProductSrc = (apiProduct.variant || apiProduct.variationGroup) ? apiProduct.masterProduct : apiProduct;
    decorators.specification(product, apiProductSrc.attributeModel);

    return product;
};
