'use strict';
/* global request, empty */

var base = module.superModule;

var Site = require('dw/system/Site');
var BasketMgr = require('dw/order/BasketMgr');
var ProductMgr = require('dw/catalog/ProductMgr');

var CHECKING_STORE_COUNT = 10;
var MODAL_STORES_COUNT = 10;

/**
 * Searches for stores by idealer mini site enabled attribute
 * @param {dw.util.Set} stores - founded stores
 * @returns {dw.util.LinkedHashSet} filtered stores
 */
function filterStoresByDealerMiniSiteEnabled(stores) {
    var LinkedHashSet = require('dw/util/LinkedHashSet');
    var filteredByEnabledMiniSites = new LinkedHashSet();

    for (var i = 0; i < stores.length; i++) {
        var miniSiteStoreObj = stores[i];
        if (miniSiteStoreObj.custom.dealer_minisite_enabled) {
            filteredByEnabledMiniSites.add(miniSiteStoreObj);
        }
    }

    return filteredByEnabledMiniSites;
}

/**
 * Search stores
 * @param {string} radius - selected radius
 * @param {string} postalCode - postal code for search
 * @param {string} lat - latitude for search by latitude
 * @param {string} long - longitude for search by longitude
 * @param {Object} geolocation - geloaction object with latitude and longitude
 * @param {boolean} showMap - boolean to show map
 * @param {dw.web.URL} url - a relative url
 * @param {boolean} isServiceLocator - booolean if we have a service locator instead of dealer locator
 * @returns {Object} filtered stores from search result
 */
function searchStores(radius, postalCode, lat, long, geolocation, showMap, url, isServiceLocator) {
    var StoreMgr = require('dw/catalog/StoreMgr');
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

    var searchResult = {
        filteredStores: filteredStores,
        searchKey: searchKey,
        resolvedRadius: resolvedRadius,
        actionUrl: actionUrl,
        apiKey: apiKey
    };

    return searchResult;
}

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
function getStores(radius, postalCode, lat, long, geolocation, showMap, url, isServiceLocator, currentSiteID) {
    var StoresModel = require('*/cartridge/models/stores');

    var searchResult = searchStores(radius, postalCode, lat, long, geolocation, showMap, url, isServiceLocator);
    var stores = new StoresModel(searchResult.filteredStores, searchResult.searchKey, searchResult.resolvedRadius, searchResult.actionUrl, searchResult.apiKey, null, currentSiteID);

    return stores;
}

/**
 * Searches for stores and creates a plain object of the stores returned by the search
 * @param {string} postalCode - postalCode
 * @param {dw.util.Set} stores - founded stores
 * @returns {Object} filtered stores
 */
function filterStoresByGoogleDistance(postalCode, stores) {
    var LinkedHashSet = require('dw/util/LinkedHashSet');
    var googleDistanceHelper = require('*/cartridge/scripts/helpers/GoogleDistanceHelper');

    var filteredStores = new LinkedHashSet();
    var storeDistanceDictionary = {};

    var googleLocationHelpers = require('*/cartridge/scripts/helpers/googleLocationHelpers');
    var countrySitePref = Site.getCurrent().getCustomPreferenceValue('countryCode');
    var countryCode = 'value' in countrySitePref ? countrySitePref.value : 'US';
    var locationResult = googleLocationHelpers.convertZipcodeToLocation(postalCode, countryCode);

    if (empty(locationResult) || empty(locationResult.longitude) || empty(locationResult.latitude)) {
        return {
            filteredStores: filteredStores,
            storeDistanceDictionary: storeDistanceDictionary
        };
    }

    var origin = {
        latitude: locationResult.latitude,
        longitude: locationResult.longitude
    };

    if (stores && stores.length > 0) {
        var storeList = stores.toArray(0, CHECKING_STORE_COUNT);
        // get stores coordinates
        var destinations = [];
        for (var i = 0; i < storeList.length; i++) {
            var store = storeList[i];
            var destination = {
                latitude: store.latitude,
                longitude: store.longitude
            };
            destinations.push(destination);
        }

        var distanceResult = googleDistanceHelper.getDistanceToStores(origin, destinations);
        if (!distanceResult.error) {
            var distanceList = distanceResult.distanceList;

            // update stores with google distance value
            for (var j = 0; j < storeList.length; j++) {
                var updatedStore = storeList[j];
                var distance = distanceList[j];
                storeDistanceDictionary[updatedStore.ID] = distance;
            }

            var sortedStores = storeList.sort(function (a, b) {
                var aDistanceStr = !empty(storeDistanceDictionary[a.ID]) ? storeDistanceDictionary[a.ID].split(' ')[0] : '0';
                var bDistanceStr = !empty(storeDistanceDictionary[b.ID]) ? storeDistanceDictionary[b.ID].split(' ')[0] : '0';
                var aDistanceValue = parseFloat(aDistanceStr);
                var bDistanceValue = parseFloat(bDistanceStr);
                return aDistanceValue - bDistanceValue;
            });

            sortedStores.map(function (sortedStore) {
                filteredStores.add(sortedStore);
                return sortedStore;
            });
        }
    }

    var result = {
        filteredStores: filteredStores,
        storeDistanceDictionary: storeDistanceDictionary
    };

    return result;
}

