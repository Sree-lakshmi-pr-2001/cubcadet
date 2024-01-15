'use strict';
/* global session */

/**
 * Utility functions for Chase cartridge
 */

/* API Dependencies */
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var StringUtils = require('dw/util/StringUtils');
var UUIDUtils = require('dw/util/UUIDUtils');

/**
 * Script dependencies
 */

/* Preference IDs */
var PREFERENCE = {

    /**
     * Merchant ID
     *
     * @type {string}
     */
    MERCHANT_ID: 'chaseMerchantId',

    /**
     * Terminal ID
     *
     * @type {string}
     */
    TERMINAL_ID: 'chaseTerminalId',

    /**
     * SOAP Version
     *
     * @type {String}
     */
    SOAP_VERSION: 'chaseSoapVersion',

    /**
     * SOAP Bin
     *
     * @type {String}
     */
    SOAP_BIN: 'chaseSoapBin',

    /**
     * Safetech Enabled
     *
     * @type {string}
     */
    SAFETECH_ENABLED: 'safetechEnabled',

    /**
     * Safetech Merchant ID
     *
     * @type {string}
     */
    SAFETECH_MERCHANT_ID: 'safetechMerchantID',

    /**
     * Safetech Website Short Name
     *
     * @type {string}
     */
    SAFETECH_WEBSITE_SHORT_NAME: 'safetechWebsiteShortName',

    /**
     * Safetech Collector Host
     *
     * @type {string}
     */
    SAFETECH_COLLECTOR_HOST: 'safetechCollectorHost'
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
     * Site Preference value for chase merchant ID
     * @type {string}
     */
    MERCHANT_ID: getPreferenceValue(PREFERENCE.MERCHANT_ID),

    /**
     * Site Preference value for chase terminal ID
     * @type {string}
     */
    TERMINAL_ID: getPreferenceValue(PREFERENCE.TERMINAL_ID),

    /**
     * Site Preference value for chase SOAP version
     * @type {string}
     */
    SOAP_VERSION: getPreferenceValue(PREFERENCE.SOAP_VERSION),

    /**
     * Site Preference value for chase SOAP bin
     * @type {string}
     */
    SOAP_BIN: getPreferenceValue(PREFERENCE.SOAP_BIN),

    /**
     * Connectivity State Custom Object name
     * @type {string}
     */
    CONNECTIVITY_STATE_CO: 'ChaseConnectivityState',

    /**
     * Industry type for auth request
     * @type {Object}
     */
    INDUSTRY_TYPE: {
        EC: 'EC',
        RC: 'RC'
    },

    /**
     * Site Preference value for Safetech Enabled
     * @type {string}
     */
    SAFETECH_ENABLED: getPreferenceValue(PREFERENCE.SAFETECH_ENABLED),

    /**
     * Site Preference value for Safetech Merchant ID
     * @type {string}
     */
    SAFETECH_MERCHANT_ID: getPreferenceValue(PREFERENCE.SAFETECH_MERCHANT_ID),

    /**
     * Site Preference value for Safetech Website Short Name
     * @type {string}
     */
    SAFETECH_WEBSITE_SHORT_NAME: getPreferenceValue(PREFERENCE.SAFETECH_WEBSITE_SHORT_NAME),

    /**
     * Site Preference value for Safetech Collector Host
     * @type {string}
     */
    SAFETECH_COLLECTOR_HOST: getPreferenceValue(PREFERENCE.SAFETECH_COLLECTOR_HOST),

    /**
     * Length of field in service
     * @type {number}
     */
    LENGTH: {
        AVS_NAME: 30,
        AVS_ADDRESS_1: 30,
        AVS_ADDRESS_2: 30,
        AVS_CITY: 20,
        AVS_DEST_NAME: 30,
        AVS_DEST_ADDRESS_1: 30,
        AVS_DEST_ADDRESS_2: 28,
        AVS_DEST_CITY: 20
    }
};

exports.VALUE = VALUE;

/**
 * Get first active server
 *
 * @returns {Object|null} - server URL
 */
exports.getValidServer = function () {
    // Get non failed server first
    var servers = CustomObjectMgr.queryCustomObjects(VALUE.CONNECTIVITY_STATE_CO, 'custom.isFailed = false', 'custom.serverID asc');
    if (servers.count > 0) {
        var firstActiveServer = servers.first();
        return firstActiveServer;
    }

    // If no active server return a first one
    var firstServer = CustomObjectMgr.getCustomObject(VALUE.CONNECTIVITY_STATE_CO, '1');
    if (firstServer) {
        return firstServer;
    }

    return null;
};

/**
 * Fail server
 *
 * @param {Object} serverCO - custom object of Server data
 */
exports.failServer = function (serverCO) {
    Transaction.begin();
    serverCO.custom.isFailed = true; // eslint-disable-line no-param-reassign
    serverCO.custom.failedTime = new Date(); // eslint-disable-line no-param-reassign
    Transaction.commit();
};

/**
 * Shared Logger
 * @type {Log}
 */
var log = Logger.getLogger('chasePayment', 'chasePayment');

/**
 * Relate Logger
 * @type {Log}
 */
exports.log = log;

/* Max Length Kaptcha Session ID */
var MAX_LENGTH_KAPTCHA_SESSION_ID = 32;

/**
 * Remove special characters from and truncate values to the maximum length
 *
 * @param {string} value - string
 * @param {number} maxLength - max length of string
 * @returns {number} - truncated string
 */
exports.cleanTruncate = function (value, maxLength) {
    var regex = new RegExp('[^0-9a-zA-Z]', 'g');
    return StringUtils.truncate(value.replace(regex, ' '), maxLength, null, null);
};

/**
 * Generate Kaptcha Session ID
 *
 * @returns {string} kaptchaSessionID - kaptchaSessionID
 */
exports.generateKaptchaSessionID = function () {
    var generatedKaptchaSessionID = UUIDUtils.createUUID();
    var kaptchaSessionID = this.cleanTruncate(generatedKaptchaSessionID, MAX_LENGTH_KAPTCHA_SESSION_ID);
    session.custom.kaptchaSessionID = kaptchaSessionID;
    return kaptchaSessionID;
};

/**
 * Return Kaptcha Session ID
 *
 * @returns {string} - truncated string
 */
exports.getKaptchaSessionID = function () {
    return session.custom.kaptchaSessionID;
};
