/* global session empty dw request response */
'use strict';

/**
 * API dependencies
 */

/**
 * Get Click ID Cookie Value
 *
 * @returns {string} - cookie value
 */
function getClickIdCookie() {
    var cookie = null;
    var cookies = request.httpCookies;
    for (var i = 0; i < cookies.cookieCount; i++) {
        if (cookies[i].name === 'pepparjam') {
            cookie = cookies[i];
            break;
        }
    }
    return cookie;
}

exports.getClickIdCookie = getClickIdCookie;

/**
 * Retrieve tracking URL
 *
 * @param {string} orderId - orderId
 * @return {boolean} - return boolean flag
 */
exports.getTrackingUrl = function (orderId) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Site = require('dw/system/Site');

    var trackingUrl = null;
    var clickIdCookie = getClickIdCookie();
    // Verify if tracking is enabled
    if (Site.current.getCustomPreferenceValue('pepperjamEnabled') && clickIdCookie) {
        // Get order by ID
        try {
            var order = OrderMgr.getOrder(orderId);
            if (order) {
                var customer = session.customer;
                var params = [];

                trackingUrl = Site.current.getCustomPreferenceValue('pepperjamJSUrl') + '?';
                params.push('INT=DYNAMIC');
                params.push('PROGRAM_ID=' + Site.current.getCustomPreferenceValue('pepperjamProgramId'));
                params.push('ORDER_ID=' + order.orderNo);
                params.push('CLICK_ID=' + clickIdCookie.value);

                var productLineItems = order.getProductLineItems();

                for (var i = 0, size = productLineItems.length; i < size; i++) {
                    var productLineItem = productLineItems[i];
                    var count = i + 1;
                    params.push('ITEM_ID' + count + '=' + productLineItem.productID);
                    params.push('ITEM_PRICE' + count + '=' + productLineItem.basePrice.value);
                    params.push('QUANTITY' + count + '=' + productLineItem.quantityValue);

                    var product = productLineItem.product;
                    var categoryID = '';
                    var masterProduct = product;

                    if (product.variant) {
                        masterProduct = product.masterProduct;
                    }

                    if (masterProduct.primaryCategory) {
                        categoryID = masterProduct.primaryCategory.ID;
                    } else {
                        var categories = masterProduct.categories;
                        if (categories.size() > 0) {
                            categoryID = categories[0].ID;
                        }
                    }
                    params.push('CATEGORY' + count + '=' + categoryID);
                }

                var coupons = order.getCouponLineItems();
                var couponList = [];

                for (var j = 0, l = coupons.size(); j < l; j++) {
                    var coupon = coupons[j];
                    couponList.push(coupon.couponCode);
                }

                if (couponList.length > 0) {
                    params.push('COUPON=' + couponList.join(','));
                }

                var orders = (customer.activeData) ? customer.activeData.orders : 0;
                var newCustomer = empty(orders) || orders === 0;
                // If we don't have a active data for customer check if he already placed any orders with his email
                if (newCustomer && order.customerEmail) {
                    var orderIterator = OrderMgr.queryOrders('customerEmail = {0}', null, order.customerEmail);
                    if (orderIterator.count > 1) {
                        newCustomer = false;
                    }
                }
                params.push('NEW_TO_FILE=' + ((newCustomer) ? '1' : '0'));

                trackingUrl += params.join('&');
            }
        } catch (e) {
            var exception = e;
            var Logger = require('dw/system/Logger');
            Logger.error('{0}: {1}', exception, exception.stack);
        }
    }
    return trackingUrl;
};

/**
 * Set click ID cookie
 *
 * @param {string} clickId - string value of click ID
 * @returns {dw.web.Cookie} - cookie
 */
exports.setClickIdCookie = function (clickId) {
    var Site = require('dw/system/Site');
    var Cookie = require('dw/web/Cookie');

    // Verify that Pepperjam is enabled
    if (!Site.current.getCustomPreferenceValue('pepperjamEnabled')) {
        return null;
    }

    var currentCookieValue = getClickIdCookie();
    var cookieArray = (currentCookieValue) ? currentCookieValue.value.split(',') : [];
    cookieArray.push(clickId);
    // Create cookie
    var newCookie = new Cookie('pepparjam', cookieArray.join(','));
    newCookie.path = '/';
    newCookie.maxAge = Site.getCurrent().getCustomPreferenceValue('pepperjamCookieMaxDays') * 86400;
    response.addHttpCookie(newCookie);
    return newCookie;
};
