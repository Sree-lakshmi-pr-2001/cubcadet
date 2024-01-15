'use strict';

var server = require('server');

server.extend(module.superModule);

// Main entry point for Checkout
server.append( 'Begin', function (req, res, next) {
    var Site = require('dw/system/Site');
    var BasketMgr = require('dw/order/BasketMgr');

    var ewEnabled = Site.getCurrent().getCustomPreferenceValue('enableEWNewSales');
    if (ewEnabled){
        var viewData = res.getViewData();
        var currentBasket = BasketMgr.getCurrentBasket();
        var Resource = require('dw/web/Resource');
        // Check if this is an aftermarket warranty only basket. If true, just display email and phone fields
        var aftermarketOnly = false;
        var isAftermarketInBasket = false;
        var warranties = {};
        var dummyShippingAddress = {};

        var warrantyHelpers = require('*/cartridge/scripts/helpers/warrantyHelpers');
        aftermarketOnly = warrantyHelpers.checkForAfterMarketOnlyBasket(currentBasket);
        isAftermarketInBasket = warrantyHelpers.checkForAfterMarketInBasket(currentBasket);
        warranties =  warrantyHelpers.returnWarranties(currentBasket);


        viewData.aftermarketOnly = aftermarketOnly;
        viewData.isAftermarketInBasket = isAftermarketInBasket;
        viewData.warranties = warranties;
        // viewData.dummyShippingAddress = dummyShippingAddress;
        res.setViewData(viewData);
    }
    next();
});

module.exports = server.exports();