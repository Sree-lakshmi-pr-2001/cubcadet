'use strict';

var ArrayList = require('dw/util/ArrayList');

/**
 * @type {Logger}
 */
var Logger = require('dw/system/Logger');

/**
 * @type {Log}
 */
var log = Logger.getLogger('int_googletags', 'analytics');

/**
 * export the log so that it can be used by the other scripts
 * @type {Log}
 */
exports.log = log;

var NAMESPACE = {
    CART: 'cart',
    CHECKOUT: 'checkout',
    ORDER_CONFIRMATION: 'orderconfirmation',
    PRODUCT: 'product',
    SEARCH: 'search',
    WISHLIST: 'wishlist'
};

exports.NAMESPACE = NAMESPACE;

/**
 * Creates an ecommerce array based on an Product iterator. The itertor can contain
 * Product, ProductListItem, or ProductLineItem.
 *
 * The composition of each object will be determined by a custom callback based on
 * client analytics requirements.
 *
 * @param {Iterator} listIterator - list iterator
 * @param {Function} objectCreationCallback - callback function
 * @return {Array} product array
 */
exports.getProductArrayFromList = function (listIterator, objectCreationCallback) {
    var productArray = [];
    var position = 1;
    while (listIterator.hasNext()) {
        var item = listIterator.next();
        var prodObj = objectCreationCallback(item);
        prodObj.position = position;
        productArray.push(prodObj);
        position++;
    }
    return productArray;
};

/**
 *
 * @param {dw.catalog.ProductSearchModel} productSearchResult - product search result
 * @return {dw.util.ArrayList} searched product list
 */
exports.getSearchProducts = function (productSearchResult) {
    var productObj = new ArrayList();
    var products = productSearchResult.productIds;
    products.forEach(function (obj) {
        productObj.push(obj.productSearchHit.product);
    });
    return productObj;
};

/**
 * Attempts to get custom attribute value from object or null otherwise.
 * @param {Object} obj - custom object
 * @param {string} id - custom object id
 * @return {*} custom object value for this id
 */
exports.getObjectCustomValue = function (obj, id) {
    if (obj != null && obj.custom != null && (id in obj.custom)) {
        return (obj.custom)[id];
    }
    return null;
};
