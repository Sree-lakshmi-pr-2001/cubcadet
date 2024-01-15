'use strict';

var page = module.superModule;

var CatalogMgr = require('dw/catalog/CatalogMgr');
var server = require('server');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var mapAPI = require('*/cartridge/scripts/locationMap');

server.extend(page);

server.replace('Show', server.middleware.get, function (req, res, next) {
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var apiProductSearch = new ProductSearchModel();
    apiProductSearch = searchHelper.setupSearch(apiProductSearch, req.querystring);
    apiProductSearch.search();
    var categoryID = apiProductSearch.category ? apiProductSearch.category.ID : null;
    var category = CatalogMgr.getCategory(categoryID);
    pageMetaHelper.setPageMetaData(req.pageMetaData, category);

    if (categoryID === 'locations') {
        var googleMapsApi = mapAPI.getGoogleMapsApi();
        var googleMapsID = mapAPI.getGoogleMapsID();
        res.render('rendering/category/locationPage', { category: category, googleMapsApi: googleMapsApi, googleMapsID: googleMapsID });
    } else {
        res.render(category.template, { category: category });
    }

    next();
}, pageMetaData.computedPageMetaData);

module.exports = server.exports();
