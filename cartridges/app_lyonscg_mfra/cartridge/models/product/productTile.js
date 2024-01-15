'use strict';

/**
 * Base product tile model overridden to decorate product tile with promotion callout messages
 * Promotion callout messages display on product tile if site preference enablePromoCalloutMessagesProductTile is enabled
 *
 */

var base = module.superModule;
var decorators = require('*/cartridge/models/product/decorators/index');
var Site = require('dw/system/Site');

/**
 * Decorate product with product tile information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {string} productType - Product type information
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function productTile(product, apiProduct, productType) {
    base.call(this, product, apiProduct, productType);
    var enablePromoCalloutMessagesProductTile = Site.getCurrent().getCustomPreferenceValue('enablePromoCalloutMessagesProductTile');
    if (enablePromoCalloutMessagesProductTile !== null && enablePromoCalloutMessagesProductTile) {
        var PromotionMgr = require('dw/campaign/PromotionMgr');
        var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(apiProduct);
        decorators.promotions(product, promotions);
    }
    return product;
};
