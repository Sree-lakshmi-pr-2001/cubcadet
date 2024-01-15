'use strict';

/**
 * Cart base controller overridden to prepend new middleware to all the existing routes
 * Middleware checks if ecommerce functionality is enabled for site then call next function in middleware chain otherwise redirect user to homepage
 *
 */

var page = module.superModule;
var server = require('server');

server.extend(page);

var ecommerce = require('*/cartridge/scripts/middleware/ecommerce');

server.prepend('Show', ecommerce.checkEcommerceEnabled, function (req, res, next) {
    next();
});

server.prepend('AddProduct', ecommerce.checkEcommerceEnabled, function (req, res, next) {
    next();
});

server.prepend('MiniCart', ecommerce.checkEcommerceEnabled, function (req, res, next) {
    next();
});

server.prepend('Get', ecommerce.checkEcommerceEnabled, function (req, res, next) {
    next();
});

server.prepend('RemoveProductLineItem', ecommerce.checkEcommerceEnabled, function (req, res, next) {
    next();
});

server.prepend('UpdateQuantity', ecommerce.checkEcommerceEnabled, function (req, res, next) {
    next();
});

server.prepend('SelectShippingMethod', ecommerce.checkEcommerceEnabled, function (req, res, next) {
    next();
});

server.prepend('MiniCartShow', ecommerce.checkEcommerceEnabled, function (req, res, next) {
    next();
});

server.prepend('AddCoupon', ecommerce.checkEcommerceEnabled, function (req, res, next) {
    next();
});

server.prepend('RemoveCouponLineItem', ecommerce.checkEcommerceEnabled, function (req, res, next) {
    next();
});

server.prepend('AddBonusProducts', ecommerce.checkEcommerceEnabled, function (req, res, next) {
    next();
});

server.prepend('EditBonusProduct', ecommerce.checkEcommerceEnabled, function (req, res, next) {
    next();
});

server.prepend('GetProduct', ecommerce.checkEcommerceEnabled, function (req, res, next) {
    next();
});

server.prepend('EditProductLineItem', ecommerce.checkEcommerceEnabled, function (req, res, next) {
    next();
});

module.exports = server.exports();
