'use strict';

var server = require('server');
server.extend(module.superModule);

var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

// Checkout Login
server.append(
    'Login',
    function (req, res, next) {
        var ContentMgr = require('dw/content/ContentMgr');
        var ContentModel = require('*/cartridge/models/content');
        var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

        var apiContent = ContentMgr.getContent('checkout-metadata');
        if (apiContent) {
            var content = new ContentModel(apiContent, 'content/contentAsset');

            pageMetaHelper.setPageMetaData(req.pageMetaData, content);
            pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
        }

        next();
    }, pageMetaData.computedPageMetaData
);

// Main entry point for Checkout
server.append(
    'Begin',
    function (req, res, next) {
        var ContentMgr = require('dw/content/ContentMgr');
        var ContentModel = require('*/cartridge/models/content');
        var BasketMgr = require('dw/order/BasketMgr');
        var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

        var apiContent = ContentMgr.getContent('checkout-metadata');
        if (apiContent) {
            var content = new ContentModel(apiContent, 'content/contentAsset');

            pageMetaHelper.setPageMetaData(req.pageMetaData, content);
            pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
        }


        var currentBasket = BasketMgr.getCurrentBasket();
        var originViewData = res.getViewData();

        originViewData.emailSignup = currentBasket.custom.emailSignup;

        var prop65Asset = ContentMgr.getContent('prop65-cart-line-item-warning');
        if (prop65Asset) {
            var assetModel = new ContentModel(prop65Asset);
            var assetHtml = assetModel.body.markup;
            res.setViewData({ itemProp65WarningMsg: assetHtml });
        }

        next();
    }, pageMetaData.computedPageMetaData
);

module.exports = server.exports();