/**
 * Searches for stores by inventory and delivery method
 * @param {dw.util.Set} stores - founded stores
 * @param {string} extraProductId - extraProductId
 * @param {string} extraProductQuantity - extraProductQuantity
 * @param {string} eventType - event type which button was clicked
 * @param {string} shippingMethod - shippingMethod passed from dealer selector modal
 * @returns {Object} filtered stores
 */
function filterStoresByInventoryAndDeliveryMethod(stores, extraProductId, extraProductQuantity, eventType, shippingMethod) { // eslint-disable-line
    var LinkedHashSet = require('dw/util/LinkedHashSet');
    var bsHelper = require('org_mtd_ma/cartridge/scripts/utils/ButtonStateHelper');
    var dealerHelpers = require('*/cartridge/scripts/dealer/dealerHelpers');

    var filteredStores = new LinkedHashSet();
    var availableStoreDictionary = {};

    if (stores && stores.length > 0) {
        var storeList = stores.toArray();

        for (var j = 0; j < storeList.length; j++) {
            var store = storeList[j];

            var stateResult = null;

            var isExtraProdcutChecked = false;
            if (empty(extraProductId)) {
                isExtraProdcutChecked = true;
            }

            var isDealerMeetRequirements = true;
            var dealerDeliveryTime = null;
            var pickUpTime = null;

            var currentBasket = BasketMgr.getCurrentBasket();
            var shippingMethodId = !empty(shippingMethod) ? shippingMethod : null;

            if (currentBasket) {
                var shipment = currentBasket.getDefaultShipment();
                if (shipment && empty(shippingMethodId)) {
                    shippingMethodId = shipment.getShippingMethodID();
                }

                var productLineItems = currentBasket.getAllProductLineItems();
                for (var i = 0; i < productLineItems.length; i++) {
                    var productLineItem = productLineItems[i];

                    var productId = productLineItem.productID;
                    var productQuantity = productLineItem.quantityValue;

                    // check states for extraProduct product which exists in basket
                    if (!isExtraProdcutChecked && extraProductId === productId) {
                        isExtraProdcutChecked = true;
                        stateResult = bsHelper.getDeliveryStates(store, productId, extraProductQuantity, true, true, productQuantity);
                        break;
                    }

                    // check states for a first item in cart if extraProduct was not passed
                    if (isExtraProdcutChecked) {
                        stateResult = bsHelper.getDeliveryStates(store, productId, 1, true, false);
                        break;
                    }
                }
            }

            // check states for extraProduct product which does not exist in basket
            if (!isExtraProdcutChecked && !stateResult) {
                var extraProduct = ProductMgr.getProduct(extraProductId);
                if (!extraProduct) {
                    isDealerMeetRequirements = false;
                }

                if (isDealerMeetRequirements) {
                    stateResult = bsHelper.getDeliveryStates(store, extraProductId, extraProductQuantity, false);
                }
            }

            // check delivery option and timeframe
            if (stateResult) {
                if (eventType === 'findDeliveryOption') {
                    if (!stateResult.dealerDelivery) {
                        isDealerMeetRequirements = false;
                    } else {
                        dealerDeliveryTime = stateResult.dealerDelivery ? stateResult.dealerDeliveryTime : '';
                    }
                } else if (!empty(shippingMethodId) && shippingMethodId === 'dealer-delivery') {
                    if (!stateResult.dealerDelivery) { // eslint-disable-line
                        isDealerMeetRequirements = false;
                    } else {
                        dealerDeliveryTime = stateResult.dealerDelivery ? stateResult.dealerDeliveryTime : '';
                        pickUpTime = stateResult.pickUp ? stateResult.pickUpTime : '';
                    }
                } else if (!empty(shippingMethodId) && shippingMethodId === 'dealer-pickup') {
                    if (!stateResult.pickUp) { // eslint-disable-line
                        isDealerMeetRequirements = false;
                    } else {
                        dealerDeliveryTime = stateResult.dealerDelivery ? stateResult.dealerDeliveryTime : '';
                        pickUpTime = stateResult.pickUp ? stateResult.pickUpTime : '';
                    }
                } else if (!empty(shippingMethodId)) {
                    if (!stateResult.shipToHome) { // eslint-disable-line
                        isDealerMeetRequirements = false;
                    } else {
                        dealerDeliveryTime = stateResult.dealerDelivery ? stateResult.dealerDeliveryTime : '';
                        pickUpTime = stateResult.pickUp ? stateResult.pickUpTime : '';
                    }
                } else {
                    if (!stateResult.dealerDelivery && !stateResult.pickUp && !stateResult.shipToHome) { // eslint-disable-line
                        isDealerMeetRequirements = false;
                    } else {
                        dealerDeliveryTime = stateResult.dealerDelivery ? stateResult.dealerDeliveryTime : '';
                        pickUpTime = stateResult.pickUp ? stateResult.pickUpTime : '';
                    }
                }
            }

            // save dealer if it meets delivery option requirements and has all orderable products
            if (isDealerMeetRequirements) {
                var checkedProduct = ProductMgr.getProduct(extraProductId);
                var basket = BasketMgr.getCurrentBasket();
                var isDealerHasAllProducts = dealerHelpers.selectedDealerHasAllOrderableProducts(basket, store, checkedProduct, extraProductQuantity);
                if (isDealerHasAllProducts) {
                    var availableDealerObject = {
                        dealerDeliveryTime: dealerDeliveryTime,
                        pickUpTime: pickUpTime
                    };
                    availableStoreDictionary[store.ID] = availableDealerObject;
                    filteredStores.add(store);

                    // get only MODAL_STORES_COUNT stores
                    if (filteredStores.length === MODAL_STORES_COUNT) {
                        break;
                    }
                }
            }
        }
    }

    var result = {
        availableStoreDictionary: availableStoreDictionary,
        filteredStores: filteredStores
    };

    return result;
}

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
 * @param {string} productId - current product
 * @param {number} quantity - current product quantity
 * @param {string} eventType - event type which button was clicked
 * @param {string} shippingMethod - shippingMethod passed from dealer selector modal
 * @returns {Object} a plain object containing the results of the search
 */
