/* global request */
'use strict';

var server = require('server');
var page = module.superModule;
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.extend(page);


server.append('Find', function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var ContentModel = require('*/cartridge/models/content');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var Site = require('dw/system/Site');

    var googleGeoCodingUrl = 'https://maps.googleapis.com/maps/api/geocode/json?key=' + Site.getCurrent().getCustomPreferenceValue('googleGeocodingAPIKey');

    var storeSearchAddressErrorAsset = ContentMgr.getContent('store-search-address-error');
    var storeSearchAddressErrorMessage = (storeSearchAddressErrorAsset) ? storeSearchAddressErrorAsset.custom.body.markup : '';

    var apiContent = ContentMgr.getContent('store-search-metadata');
    if (apiContent) {
        var content = new ContentModel(apiContent, 'content/contentAsset');

        pageMetaHelper.setPageMetaData(req.pageMetaData, content);
        pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
    }

    res.setViewData({
        storeSearchAddressErrorMessage: storeSearchAddressErrorMessage,
        googleGeoCodingUrl: googleGeoCodingUrl
    });

    next();
}, pageMetaData.computedPageMetaData);

module.exports = server.exports();
