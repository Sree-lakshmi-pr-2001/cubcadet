/* global session */
'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);


server.prepend('Show', function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var ContentModel = require('*/cartridge/models/content');

    // Add age verification content asset
    var ageVerificationHtml = '';
    var ageVerificationaAsset = ContentMgr.getContent('age-verification-label');
    if (ageVerificationaAsset) {
        var ageVerificationModel = new ContentModel(ageVerificationaAsset);
        ageVerificationHtml = ageVerificationModel.body.markup;
    }

    res.setViewData({
        ageVerificationHtml: ageVerificationHtml
    });
    next();
});

module.exports = server.exports();
