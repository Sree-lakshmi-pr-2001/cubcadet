'use strict';

var server = require('server');
var page = module.superModule;

var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.extend(page);

server.append(
    'List',
    function (req, res, next) {
        var ContentMgr = require('dw/content/ContentMgr');
        var ContentModel = require('*/cartridge/models/content');
        var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

        var apiContent = ContentMgr.getContent('address-metadata');
        if (apiContent) {
            var content = new ContentModel(apiContent, 'content/contentAsset');

            pageMetaHelper.setPageMetaData(req.pageMetaData, content);
            pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
        }

        next();
    }, pageMetaData.computedPageMetaData
);

server.append(
    'AddAddress',
    function (req, res, next) {
        var ContentMgr = require('dw/content/ContentMgr');
        var ContentModel = require('*/cartridge/models/content');
        var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

        var apiContent = ContentMgr.getContent('address-metadata');
        if (apiContent) {
            var content = new ContentModel(apiContent, 'content/contentAsset');

            pageMetaHelper.setPageMetaData(req.pageMetaData, content);
            pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
        }

        var viewData = res.getViewData();
        var addressForm = viewData.addressForm;
        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
        accountHelpers.restrictStates(addressForm);
        next();
    }, pageMetaData.computedPageMetaData
);

server.append(
        'EditAddress',
        function (req, res, next) {
            var ContentMgr = require('dw/content/ContentMgr');
            var ContentModel = require('*/cartridge/models/content');
            var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

            var apiContent = ContentMgr.getContent('address-metadata');
            if (apiContent) {
                var content = new ContentModel(apiContent, 'content/contentAsset');

                pageMetaHelper.setPageMetaData(req.pageMetaData, content);
                pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
            }

            var viewData = res.getViewData();
            var addressForm = viewData.addressForm;
            var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
            accountHelpers.restrictStates(addressForm);
            next();
        }, pageMetaData.computedPageMetaData
    );

module.exports = server.exports();
