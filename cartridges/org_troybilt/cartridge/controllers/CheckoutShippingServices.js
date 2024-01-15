'use strict';

/**
 * Removed public controllers for using Multiship
 *
 */

var page = module.superModule;
var server = require('server');

server.extend(page);


server.append('UpdateShippingMethodsList', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var URLUtils = require('dw/web/URLUtils');

    var originViewData = res.getViewData();
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var shippingHelpers = require('*/cartridge/scripts/checkout/shippingHelpers');
    shippingHelpers.calculateAdjustedShippingCosts(originViewData.order, currentBasket);

    return next();
});

module.exports = server.exports();
