'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');

/**
 * Show Manuals on PDP
 */
server.get('Show', cache.applyDefaultCache, function (req, res, next) {
    var ManualsModel = require('~/cartridge/scripts/models/Manuals');
    var Util = require('~/cartridge/scripts/helpers/Util');
    var ContentMgr = require('dw/content/ContentMgr');
    var ContentModel = require('*/cartridge/models/content');

    var instockItems = [];
    var agreementHtml = '';

    if (Util.VALUE.ENABLE_MANUAL_SEARCH) {
        // Get Model Number
        var modelNo = req.querystring.modelNo;
        // Call API service to verify address
        var searchResult = ManualsModel.searchManuals(modelNo);

        // If we have success response we just return it
        // Otherwise we just mark response as failed
        var manualItems = searchResult.getDetail('response');
        if (!searchResult.error) {
            instockItems = manualItems;

            var agreementAsset = ContentMgr.getContent('manuals-download-notification');
            if (agreementAsset) {
                var assetModel = new ContentModel(agreementAsset);
                agreementHtml = assetModel.body.markup;
            }
        }
    }

    res.render('manuals/pdpdivtotable', {
        manualItems: instockItems,
        agreementHtml: agreementHtml
    });

    next();
});

/**
 * Manuals Search
 */
server.get('Search', function (req, res, next) {
    // var ManualsModel = require('~/cartridge/scripts/models/Manuals');
    var Util = require('~/cartridge/scripts/helpers/Util');
    var ContentMgr = require('dw/content/ContentMgr');
    var ContentModel = require('*/cartridge/models/content');
    var URLUtils = require('dw/web/URLUtils');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    if (Util.VALUE.ENABLE_MANUAL_SEARCH) {
        var apiContent = ContentMgr.getContent('operators-manuals-search');
        var content = new ContentModel(apiContent, 'content/contentAsset');

        var dontKnowContent = ContentMgr.getContent('manuals-search-dont-know-number');
        var dontKnowContentModel = new ContentModel(dontKnowContent, 'content/contentAsset');

        pageMetaHelper.setPageMetaData(req.pageMetaData, content);
        pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
        var manualsForm = server.forms.getForm('manuals');
        res.render('manuals/search', {
            mainContent: content,
            dontKnowContent: dontKnowContentModel,
            manualsForm: manualsForm,
            actionUrl: URLUtils.url('MTDManuals-SearchResult')
        });
    } else {
        res.setStatus(404);
        res.render('error/notFound');
    }

    next();
});

/**
 * Manuals Search
 */
server.post('SearchResult', function (req, res, next) {
    var ManualsModel = require('~/cartridge/scripts/models/Manuals');
    var Util = require('~/cartridge/scripts/helpers/Util');
    var ContentMgr = require('dw/content/ContentMgr');
    var ContentModel = require('*/cartridge/models/content');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var LinkedHashMap = require('dw/util/LinkedHashMap');
    var ArrayList = require('dw/util/ArrayList');

    if (Util.VALUE.ENABLE_MANUAL_SEARCH) {
        var apiContent = ContentMgr.getContent('operators-manuals-search-result');
        var content = new ContentModel(apiContent, 'content/contentAsset');

        pageMetaHelper.setPageMetaData(req.pageMetaData, content);
        pageMetaHelper.setPageMetaTags(req.pageMetaData, content);

        var manualsForm = server.forms.getForm('manuals');
        var modelNumber = manualsForm.modelnumber.value;
        var serialNumber = manualsForm.serialnumber.value;
        var searchCriteria = {
            model: modelNumber,
            serial: serialNumber
        };

        var agreementHtml = '';
        var instockItems = new LinkedHashMap();

        // Call API service to verify address
        var searchResult = ManualsModel.searchManuals(modelNumber, serialNumber);

        // If we have success response we just return it
        // Otherwise we just mark response as failed
        if (!searchResult.error) {
            var manualItems = searchResult.getDetail('response');
            for (var i = 0, itemsLength = manualItems.length; i < itemsLength; i++) {
                var manualItem = manualItems[i];
                var modelItems = instockItems.get(manualItem.modelNumber);
                if (!modelItems) {
                    modelItems = new ArrayList();
                }
                modelItems.push(manualItem);
                instockItems.put(manualItem.modelNumber, modelItems);
            }
            var agreementAsset = ContentMgr.getContent('manuals-download-notification');
            if (agreementAsset) {
                var assetModel = new ContentModel(agreementAsset);
                agreementHtml = assetModel.body.markup;
            }
        }

        res.render('manuals/searchresult', {
            mainContent: content,
            agreementHtml: agreementHtml,
            manualItems: instockItems,
            manualModels: instockItems.keySet(),
            searchCriteria: searchCriteria
        });
    } else {
        res.setStatus(404);
        res.render('error/notFound');
    }

    next();
});

module.exports = server.exports();
