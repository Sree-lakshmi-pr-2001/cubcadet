/**
 * This controller adds support for re-creating baskets via a click-through URL.
 * Please see the Start route definition below for more detail.
 * Note: Depends on base64Url utility module.
 */
'use strict';

var server = require('server');
var BasketMgr = require('dw/order/BasketMgr');
var URLUtils = require('dw/web/URLUtils');

/**
 * Checks if the customer basket exists and has any product line items.
 * @returns {boolean} does the customer have a non empty basket
 */
function hasNonEmptyBasket() {
    var basket = BasketMgr.getCurrentBasket();

    // Is there an existing basket?
    if (basket) {
        // Are there any products in the basket?
        if (!basket.getAllProductLineItems().isEmpty()) {
            return true;
        }
    }

    return false;
}

/**
 * Parses basket info from query param into simple JSON basket info object.
 * @param {string} querystring from the url
 * @returns {Object} object data representing what needs to be added to basket
 */
function parseQueryParams(querystring) {
    var basketInfo = {};

    // Basket specified as base64Url encoded JSON.
    if (querystring.basket) {
        var base64Url = require('base64Url');
        var decoded = base64Url.decode(querystring.basket);
        var newBasket = JSON.parse(decoded);

        if (newBasket && newBasket.products && newBasket.products.length) {
            basketInfo = newBasket;
        }
    }

    // Fallback to basket specified as simple indexed parameters.
    if (!basketInfo.products && querystring.p) {
        var index = 0;
        var paramIndex = '';
        basketInfo.products = [];
        while (querystring['p' + paramIndex]) {
            basketInfo.products.push({
                pid: querystring['p' + paramIndex],
                quantity: parseInt(querystring['q' + paramIndex] || 1, 10)
            });

            paramIndex = ++index + '';
        }
    }

    return basketInfo;
}

/**
 * Takes simple basket info and attempts to add each requested product to the cart.
 * Using existing basket helper scripts from base refarch for consistency.
 * Logs all errors but does not throw. May result in empty cart, but not an error page.
 * @param {Object} basketInfo - object notation with product Ids and quantities to add to the basket
 */
function createBasket(basketInfo) {
    var Transaction = require('dw/system/Transaction');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var Logger = require('dw/system/Logger');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var currentbasket = BasketMgr.getCurrentOrNewBasket();

    if (basketInfo && basketInfo.products && basketInfo.products.length) {
        var results;

        Transaction.begin();

        try {
            // Attempt to add all products
            results = basketInfo.products.map(function (prod) {
                // People don't null check their code :/
                if (!ProductMgr.getProduct(prod.pid)) {
                    return {
                        error: true,
                        message: 'Product does not exist: ' + prod.pid
                    };
                }

                return cartHelper.addProductToCart(
                    currentbasket,
                    prod.pid,
                    prod.quantity,
                    prod.childProducts || [],
                    prod.options);
            });

            // Do the basket things
            cartHelper.ensureAllShipmentsHaveMethods(currentbasket);
            basketCalculationHelpers.calculateTotals(currentbasket);
            Transaction.commit();
        } catch (error) {
            Transaction.rollback();

            // Capture and log the error.
            Logger.error('Failed to create cart! ' + error.message);
        }

        // Individual product errors don't stop cart build, but should be logged.
        var errors = results.filter(function (result) { return result.error; })
        .map(function (result) { return result.message; })
        .join(' | ');

        if (errors) {
            Logger.warn('Could not add one or more products to the cart. ' + errors);
        }
    }
}

/**
 * Navigate to an existing basket, if found. Otherwise create a basket per query params.
 * Either a basket info JSON object is provided as a base64Url encoded basket param,
 * or indexed p and q query parameters are expected with each ID and quantity.
 * @example Basket param: ?basket=eyJwcm9kdWN0cyI6W3sicGlkIjoic29ueS1jeWJlcnNob3QtZHNjLWg1MCIsInF1YW50aXR5IjoxLCJvcHRpb25zIjpbeyJvcHRpb25JZCI6ImRpZ2l0YWxDYW1lcmFXYXJyYW50eSIsInNlbGVjdGVkVmFsdWVJZCI6IjAwMiJ9XX0seyJwaWQiOiJzb255LXBzMy1idW5kbGUiLCJxdWFudGl0eSI6MSwiY2hpbGRQcm9kdWN0cyI6W3sicGlkIjoiZWFzcG9ydHMtbmFzY2FyLTA5LXBzMyIsInF1YW50aXR5IjoxfSx7InBpZCI6ImVhc3BvcnRzLW1vbm9wb2x5LXBzMyIsInF1YW50aXR5IjoxfSx7InBpZCI6Im5hbWNvLWV0ZXJuYWwtc29uYXRhLXBzMyIsInF1YW50aXR5IjoxfSx7InBpZCI6InNvbnktd2FyaGF3ay1wczMiLCJxdWFudGl0eSI6MX1dfV19
 * @example Sample basket decoded: {
    "products": [
        {
            "pid": "sony-cybershot-dsc-h50",
            "quantity": 1,
            "options": [
                {
                    "optionId": "digitalCameraWarranty",
                    "selectedValueId": "002"
                }
            ]
        },
        {
            "pid": "sony-ps3-bundle",
            "quantity": 1,
            "childProducts": [
                {
                    "pid": "easports-nascar-09-ps3",
                    "quantity": 1
                },
                {
                    "pid": "easports-monopoly-ps3",
                    "quantity": 1
                },
                {
                    "pid": "namco-eternal-sonata-ps3",
                    "quantity": 1
                },
                {
                    "pid": "sony-warhawk-ps3",
                    "quantity": 1
                }
            ]
        }
    ]
}
 * @example Indexed params: ?p=sony-cybershot-dsc-h50&q=2&p1=nikon-sl16&q1=1... or simply ?p=sony-cybershot-dsc-h50&p1=nikon-sl16...
 */
server.get('Start', function (req, res, next) {
    if (hasNonEmptyBasket()) {
        // Show existing basket.
        res.redirect(URLUtils.url('Cart-Show'));
    }

    next();
},
function (req, res, next) {
    // Parse basket info from the GET request.
    var basketInfo = parseQueryParams(req.querystring);
    // Attempt to create basket--no error will be thrown!
    createBasket(basketInfo);

    res.redirect(URLUtils.url('Cart-Show'));

    next();
});

module.exports = server.exports();
