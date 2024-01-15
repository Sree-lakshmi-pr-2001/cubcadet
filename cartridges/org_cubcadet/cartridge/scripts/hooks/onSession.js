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
var Site = require('dw/system/Site');

/**
 * RegEx used to identify system-generated requests that can be ignored
 * @type {RegExp}
 */
var systemRegEx = /__Analytics|__SYSTEM__/;

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
    var automaticGeolocationEnabled = Site.current.getCustomPreferenceValue('automaticGeolocationEnabled');

    if (automaticGeolocationEnabled && !isBM() && !isSystemRequest()) {
        var dealerUtils = require('*/cartridge/scripts/util/dealerUtils');
        dealerUtils.initializeStoreAndZipcode();
    }
    return new Status(Status.OK);
};
