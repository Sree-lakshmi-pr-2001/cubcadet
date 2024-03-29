'use strict';

var decorators = require('*/cartridge/models/product/decorators/index');
var promotionCache = require('*/cartridge/scripts/util/promotionCache');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var Site = require('dw/system/Site');

/**
 * Get product search hit for a given product
 * @param {dw.catalog.Product} apiProduct - Product instance returned from the API
 * @returns {dw.catalog.ProductSearchHit} - product search hit for a given product
 */
function getProductSearchHit(apiProduct) {
    var searchModel = new ProductSearchModel();
    searchModel.setSearchPhrase(apiProduct.ID);
    searchModel.search();

    if (searchModel.count === 0) {
        searchModel.setSearchPhrase(apiProduct.ID.replace(/-/g, ' '));
        searchModel.search();
    }

    var hit = searchModel.getProductSearchHit(apiProduct);
    if (!hit) {
        var tempHit = searchModel.getProductSearchHits().next();
        if (tempHit.firstRepresentedProductID === apiProduct.ID) {
            hit = tempHit;
        }
    }
    return hit;
}

/**
 * Decorate product with product tile information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {string} productType - Product type information
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function productTile(product, apiProduct, productType) {
    var productSearchHit = getProductSearchHit(apiProduct);

    var enablePromoCalloutMessagesProductTile = Site.getCurrent().getCustomPreferenceValue('enablePromoCalloutMessagesProductTile');
    if (enablePromoCalloutMessagesProductTile !== null && enablePromoCalloutMessagesProductTile) {
        var PromotionMgr = require('dw/campaign/PromotionMgr');
        var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(apiProduct);
        decorators.promotions(product, promotions);
    }

    decorators.base(product, apiProduct, productType);
    decorators.types(product, apiProduct);
    decorators.searchPrice(product, productSearchHit, promotionCache.promotions, getProductSearchHit);
    decorators.images(product, apiProduct, { types: ['medium', 'small', 'xsmall'], quantity: 'single' });
    decorators.ratings(product);
    decorators.searchVariationAttributes(product, productSearchHit);
    decorators.replacesParts(product, apiProduct);
    decorators.licensedProducts(product, apiProduct);

    return product;
};
