'use strict';

var util = require('./TagManagerUtils');
var factory = require('./TagManagerFactory');

/** @type {ProductMgr} */
var ProductMgr = require('dw/catalog/ProductMgr');

/** @type {BasketMgr} */
var BasketMgr = require('dw/order/BasketMgr');

/**
*
* @private
* @param {PipelineDictionary} args - pipeline dictonary
* @return {Object} checkout object
*/
function getCheckoutData(args) {
    var basket = BasketMgr.getCurrentBasket();
    var step = 0;

    if (args.pageContext.ns === 'cart') {
        step = 1;
    } else if (args.pageContext.ns === 'checkout') {
        if (args.CurrentCustomer.addressBook && Object.hasOwnProperty.call(args.CurrentCustomer.addressBook, 'preferredAddress')) {
            step = 3;
        } else {
            step = 2;
        }
    }

    return factory.getLayerCheckout(basket, step);
}

/**
*
* @private
* @param {PipelineDictionary} args - pipeline dictionary
* @return {Object|null} order object
*/
function getConfirmation(args) {
    if ('order' in args) {
        var OrderMgr = require('dw/order/OrderMgr');
        var Order = OrderMgr.getOrder(args.order.orderNumber);
        return factory.getLayerConfirmation(Order);
    }

    return null;
}

/**
* This is where data that appears on every page will be included.
*
* This function includes data that is acceptable to cache.
*
* @private
* @param {PipelineDictionary} args - pipeline dictionary
* @return {Object|null} null
*/
function getGlobalData() {
    return null;
}

/**
* product detail data
* @private
* @param {PipelineDictionary} args - pipeline dictionary
* @return {Object|null} product object
*/
function getPdp(args) {
    if ('product' in args) {
        var Product = ProductMgr.getProduct(args.product.id);
        return factory.getLayerPdp(Product);
    }
    return null;
}

/**
*
* @private
* @param {PipelineDictionary} args - pipeline dictionary
* @return {Object|null} search impressions object
*/
function getSearchImpressions(args) {
    if ('productSearch' in args) {
        return factory.getLayerImpressions(util.getSearchProducts(args.productSearch).iterator(), factory.getProduct);
    }
    return null;
}

/**
*
* @private
* @param {PipelineDictionary} args - pipeline dictionary
* @return {Object|null} layer impressions object
  Commenting out as wishlist not in SFRA code and has dependency on plugin_wishlist
  function getWishlistImpressions(args) {
    if ('ProductList' in args) {
        return factory.getLayerImpressions(args.ProductList.items.iterator(), factory.getProduct);
    }

    return null;
} */

/**
 * @private
 * @param {PipelineDictionary} args - pipeline dictionary
 * @param {string} nameSpace - page context
 * @return {Object|null} - page data object
 */
function getPageData(args, nameSpace) {
    switch (nameSpace) {
        case util.NAMESPACE.CART :
        case util.NAMESPACE.CHECKOUT :
            return getCheckoutData(args);
        case util.NAMESPACE.ORDER_CONFIRMATION :
            return getConfirmation(args);
        case util.NAMESPACE.PRODUCT :
            return getPdp(args);
        case util.NAMESPACE.SEARCH :
            return getSearchImpressions(args);
        /* case util.NAMESPACE.WISHLIST :
            return getWishlistImpressions(args);*/
        default :
            return null;
    }
}

/**
 * @module Org_TagManager
 */
var TagManagerModel = {

    /**
     * Gets the Google data layer.
     *
     * @cacheable
     * @param {PipelineDictionary} args - pipeline dictionary
     * @param {string} NameSpace - page context
     * @return {Array} data layer array
     */
    getDataLayer: function (args, NameSpace) {
        var dataLayer = [];

        try {
            var nameSpace = NameSpace != null ? NameSpace : '';
            var globalData = getGlobalData();
            var pageData = getPageData(args, nameSpace);

            if (globalData != null) {
                dataLayer.push(globalData);
            }

            if (pageData != null) {
                dataLayer.push(pageData);
            }
        } catch (e) {
            dataLayer.push({
                debugError: {
                    message: e.message,
                    lineNumber: e.lineNumber
                }
            });
        }

        return dataLayer;
    },

    /**
     * Gets product data.
     *
     * This is used to add product data to the page so it is accessible for client side click events.
     *
     * @cacheable
     * @param {string} productId - product  id
     * @return {Object} product object
     */
    getProductData: function (productId) {
        return factory.getProduct(ProductMgr.getProduct(productId));
    },

    /**
     * Gets session data.
     *
     * Used for session data that cannot be cached.
     *
     * @return {Object} customer object
     */
    getSessionData: function () {
        try {
            return factory.getCustomer();
        } catch (e) {
            return {
                debugError: {
                    message: e.message,
                    lineNumber: e.lineNumber
                }
            };
        }
    }

};

module.exports = TagManagerModel;
