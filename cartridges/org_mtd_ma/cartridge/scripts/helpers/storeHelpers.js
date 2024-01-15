'use strict';
/* global request */

/**
 * Searches for stores and creates a plain object of the stores returned by the search
 * @param {string} radius - selected radius
 * @param {string} postalCode - postal code for search
 * @param {string} lat - latitude for search by latitude
 * @param {string} long - longitude for search by longitude
 * @param {Object} geolocation - geloaction object with latitude and longitude
 * @param {boolean} showMap - boolean to show map
 * @param {dw.web.URL} url - a relative url
 * @param {boolean} isServiceLocator - booolean if we have a service locator instead of dealer locator
 * @returns {Object} a plain object containing the results of the search
 */
function getStores(radius, postalCode, lat, long, geolocation, showMap, url, isServiceLocator) {
    var StoresModel = require('*/cartridge/models/stores');
    var StoreMgr = require('dw/catalog/StoreMgr');
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');
    var StringUtils = require('dw/util/StringUtils');
    var LinkedHashSet = require('dw/util/LinkedHashSet');

    // Change geolocation detection to Site pref
    var countrySitePref = Site.getCurrent().getCustomPreferenceValue('countryCode');
    var countryCode = 'value' in countrySitePref ? countrySitePref.value : 'US';
    var distanceUnit = countryCode === 'US' ? 'mi' : 'km';
    var resolvedRadius = radius ? parseInt(radius, 10) : 15;

    var searchKey = {};
    var storeMgrResult = null;
    var location = {};
    var retailerId = request.httpParameterMap.rid.value || '';
    var isEliteDealer = request.httpParameterMap.isEliteDealer.value === 'true' || false;
    var retailerIdArray = retailerId.toLowerCase().split(',');
    var searchQuery = '';
    // Service locator vs Dealer locator
    if (isServiceLocator) {
        searchQuery = 'custom.services_products = true';

        if (retailerId && retailerId === 'dealers') {
            searchQuery += ' AND custom.cubcadet = true';
        } else {
            searchQuery += ' AND custom.cubcadetcare = true';
        }
    } else if (isEliteDealer) {
        searchQuery = 'custom.elite_dealer = true';
        searchQuery += ' AND custom.sells_products = true';
    } else {
        searchQuery = 'custom.sells_products = true';
        searchQuery += ' AND custom.cubcadet = true';
    }

    var productCategory = request.httpParameterMap.pc.value || '';
    var productCategoryArray = productCategory.toUpperCase().split(',');

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
            StringUtils.trim(searchKey),
            distanceUnit,
            resolvedRadius,
            searchQuery
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
            searchQuery
        );
        searchKey = { lat: location.lat, long: location.long };
    }

    var actionUrl = url || URLUtils.url('Stores-FindStores', 'showMap', showMap, 'isServiceLocator', isServiceLocator || false, 'isEliteDealer', isEliteDealer || false).toString();
    var apiKey = Site.getCurrent().getCustomPreferenceValue('mapAPI');

    var storeList = storeMgrResult.keySet();
    var filteredByCategory = new LinkedHashSet();
    var filteredByRetailerId = new LinkedHashSet();
    var filteredStores = new LinkedHashSet();
    var hasFilters = false;

    // If we have find dealer page we can filter only by product categories
    if (productCategory !== '' && productCategoryArray.length > 0) {
        for (var i = 0, l = storeList.size(); i < l; i++) {
            var store = storeList[i];
            var productCategories = store.custom['product_categories'];  // eslint-disable-line dot-notation
            for (var j = 0, c = productCategories.length; j < c; j++) {
                var storeProductCategory = productCategories[j];
                if (productCategoryArray.indexOf(storeProductCategory.value.toUpperCase()) >= 0) {
                    filteredByCategory.add(store);
                    break;
                }
            }
        }
        filteredStores = filteredByCategory;
        hasFilters = true;
    }
    if (!isServiceLocator && retailerId !== '' && retailerIdArray.length > 0
            && !(productCategory !== '' && productCategoryArray.length > 0 && filteredByCategory.size() === 0)) { // If we have find dealer page from PDP we can filter it by retailer id only
        var storesToFilter = filteredByCategory.size() > 0 ? filteredByCategory : storeList;
        for (var ri = 0, rl = storesToFilter.size(); ri < rl; ri++) {
            var storeObj = storesToFilter[ri];
            var retailerIds = storeObj.custom['retailer_id']; // eslint-disable-line dot-notation
            for (var rj = 0, rc = retailerIds.length; rj < rc; rj++) {
                var storeRetailerId = retailerIds[rj];
                if (retailerIdArray.indexOf(storeRetailerId.value.toLowerCase()) >= 0) {
                    filteredByRetailerId.add(storeObj);
                    break;
                }
            }
        }
        filteredStores = filteredByRetailerId;
        hasFilters = true;
    }
    // merge filtered data
    if (!hasFilters) {
        filteredStores = storeList;
    }

    var stores = new StoresModel(filteredStores, searchKey, resolvedRadius, actionUrl, apiKey);

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
 * Get Product Categories Filters
 * @returns {array} - array of filters
 */
