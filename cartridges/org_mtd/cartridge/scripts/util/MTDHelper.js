/* global session empty dw */
'use strict';

/**
 * API dependencies
 */
var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var URLUtils = require('dw/web/URLUtils');
/**
 * Include Modules
 */
var ARIUtil = require('int_ari/cartridge/scripts/helpers/Util');
var MTDServicesUtil = require('int_mtdservices/cartridge/scripts/helpers/Util');

/**
 * Convenience method to get a site custom preference
 *
 * @param {string} id -The Site Preference ID
 * @returns {*} - Value of custom site preference
 */
function getPreferenceValue(id) {
    return Site.getCurrent().getCustomPreferenceValue(id);
}

/**
 * Constants
 */
var VALUE = {
    /**
     * Product Type Refinement Attribute Name
     */
    PRODUCT_TYPE_REFINEMENT: 'product-type',

    /**
     * Accessory Product Type Value
     */
    ACCESSORY_PRODUCT_TYPE_VALUE: 'ACCESSORY',

    /**
     * Default Cart Slot Type
     */
    DEFAULT_CART_SLOT_TYPE: 'fixed',

    /**
     * Site preference for checking if Dynosite is enabled
     */
    DYNOSITE_ENABLED: getPreferenceValue('dynositeEnable'),

    /**
     * Site preference for all parts category ID
     */
    DYNOSITE_ALL_PARTS_CATEGORY_ID: getPreferenceValue('dynositeAllPartsCategoryId')
};
exports.VALUE = VALUE;

/**
 * Check if product has WholeGood type
 *
 * @param {dw.catalog.Product} product - product object
 * @returns {boolean} - return boolean flag
 */
function isWholeGoodProduct(product) {
    return 'product-type' in product.custom
        && product.custom['product-type']
        && product.custom['product-type'].value.toLowerCase() === 'wholegood';
}
exports.isWholeGoodProduct = isWholeGoodProduct;

/**
 * Check if product has Accessory type
 *
 * @param {dw.catalog.Product} product - product object
 * @returns {boolean} - return boolean flag
 */
exports.isAccessoryProduct = function (product) {
    return 'product-type' in product.custom
        && product.custom['product-type']
        && product.custom['product-type'].value.toLowerCase() === 'accessory';
};

/**
 * Check if product has parts type
 *
 * @param {dw.catalog.Product} product - product object
 * @returns {boolean} - return boolean flag
 */
exports.isPartsProduct = function (product) {
    return 'product-type' in product.custom
        && product.custom['product-type']
        && product.custom['product-type'].value.toLowerCase() === 'parts';
};

/**
 * Retrieve product model number from custom attribute
 *
 * @param {dw.catalog.Product} product - product object
 * @returns {string|null} - return model number
 */
exports.getProductModelNumber = function (product) {
    return product.custom['model-number'];
};

/**
 * Check if ARI Stream Parts Enabled
 *
 * @return {boolean} - return boolean flag
 */
exports.isARIEnabled = function () {
    return ARIUtil.VALUE.ENABLED;
};

/**
 * Get ARI Brand Code
 *
 * @return {string} - return brand code
 */
exports.getARIBrandCode = function () {
    return ARIUtil.VALUE.BRAND_CODE;
};

/**
 * Check if Manual Search is enabled
 *
 * @return {boolean} - return boolean flag
 */
exports.isManualSearchEnabled = function () {
    return MTDServicesUtil.VALUE.ENABLE_MANUAL_SEARCH;
};

/**
 * Save custom attributes for Product line item
 * @param {dw.catalog.Product} product - product object
 * @param {dw.order.productLineItem} productLineItem - product line item object
 */
exports.setCustomPliAttributes = function (product, productLineItem) {
    Transaction.wrap(function () {
        productLineItem.custom['product-type'] = product.custom['product-type'].value; // eslint-disable-line no-param-reassign
    });
};

/**
 * Find the first Whole Good Product in the cart
 * @param {dw.order.Basket} basket - basket object
 * @returns {dw.catalog.Product} - whole good product
 */
