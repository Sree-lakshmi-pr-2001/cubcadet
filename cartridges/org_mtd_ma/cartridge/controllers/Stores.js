/* global request empty */
'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

/**
 * Checks if object is empty
 * @param {Object} obj - object to check
 * @returns {boolean} - returns boolean
 */
function isEmpty(obj) {
    /*eslint-disable */
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            return false;
        }
    }
    /*eslint-enable */
    return JSON.stringify(obj) === JSON.stringify({});
}

server.get('FindService', server.middleware.https, cache.applyDefaultCache, consentTracking.consent, function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var ContentModel = require('*/cartridge/models/content');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    var apiContent = ContentMgr.getContent('service-locator-metadata');
    if (apiContent) {
        var content = new ContentModel(apiContent, 'content/contentAsset');

        pageMetaHelper.setPageMetaData(req.pageMetaData, content);
        pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
    }

    var radius = req.querystring.radius;
    var postalCode = req.querystring.postalCode;
    var lat = req.querystring.lat;
    var long = req.querystring.long;
    var showMap = req.querystring.showMap || false;
    var horizontalView = req.querystring.horizontalView || false;
    var isForm = req.querystring.isForm || false;
    var isLandingPage = isEmpty(req.querystring);

    var storeSearchAddressErrorAsset = ContentMgr.getContent('store-search-address-error');
    var storeSearchAddressErrorMessage = (storeSearchAddressErrorAsset) ? storeSearchAddressErrorAsset.custom.body.markup : '';

    var stores = storeHelpers.getStores(radius, postalCode, lat, long, req.geolocation, showMap, null, true);
    var productCategories = storeHelpers.getProductRefinementCategories ? storeHelpers.getProductRefinementCategories() : storeHelpers.getProductCategoriesFilters();
    var currentSite = require('dw/system/Site').current.ID;
    var viewData = {
        stores: stores,
        horizontalView: horizontalView,
        isForm: isForm,
        showMap: showMap,
        productFrom: storeHelpers.getProductFromFilters(),
        productTypes: productCategories,
        isServiceLocator: true,
        isLandingPage: isLandingPage,
        storeSearchAddressErrorMessage: storeSearchAddressErrorMessage,
        currentSite: currentSite
    };

    res.render('storeLocator/serviceLocator', viewData);
    next();
});

server.append('Find', function (req, res, next) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var ContentMgr = require('dw/content/ContentMgr');

    var productId = request.httpParameterMap.pid.value;
    var productName = null;
    if (productId) {
        var product = ProductMgr.getProduct(productId);
        if (product) {
            productName = product.name;
        }
    }

    var showMap = !empty(req.querystring.showMap) ? req.querystring.showMap : 'true';
    var horizontalView = !empty(req.querystring.horizontalView) ? req.querystring.horizontalView : 'true';
    var isForm = !empty(req.querystring.isForm) ? req.querystring.isForm : 'true';

    var storeSearchAddressErrorAsset = ContentMgr.getContent('store-search-address-error');
    var storeSearchAddressErrorMessage = (storeSearchAddressErrorAsset) ? storeSearchAddressErrorAsset.custom.body.markup : '';
    var productCategories = storeHelpers.getProductRefinementCategories ? storeHelpers.getProductRefinementCategories() : storeHelpers.getProductCategoriesFilters();
    var currentSite = require('dw/system/Site').current.ID;
    res.setViewData({
        productCategoriesFilter: productCategories,
        isServiceLocator: false,
        retailerIds: request.httpParameterMap.rid.value || '',
        productType: request.httpParameterMap.pc.value || '',
        productName: productName,
        storeSearchAddressErrorMessage: storeSearchAddressErrorMessage,
        showMap: showMap,
        horizontalView: horizontalView,
        isForm: isForm,
        currentSite: currentSite
    });

    next();
}, pageMetaData.computedPageMetaData);

server.replace('FindStores', function (req, res, next) {
    var Site = require('dw/system/Site');
    var radius = req.querystring.radius;
    var postalCode = req.querystring.postalCode;
    var lat = req.querystring.lat;
    var long = req.querystring.long;
    var showMap = req.querystring.showMap || false;
    var isServiceLocator = req.querystring.isServiceLocator === 'true' || false;
    var currentSiteID = Site.getCurrent().ID;

    var stores = storeHelpers.getStores(radius, postalCode, lat, long, req.geolocation, showMap, null, isServiceLocator, currentSiteID);
    stores.productCategoriesFilter = req.querystring.pc ? req.querystring.pc : storeHelpers.getProductCategoriesFilters();
    res.json(stores);
    next();
});

server.get('PaidDealers', server.middleware.https, consentTracking.consent, function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var stores = storeHelpers.getPaidDealers(100, req.geolocation.latitude, req.geolocation.longitude);
    var viewData = {};

    var ContentMgr = require('dw/content/ContentMgr');
    var ContentModel = require('*/cartridge/models/content');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    var apiContent = ContentMgr.getContent('featured-dealer-metadata');
    if (apiContent) {
        var content = new ContentModel(apiContent, 'content/contentAsset');

        pageMetaHelper.setPageMetaData(req.pageMetaData, content);
        pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
    }

    if (stores === undefined || stores.length === 0) {
        viewData = {
            featuredDealer: JSON.stringify({
                name: Resource.msg('no.featured.dealers.found', 'storeLocator', null),
                phone: '',
                address1: '',
                city: '',
                stateCode: '',
                postalCode: '',
                custom: { website: '' }
            }),
            breadcrumbs: [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                },
                {
                    htmlValue: Resource.msg('paiddealer.breadcrumb.featureddealer', 'storeLocator', null),
                    url: URLUtils.url('Stores-PaidDealers').toString()
                }
            ]
        };
    } else {
        var featuredDealers = stores[0];
        viewData = {
            featuredDealer: JSON.stringify({
                name: featuredDealers.name,
                phone: featuredDealers.phone,
                address1: featuredDealers.address1,
                city: featuredDealers.city,
                stateCode: featuredDealers.stateCode,
                postalCode: featuredDealers.postalCode,
                custom: { website: featuredDealers.custom.website }
            }),
            breadcrumbs: [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                },
                {
                    htmlValue: Resource.msg('paiddealer.breadcrumb.featureddealer', 'storeLocator', null),
                    url: URLUtils.url('Stores-PaidDealers').toString()
                }
            ]
        };
    }

    res.render('storeLocator/paidDealerSearch', viewData);
    next();
}, pageMetaData.computedPageMetaData);

server.get('FeaturedDealer', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var lat = req.querystring.lat;
    var long = req.querystring.long;
    var stores = storeHelpers.getPaidDealers(60, parseFloat(lat), parseFloat(long));
    if (stores === undefined || stores.length === 0) {
        var store = {
            name: Resource.msg('no.featured.dealers.found', 'storeLocator', null),
            phone: '',
            dealerAddress1: '',
            address1: '',
            city: '',
            stateCode: '',
            postalCode: '',
            custom: { website: '' }
        };
        res.json(store);
    } else {
        res.json(stores[0]);
    }
    next();
});

module.exports = server.exports();