function getStoresForDealerSelectorModal(radius, postalCode, lat, long, geolocation, showMap, url, isServiceLocator, productId, quantity, eventType, shippingMethod) {
    var StoresModel = require('*/cartridge/models/stores');
    var filteredResult = null;
    var parameters = {
        isDealerSelectorModal: true
    };

    var searchResult = searchStores(radius, postalCode, lat, long, geolocation, showMap, url, isServiceLocator);
    filteredResult = searchResult.filteredStores;

    // filter stores by google distance
    if (Site.getCurrent().getCustomPreferenceValue('enableGoogleDrivingDistance')) {
        var googleDistanceResult = filterStoresByGoogleDistance(postalCode, filteredResult);
        if (Object.keys(googleDistanceResult.storeDistanceDictionary).length !== 0) {
            parameters.storeDistanceDictionary = googleDistanceResult.storeDistanceDictionary;
        }
        filteredResult = googleDistanceResult.filteredStores;
    }

    // filter stores by inventory and delivery method
    var searchInventoryResult = filterStoresByInventoryAndDeliveryMethod(filteredResult, productId, quantity, eventType, shippingMethod);
    if (Object.keys(searchInventoryResult.availableStoreDictionary).length !== 0) {
        parameters.availableStoreDictionary = searchInventoryResult.availableStoreDictionary;
    }
    filteredResult = searchInventoryResult.filteredStores;

    // filter stores by dealer mini site enabled
    filteredResult = filterStoresByDealerMiniSiteEnabled(filteredResult);

    var stores = new StoresModel(filteredResult, searchResult.searchKey, searchResult.resolvedRadius, searchResult.actionUrl, searchResult.apiKey, parameters);

    return stores;
}

/**
 * create the stores results for dealer modal html
 * @param {Array} storesInfo - an array of objects that contains store information
 * @returns {string} The rendered HTML
 */
function createDealerModalStoresResultsHtml(storesInfo) {
    var HashMap = require('dw/util/HashMap');
    var Template = require('dw/util/Template');

    var context = new HashMap();
    var object = { stores: { stores: storesInfo } };

    Object.keys(object).forEach(function (key) {
        context.put(key, object[key]);
    });

    var template = new Template('dealer/dealerSelectorModal/storeLocatorResults');
    return template.render(context).text;
}

base.getStores = getStores;
base.getStoresForDealerSelectorModal = getStoresForDealerSelectorModal;
base.createDealerModalStoresResultsHtml = createDealerModalStoresResultsHtml;

module.exports = base;