function getProductCategoriesFilters() {
    var SystemObjectMgr = require('dw/object/SystemObjectMgr');
    var ArrayList = require('dw/util/ArrayList');
    var storeObjectDefinition = SystemObjectMgr.describe('Store');
    var productCategoriesFilters = new ArrayList();
    if (storeObjectDefinition) {
        var productCategoriesDefinition = storeObjectDefinition.getCustomAttributeDefinition('product_categories');
        if (productCategoriesDefinition) {
            productCategoriesFilters = productCategoriesDefinition.values;
        }
    }
    return productCategoriesFilters;
}

/**
 * Get Product From Filters
 * @returns {array} - array of filters
 */
function getProductFromFilters() {
    var SystemObjectMgr = require('dw/object/SystemObjectMgr');
    var ArrayList = require('dw/util/ArrayList');
    var storeObjectDefinition = SystemObjectMgr.describe('Store');
    var productCategoriesFilters = new ArrayList();
    if (storeObjectDefinition) {
        var productCategoriesDefinition = storeObjectDefinition.getCustomAttributeDefinition('retailer_id');
        if (productCategoriesDefinition) {
            productCategoriesFilters = productCategoriesDefinition.values;
        }
    }
    return productCategoriesFilters;
}

/**
 * Get Paid Dealers
 * @param {string} radius - radius
 * @param {string} lat - latitude
 * @param {string} long - longitude
 * @returns {Object} stores object
 */
function getPaidDealers(radius, lat, long) {
    var StoreMgr = require('dw/catalog/StoreMgr');
    var Site = require('dw/system/Site');
    var StoreModel = require('*/cartridge/models/store');

    // Change geolocation detection to Site pref
    var countrySitePref = Site.getCurrent().getCustomPreferenceValue('countryCode');
    var countryCode = 'value' in countrySitePref ? countrySitePref.value : 'US';
    var distanceUnit = countryCode === 'US' ? 'mi' : 'km';
    var resolvedRadius = radius ? parseInt(radius, 10) : 15;

    var storeMgrResult = null;
    var location = {};
    var searchQuery = '';

    // find by coordinates (detect location)
    location.lat = lat;
    location.long = long;
    searchQuery = 'custom.paid-dealer-search-snow = true';

    storeMgrResult = StoreMgr.searchStoresByCoordinates(
        location.lat,
        location.long,
        distanceUnit,
        resolvedRadius,
        searchQuery
    );

    var storeList = storeMgrResult.keySet();
    var stores = storeList;

    return Object.keys(stores).map(function (key) {
        var store = stores[key];
        var storeModel = new StoreModel(store);
        return storeModel;
    });
}
/**
 * Get Product Refinement Filter Categories
 * @returns {array} - array of filters
 */
function getProductRefinementCategories() {
    var Site = require('dw/system/Site');
    var ArrayList = require('dw/util/ArrayList');
    var dealerRefinements = JSON.parse(Site.getCurrent().getCustomPreferenceValue('dealerSearchRefinements'));
    var productCategoriesFilters = new ArrayList();

    // Loop through values and check if value "RP" (Residential products)
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (var el in dealerRefinements) {
        var val = el;
        var displayVal = dealerRefinements[el];
        if (el === 'RP') {
            // Get values from residentialProductsMapping site preference
            var residentialProductsMapping = Site.getCurrent().getCustomPreferenceValue('residentialProductsMapping');
            val = residentialProductsMapping.join(',');
        }
        productCategoriesFilters.add({
            value: val,
            displayValue: displayVal
        });
    }

    return productCategoriesFilters;
}
/**
 * Filter out None Elite Dealerss
 * @param {Object} stores - stores object to be modify to filter out none elite dealers.
 * @returns {Object} - stores object
 */
function getEliteDealers(stores) {
    var store;
    var eliteStores = stores;
    var eliteDealers = [];
    for (var index = 0; index < stores.stores.length; index++) {
        store = stores.stores[index];
        if (store.custom.isEliteDealer === true) {
            eliteDealers.push(store);
        }
    }

    eliteStores.stores = eliteDealers;

    return eliteStores;
}
module.exports = exports = {
    createStoresResultsHtml: createStoresResultsHtml,
    getStores: getStores,
    getProductCategoriesFilters: getProductCategoriesFilters,
    getProductRefinementCategories: getProductRefinementCategories,
    getProductFromFilters: getProductFromFilters,
    getPaidDealers: getPaidDealers,
    getEliteDealers: getEliteDealers
};
