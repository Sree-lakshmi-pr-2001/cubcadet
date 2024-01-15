'use strict';

/**
 * Utility functions for ARI
 */

/* API Dependencies */
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');

/**
 * Script dependencies
 */

/* Preference IDs */
var PREFERENCE = {

    /**
     * Enabled ARI Part Stream
     *
     * @type {string}
     */
    ENABLED: 'ariEnabled',

    /**
     * JavaScript endPoint
     *
     * @type {string}
     */
    JS_URL: 'ariJSURL',

    /**
     * App Key
     *
     * @type {string}
     */
    APP_KEY: 'ariAppKey',

    /**
     * Brand Code
     *
     * @type {string}
     */
    BRAND_CODE: 'ariBrandCode'
};

exports.PREFERENCE = PREFERENCE;

/**
 * Convenience method to get a site custom preference
 *
 * @param {string} id -The Site Preference ID
 * @returns {*} - Value of custom site preference
 */
function getPreferenceValue(id) {
    return Site.getCurrent().getCustomPreferenceValue(id);
}

var VALUE = {
    /**
     * Site Preference value for enabling ARI PartStream
     * @type {string}
     */
    ENABLED: getPreferenceValue(PREFERENCE.ENABLED),

    /**
     * Site Preference value for JavaScript URL
     * @type {string}
     */
    JS_URL: getPreferenceValue(PREFERENCE.JS_URL),

    /**
     * Site Preference value for App Key
     * @type {string}
     */
    APP_KEY: getPreferenceValue(PREFERENCE.APP_KEY),

    /**
     * Site Preference value for brand code
     * @type {string}
     */
    BRAND_CODE: getPreferenceValue(PREFERENCE.BRAND_CODE)
};

exports.VALUE = VALUE;

/**
 * Shared Logger
 * @type {Log}
 */
var log = Logger.getLogger('mtdServices', 'mtdServices');

/**
 * Relate Logger
 * @type {Log}
 */
exports.log = log;
