'use strict';

var server = require('server');
var page = module.superModule;
var URLUtils = require('dw/web/URLUtils');
server.extend(page);

server.replace('Start', function (req, res, next) {
    var URLRedirectMgr = require('dw/web/URLRedirectMgr');
    var Resource = require('dw/web/Resource');
    var redirect = URLRedirectMgr.redirect;
    var location = redirect ? redirect.location : null;
    var redirectStatus = redirect ? redirect.getStatus() : null;
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var BasketMgr = require('dw/order/BasketMgr');

    var parts = URLRedirectMgr.redirectOrigin.split('/');
    parts.shift();
    parts.shift();
    var firstPart = parts.shift();
    // eslint-disable-next-line radix
    var dealerId = parts.shift();

    // if firstPart matches dealer and we have a valid ID
    // eslint-disable-next-line no-undef
    var isDealer = firstPart === 'dealers' && !empty(dealerId);

    if (isDealer) {
        var StoreMgr = require('dw/catalog/StoreMgr');
        var dealer = StoreMgr.getStore(dealerId);

        // if no store is found with dealerId or store is offline
        // then result will be redirecting to store locator page
        if (dealer && dealer.custom.dealer_minisite_enabled === true) {
            var storeHelpers = require('org_mtd/cartridge/scripts/helpers/storeHelpers');
            var renderResult = storeHelpers.renderDealerShow(req, res, next, dealer);
            var StoreModel = require('*/cartridge/models/store');
            var Site = require('dw/system/Site');
            var Transaction = require('dw/system/Transaction');

            var dealerStore = new StoreModel(dealer);
            if (dealerStore.pageTitle || dealerStore.pageDescription) {
                pageMetaHelper.setPageMetaData(req.pageMetaData, dealerStore);
            } else {
                pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
            }
            Transaction.wrap(function () {
                var currentBasket = BasketMgr.getCurrentBasket();
                if (currentBasket) {
                    var productLineItems = currentBasket.getAllProductLineItems();
                    for (var i = 0; i < productLineItems.length; i++) {
                        var item = productLineItems[i];
                        currentBasket.removeProductLineItem(item);
                    }
                }
            });
            res.render('dealer/homePage', renderResult);
        } else {
            res.redirect(URLUtils.url('Stores-Find'));
        }
        return next();
    }

    if (!location) {
        res.setStatusCode(410);
        res.render('error', {
            message: Resource.msg('subheading.error.general', 'error', null)
        });
    } else {
        if (redirectStatus) {
            res.setRedirectStatus(redirectStatus);
        }
        res.redirect(location);
    }

    return next();
});

module.exports = server.exports();
