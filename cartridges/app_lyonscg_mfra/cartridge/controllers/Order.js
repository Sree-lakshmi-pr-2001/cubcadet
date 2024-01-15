'use strict';

/**
 * Order base controller overridden to prepend new middleware to all the existing routes
 * Middleware checks if ecommerce functionality is enabled for site then call next function in middleware chain otherwise redirect user to homepage
 *
 */

var page = module.superModule;
var server = require('server');

server.extend(page);

var ecommerce = require('*/cartridge/scripts/middleware/ecommerce');

server.prepend('Confirm', ecommerce.checkEcommerceEnabled, function (req, res, next) {
    next();
});

server.prepend('Track', ecommerce.checkEcommerceEnabled, function (req, res, next) {
    next();
});

server.prepend('History', ecommerce.checkEcommerceEnabled, function (req, res, next) {
    next();
});

server.prepend('Details', ecommerce.checkEcommerceEnabled, function (req, res, next) {
    next();
});

server.prepend('Filtered', ecommerce.checkEcommerceEnabled, function (req, res, next) {
    next();
});

server.prepend('CreateAccount', ecommerce.checkEcommerceEnabled, function (req, res, next) {
    next();
});

module.exports = server.exports();
