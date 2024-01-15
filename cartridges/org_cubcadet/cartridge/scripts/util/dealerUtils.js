'use strict';
/* global request, session, empty */

var storeMgr = require('dw/catalog/StoreMgr');
var Site = require('dw/system/Site');

/**
 * Find the store closest to given location
 * @param {Object} location where we looking for a store
 * @returns {Array} list of stores
 */
function getClosestStore(location) {
    var radius = 100;
    var countrySitePref = Site.getCurrent().getCustomPreferenceValue('countryCode');
    var countryCode = 'value' in countrySitePref ? countrySitePref.value : 'US';
    var distanceUnit = countryCode === 'US' ? 'mi' : 'km';
    var searchQuery = 'custom.dealer_minisite_enabled = true';

    var closestStores = storeMgr.searchStoresByCoordinates(location.latitude, location.longitude, distanceUnit, radius, searchQuery);

    if (closestStores.length) {
        for (var store in closestStores) { // eslint-disable-line
            if (store.custom.dealer_minisite_enabled) {
                return store;
            }
        }
    }

    return null;
}

/**
 * Set Delivery ZipCode if it does not exist
 */
function setDeliveryZipCode() {
    var dealerHelpers = require('*/cartridge/scripts/dealer/dealerHelpers');
    var currentZipCode = dealerHelpers.getDeliveryZipCode();
    if (!currentZipCode) {
        var newZipCode = request.geolocation.postalCode;
        dealerHelpers.setDeliveryZipCode(newZipCode);
    }
}

/**
 * @function
 * @desc Initialize Store and Delivery zipcode
 */
exports.initializeStoreAndZipcode = function () {
    var storeId = storeMgr.getStoreIDFromSession();
    var storeExists = storeId && storeMgr.getStore(storeId);

    var countrySitePref = Site.getCurrent().getCustomPreferenceValue('countryCode');
    var countryCode = 'value' in countrySitePref ? countrySitePref.value : 'US';

    if (!storeExists && ((countryCode === 'CA' && request.geolocation && request.geolocation.postalCode) || (countryCode === 'US'))) {
        // test locations for US and CA
        /* var location = null;
        if (Site.current.ID === 'cubcadet') {
            location = { latitude: 41.836828, longitude: -87.665405 };
        } else if (Site.current.ID === 'cubcadetca') {
            location = { latitude: 53.5000762, longitude: -113.6286871 };
        }*/
        var location = request.geolocation;

        var closestStore = getClosestStore(location);
        storeMgr.setStoreIDToSession(closestStore ? closestStore.ID : null);
    }

    setDeliveryZipCode();
};