exports.findFirstWholeGood = function (basket) {
    var wholeGoodProduct;
    if (basket) {
        for (var i = 0, l = basket.productLineItems.size(); i < l; i++) {
            var pli = basket.productLineItems[i];
            if (isWholeGoodProduct(pli.product)) {
                wholeGoodProduct = pli.product;
                break;
            }
        }
    }
    return wholeGoodProduct;
};

/**
 * Get Accessories Recommedation List IDs
 * @param {string} modelNumber - whole good product ID
 * @return {Array} - list of product Ids
 */
exports.getAccessoriesRecommendationListId = function (modelNumber) {
    // Search product for scrolling
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');

    var maxProductListSize = Site.current.getCustomPreferenceValue('cartAccessoryRecommendationsCount');
    var recommedationProductIdList = [];
    var productSearch = new ProductSearchModel();
    // Send product id to search phrase as fit on models
    productSearch.setSearchPhrase(modelNumber);
    productSearch.setRecursiveCategorySearch(true);
    // Add accessories filter
    productSearch.addRefinementValues(VALUE.PRODUCT_TYPE_REFINEMENT, VALUE.ACCESSORY_PRODUCT_TYPE_VALUE);
    productSearch.search();

    if (productSearch.count > 0) {
        var productSearchHits = productSearch.productSearchHits;
        while (productSearchHits.hasNext() && recommedationProductIdList.length < maxProductListSize) {
            var productSearchHit = productSearchHits.next();
            recommedationProductIdList.push(productSearchHit.productID);
        }
    }
    return recommedationProductIdList;
};

/**
 * Get Cart Slot Type
 * @returns {string} - cart slot type: fixed or dynamic
 */
exports.getCartSlotType = function () {
    var cartSlotType = Site.current.getCustomPreferenceValue('cartSlotType');
    return cartSlotType.value ? cartSlotType.value : VALUE.DEFAULT_CART_SLOT_TYPE;
};

/**
 * Check if we need to redirect to dynosite PDP page
 * @param {Object} productSearch - product search model
 * @returns {string|null} - product URL
 */
exports.redirectToDynosite = function (productSearch) {
    var redirectUrl;
    // Check if Dynosite is enabled
    if (!VALUE.DYNOSITE_ENABLED) {
        return redirectUrl;
    }
    // Verify that product is from search and meet requirements
    if (!productSearch.isCategorySearch && productSearch.count > 0 && productSearch.searchKeywords) {
        var keywords = StringUtils.trim(productSearch.searchKeywords);
        var firstProductSearchHit = productSearch.apiProductSearch.productSearchHits.next();
        if (firstProductSearchHit
            && isWholeGoodProduct(firstProductSearchHit.product)
            && firstProductSearchHit.product.ID.toUpperCase() === keywords.toUpperCase()) {
            redirectUrl = URLUtils.url('Product-Show', 'pid', firstProductSearchHit.product.ID, 'd', 't', 'arimn', firstProductSearchHit.product.ID);
        }
    }
    return redirectUrl;
};

/**
 * Check if product should have Dynosite PDP
 * @param {dw.catalog.Product} product - product object
 * @param {Object} querystring - query params
 * @returns {boolean} - result
 */
exports.isDynosite = function (product, querystring) {
    var isDynosite = false;
    // Check if Dynosite is enabled
    if (!VALUE.DYNOSITE_ENABLED) {
        return isDynosite;
    }
    if (isWholeGoodProduct(product)
        && (querystring.d === 't' || product.custom.dynosite)) {
        isDynosite = true;
    }
    return isDynosite;
};

/**
 * Check if current site is US
 * @returns {boolean} - result
 */
exports.isUsSite = function () {
    var isUS = false;
    var defaultCurrency = Site.getCurrent().getDefaultCurrency();
    if (defaultCurrency.toUpperCase().equals('USD')) {
        isUS = true;
    }
    return isUS;
};
