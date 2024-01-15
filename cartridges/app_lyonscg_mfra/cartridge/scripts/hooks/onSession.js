'use strict';
/* global request, session, empty */

/**
 * The onSession hook is called for every new session in a site. This hook can be used for initializations,
 * like to prepare promotions or pricebooks based on source codes or affiliate information in
 * the initial URL. For performance reasons the hook function should be kept short.
 *
 * @module  request/OnSession
 */

var Status = require('dw/system/Status');

var storeMgr = require('dw/catalog/StoreMgr');
/**
 * RegEx used to identify system-generated requests that can be ignored
 * @type {RegExp}
 */
var systemRegEx = /__Analytics|__SYSTEM__/;

/**
 * Find the store closest to given location
 * @param {Object} location where we looking for a store
 * @returns {Array} list of stores
 */
function getClosestStore(location) {
    var radius = 100;
    var results = storeMgr.searchStoresByCoordinates(location.latitude, location.longitude, 'mi', radius);
    var stores = results.keySet();
    if (stores.length) {
        return stores[0];
    }
    return null;
}

/**
 * Returns true if system request (Analytics, SYSTEM, etc)
 * @returns {boolean} true if it's system request
 */
function isSystemRequest() {
    return request.httpRequest && systemRegEx.test(request.httpURL.toString());
}

/**
 * Returns true if script executing in Business Manager context (Sites-Site)
 * @returns {boolean} true if BM request
 */
function isBM() {
    // if Sites-Site, we're in Business Manager
    return require('dw/system/Site').current.ID === 'Sites-Site';
}

/**
 * @function
 * @desc The onSession hook function.
 * @return {Object} - Status object with an OK status
 */
exports.onSession = function () {
    // Updated the HTML element to contain a dynamic locale instead of a static 'en' (LRA-23)
    var locale = !empty(request.locale) ? request.locale : 'en';
    session.custom.currentLocale = !empty(locale) && locale !== 'default' ? locale.replace(/_/g, '-').toLowerCase() : 'en';
    var currentSite = require('dw/system/Site').current.ID;
    var isCubcadetSite = (currentSite === 'cubcadet' || currentSite === 'cubcadetca');

    // don't get closest store for cubcadet site as cubcadet has own onSession hook
    if (!isBM() && !isSystemRequest() && !isCubcadetSite) {
        if (!storeMgr.getStoreIDFromSession()) {
            // var testLocation = { 'latitude': 41.836828, 'longitude': -87.665405}
            var location = request.geolocation;

            var closestStore = getClosestStore(location);
            storeMgr.setStoreIDToSession(closestStore ? closestStore.ID : '');
        }
    }
    return new Status(Status.OK);
};
