'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var MTDUtil = require('int_mtdservices/cartridge/scripts/helpers/Util');
    var currentBasket = BasketMgr.getCurrentBasket();

    if (req.querystring.dealerRequired === 'true' && MTDUtil.VALUE.DEALER_SHOW_REQUIRED_PRODUCTS) {
        var ContentMgr = require('dw/content/ContentMgr');
        var ContentModel = require('*/cartridge/models/content');

        var requiredDealerProductNames = [];
        for (var i = 0, l = currentBasket.productLineItems.size(); i < l; i++) {
            var productLineItem = currentBasket.productLineItems[i];
            if (productLineItem.product && productLineItem.product.custom['dealer-required']) {
                requiredDealerProductNames.push(productLineItem.product.name);
            }
        }
        if (requiredDealerProductNames.length > 0) {
            var dealerRequiredAsset = ContentMgr.getContent('dealer-required-products-cart');
            if (dealerRequiredAsset) {
                var assetModel = new ContentModel(dealerRequiredAsset);
                var assetHtml = assetModel.body.markup;
                res.setViewData({
                    dealerRequiredProductsMsg: assetHtml,
                    requiredDealerProductNames: requiredDealerProductNames
                });
            }
        }
    }

    next();
});

module.exports = server.exports();
