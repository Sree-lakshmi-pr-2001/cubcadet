'use strict';

/**
 * Searches for stores and creates a plain object of the stores returned by the search
 * @param {string} radius - selected radius
 * @param {string} postalCode - postal code for search
 * @param {string} lat - latitude for search by latitude
 * @param {string} long - longitude for search by longitude
 * @param {Object} geolocation - geloaction object with latitude and longitude
 * @param {boolean} showMap - boolean to show map
 * @param {dw.web.URL} url - a relative url
 * @returns {Object} a plain object containing the results of the search
 */
function getStores(radius, postalCode, lat, long, geolocation, showMap, url) {
    var StoresModel = require('*/cartridge/models/stores');
    var StoreMgr = require('dw/catalog/StoreMgr');
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');

    // Change geolocation detection to Site pref
    var countrySitePref = Site.getCurrent().getCustomPreferenceValue('countryCode');
    var countryCode = 'value' in countrySitePref ? countrySitePref.value : 'US';
    var distanceUnit = countryCode === 'US' ? 'mi' : 'km';
    var resolvedRadius = radius ? parseInt(radius, 10) : 15;

    var searchKey = {};
    var storeMgrResult = null;
    var location = {};

    if (postalCode && postalCode !== '') {
        // Make postal code for CA case independent
        if (postalCode.search(/^([a-zA-Z]{1}\d{1}[a-zA-Z]{1})/i) === 0
                && postalCode.search(/^([a-zA-Z]{1}\d{1}[a-zA-Z]{1} )/i) === -1) {
            searchKey = postalCode.toUpperCase().replace(/^([a-zA-Z]{1}\d{1}[a-zA-Z]{1})/i, '$1 '); // Always should have format A1A 1A1
        } else {
            // find by postal code
            searchKey = postalCode.replace(/(\d{5})(-\d{4})?$/, '$1').toUpperCase();
        }
        storeMgrResult = StoreMgr.searchStoresByPostalCode(
            countryCode,
            searchKey,
            distanceUnit,
            resolvedRadius,
            'custom.services_products = true'
        );
        searchKey = { postalCode: searchKey };
    } else {
        // find by coordinates (detect location)
        location.lat = lat && long ? parseFloat(lat) : geolocation.latitude;
        location.long = long && lat ? parseFloat(long) : geolocation.longitude;

        storeMgrResult = StoreMgr.searchStoresByCoordinates(
            location.lat,
            location.long,
            distanceUnit,
            resolvedRadius,
            'custom.services_products = true'
        );
        searchKey = { lat: location.lat, long: location.long };
    }

    var actionUrl = url || URLUtils.url('Stores-FindStores', 'showMap', showMap).toString();
    var apiKey = Site.getCurrent().getCustomPreferenceValue('mapAPI');

    var stores = new StoresModel(storeMgrResult.keySet(), searchKey, resolvedRadius, actionUrl, apiKey);

    return stores;
}

/**
 * create the stores results html
 * @param {Array} storesInfo - an array of objects that contains store information
 * @returns {string} The rendered HTML
 */
function createStoresResultsHtml(storesInfo) {
    var HashMap = require('dw/util/HashMap');
    var Template = require('dw/util/Template');

    var context = new HashMap();
    var object = { stores: { stores: storesInfo } };

    Object.keys(object).forEach(function (key) {
        context.put(key, object[key]);
    });

    var template = new Template('storeLocator/storeLocatorResults');
    return template.render(context).text;
}

/**
 * Get Dealer Categories
 * @param {Store} dealer current store
 * @returns {array} - array of filters
 */
function getDealerCategories(dealer) {
    var ArrayList = require('dw/util/ArrayList');
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var dealerCategoriesIds = dealer.custom.minisite_product_categories;
    var categories = new ArrayList();
    for (var j = 0, c = dealerCategoriesIds.length; j < c; j++) {
        var storeCategoryId = dealerCategoriesIds[j];
        var catalogCategory = CatalogMgr.getCategory(storeCategoryId);
        if (catalogCategory) {
            categories.add(catalogCategory);
        }
    }

    return categories;
}

/**
 * Render dealer page
 * @param {*} req request
 * @param {*} res response
 * @param {*} next Next pipeline
 * @param {StoreModel} dealer Store
 * @returns {Object} page data
 */
function renderDealerShow(req, res, next, dealer) {
    var StoreMgr = require('dw/catalog/StoreMgr');
    StoreMgr.setStoreIDToSession(dealer.ID);

    var Site = require('dw/system/Site');
    var StoreModel = require('*/cartridge/models/store');
    var dealerStoreModel = new StoreModel(dealer);
    var productCategories = getDealerCategories(dealer);
    var server = require('server');
    var scheduleTestdriveForm = server.forms.getForm('scheduletestdrive');
    scheduleTestdriveForm.clear();
    scheduleTestdriveForm.actionUrl = Site.current.getCustomPreferenceValue('scheduleTestdriveURL');
    scheduleTestdriveForm.productTypes = Site.current.getCustomPreferenceValue('testdriveProductTypes');
    var contactUsForm = server.forms.getForm('contactus');
    contactUsForm.clear();
    contactUsForm.actionUrl = Site.current.getCustomPreferenceValue('customerServiceURL');
    contactUsForm.dealerId = dealer.ID;

    return {
        dealer: dealerStoreModel,
        categories: productCategories,
        testDriveForm: scheduleTestdriveForm,
        contactUsForm: contactUsForm
    };
}

module.exports = exports = {
    createStoresResultsHtml: createStoresResultsHtml,
    getStores: getStores,
    renderDealerShow: renderDealerShow
};
