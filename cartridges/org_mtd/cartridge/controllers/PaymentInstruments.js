'use strict';

/**
 * Removed public controllers for adding new PI
 *
 */

var page = module.superModule;
var server = require('server');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.extend(page);

server.append('List', function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var ContentModel = require('*/cartridge/models/content');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    var apiContent = ContentMgr.getContent('payment-list-metadata');
    if (apiContent) {
        var content = new ContentModel(apiContent, 'content/contentAsset');

        pageMetaHelper.setPageMetaData(req.pageMetaData, content);
        pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
    }

    next();
}, pageMetaData.computedPageMetaData);

server.replace('AddPayment', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    res.redirect(URLUtils.url('Home-Show'));
    next();
});

server.replace('SavePayment', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    res.redirect(URLUtils.url('Home-Show'));
    next();
});

module.exports = server.exports();
