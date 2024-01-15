'use strict';

var server = require('server');

/**
 * Show content asset about prop65 warning
 */
server.get('Show', function (req, res, next) {
    res.render('prop65/warning');
    next();
});

/**
 * Save date and time of accepting prop65 warning
 */
server.get('Accept', function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var accepted = req.querystring.accepted;

    Transaction.wrap(function () {
        if (accepted === '1') {
            var currentDateTime = new Date();
            currentBasket.custom.prop65Acknowledged = currentDateTime;
        } else {
            currentBasket.custom.prop65Acknowledged = null;
        }
    });

    res.json({
        success: true
    });

    next();
});

/**
 * Verify prop65
 */
server.get('Verify', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var prop65Helper = require('*/cartridge/scripts/helpers/prop65Helpers');
    var currentBasket = BasketMgr.getCurrentBasket();

    // Verify prop65
    var prop65Response = prop65Helper.buildResponse(currentBasket);

    res.json(prop65Response);

    next();
});

module.exports = server.exports();
