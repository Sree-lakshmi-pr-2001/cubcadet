'use strict';

var server = require('server');

/**
 * Show part page
 */
server.get('Show', function (req, res, next) {
    var Util = require('~/cartridge/scripts/helpers/Util');
    var ContentMgr = require('dw/content/ContentMgr');
    var ContentModel = require('*/cartridge/models/content');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    if (Util.VALUE.ENABLED) {
        // Get Model Number
        var modelNo = req.querystring.mn;
        var apiContent = ContentMgr.getContent('ari-partstream');
        var content = new ContentModel(apiContent, 'content/contentAsset');

        pageMetaHelper.setPageMetaData(req.pageMetaData, content);
        pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
        res.render('partstream/part', {
            appKey: Util.VALUE.APP_KEY,
            modelNo: modelNo,
            jsUrl: Util.VALUE.JS_URL,
            brandCode: Util.VALUE.BRAND_CODE
        });
    } else {
        res.setStatus(404);
        res.render('error/notFound');
    }

    next();
});

module.exports = server.exports();
