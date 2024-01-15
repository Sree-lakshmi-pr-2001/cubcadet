'use strict';

/**
 * Utility functions for MTD services
 */

/* API Dependencies */
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var Calendar = require('dw/util/Calendar');

/**
 * Script dependencies
 */

/* Preference IDs */
var PREFERENCE = {

    /**
     * Client ID
     *
     * @type {string}
     */
    CLIENT_ID: 'mtdServicesClientID',

    /**
     * Client Secret
     *
     * @type {string}
     */
    CLIENT_SECRET: 'mtdServicesClientSecret',

    /**
     * Username
     *
     * @type {string}
     */
    USERNAME: 'mtdServicesUsername',

    /**
     * Pasword
     *
     * @type {string}
     */
    PASSWORD: 'mtdServicesPassword',

    /**
     * Tax system name
     *
     * @type {string}
     */
    TAX_SYSTEM_NAME: 'taxSystemName',

    /**
     * Use backup tax table
     *
     * @type {string}
     */
    USE_BACKUP_TAX_TABLE: 'useBackupTaxTable',

    /**
     * Address Validation Enabled
     *
     * @type {string}
     */
    ADDRESS_VALIDATION_ENABLED: 'mtdAddressValidationEnabled',

    /**
     * Enable Manuals Search
     *
     * @type {string}
     */
    ENABLE_MANUAL_SEARCH: 'enableManualsSearch',

    /**
     * Manual Search brand code
     *
     * @type {string}
     */
    MANUAL_SEARCH_BRAND_CODE: 'mtdManualsBrandCode',

    /**
     * Enable Dealer Fulfillment
     *
     * @type {string}
     */
    ENABLE_DEALER_FULFILLMENT: 'mtdDealerFulfillmentEnabled',

    /**
     * Dealer Consumer Proximity
     *
     * @type {string}
     */
    DEALER_CONSUMER_PROXIMITY: 'mtdDealerConsumerProximity',

    /**
     * Dealer Number Allowed
     *
     * @type {string}
     */
    DEALER_NUMBER_ALLOWED: 'mtdDealerNumberAllowed',

    /**
     * Dealer Retailer Brand
     *
     * @type {string}
     */
    DEALER_RETAILER_BRAND: 'mtdDealerRetailerBrand',

    /**
     * Dealer Pickup Method ID
     *
     * @type {string}
     */
    DEALER_PICKUP_METHOD: 'mtdDealerPickupMethodId',

    /**
     * Dealer Delivery Method ID
     *
     * @type {string}
     */
    DEALER_DELIVERY_METHOD: 'mtdDealerDeliveryMethodId',

    /**
     * Dealer Show required products
     *
     * @type {string}
     */
    DEALER_SHOW_REQUIRED_PRODUCTS: 'mtdShowDealerRequiredProducts',

    /**
     * Dealer CARB compliance Enabled
     *
     * @type {string}
     */
    CARB_COMPLIANCE_ENABLED: 'CARBEnabled'
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
     * Site Preference value for oAuth client ID
     * @type {string}
     */
    CLIENT_ID: getPreferenceValue(PREFERENCE.CLIENT_ID),

    /**
     * Site Preference value for oAuth client secret
     * @type {string}
     */
    CLIENT_SECRET: getPreferenceValue(PREFERENCE.CLIENT_SECRET),

    /**
     * Site Preference value for oAuth username
     * @type {string}
     */
    USERNAME: getPreferenceValue(PREFERENCE.USERNAME),

    /**
     * Site Preference value for oAuth password
     * @type {string}
     */
    PASSWORD: getPreferenceValue(PREFERENCE.PASSWORD),

    /**
     * Site Preference value for tax system name
     * @type {string}
     */
    TAX_SYSTEM_NAME: getPreferenceValue(PREFERENCE.TAX_SYSTEM_NAME),

    /**
     * Site Preference value for using backup tax table
     * @type {boolean}
     */
    USE_BACKUP_TAX_TABLE: getPreferenceValue(PREFERENCE.USE_BACKUP_TAX_TABLE),

    /**
     * Site Preference value for verify if address validation is enabled
     * @type {boolean}
     */
    ADDRESS_VALIDATION_ENABLED: getPreferenceValue(PREFERENCE.ADDRESS_VALIDATION_ENABLED),

    /**
     * Site Preference value for verify if address validation is enabled
     * @type {boolean}
     */
    ENABLE_MANUAL_SEARCH: getPreferenceValue(PREFERENCE.ENABLE_MANUAL_SEARCH),

    /**
     * Site Preference value for manual search brand code
     * @type {string}
     */
    MANUAL_SEARCH_BRAND_CODE: getPreferenceValue(PREFERENCE.MANUAL_SEARCH_BRAND_CODE),

    /**
     * Site Preference value for Enabling Dealer Fulfillment
     * @type {boolean}
     */
    ENABLE_DEALER_FULFILLMENT: getPreferenceValue(PREFERENCE.ENABLE_DEALER_FULFILLMENT),

    /**
     * Site Preference value for Dealer Consumer Proximity
     * @type {number}
     */
    DEALER_CONSUMER_PROXIMITY: getPreferenceValue(PREFERENCE.DEALER_CONSUMER_PROXIMITY),

    /**
     * Site Preference value for Dealer Number Allowed
     * @type {number}
     */
    DEALER_NUMBER_ALLOWED: getPreferenceValue(PREFERENCE.DEALER_NUMBER_ALLOWED),

    /**
     * Site Preference value for Dealer Retailer Brand
     * @type {string}
     */
    DEALER_RETAILER_BRAND: getPreferenceValue(PREFERENCE.DEALER_RETAILER_BRAND),

    /**
     * Site Preference value for Dealer Pickup Method ID
     *
     * @type {string}
     */
    DEALER_PICKUP_METHOD: getPreferenceValue(PREFERENCE.DEALER_PICKUP_METHOD),

    /**
     * Site Preference value for Dealer Delivery Method ID
     *
     * @type {string}
     */
    DEALER_DELIVERY_METHOD: getPreferenceValue(PREFERENCE.DEALER_DELIVERY_METHOD),

    /**
     * Site Preference value for Dealer Show Required Products
     *
     * @type {boolean}
     */
    DEALER_SHOW_REQUIRED_PRODUCTS: getPreferenceValue(PREFERENCE.DEALER_DELIVERY_METHOD),

    /**
     * Site Preference value for Dealer CARB compliance
     *
     * @type {boolean}
     */
    CARB_COMPLIANCE_ENABLED: getPreferenceValue(PREFERENCE.CARB_COMPLIANCE_ENABLED),

    /**
     * Grant Type for oAuth
     * @type {string}
     */
    GRANT_TYPE: 'password',

    /**
     * Authentication Type
     * @type {string}
     */
    AUTH_TYPE: 'Bearer',

    /**
     * oAuth Token Custom Object name
     * @type {string}
     */
    OAUTH_TOKEN_CO: 'MTDServiceOAuthToken',

    /**
     * Shipping Charge Code
     * @type {Object}
     */
    SHIPPING_CHARGE_CODE: {
        FRT: 'FRT',
        DFD: 'DFD'
    },

    /**
     * Order Level Charge Code
     * @type {Object}
     */
    ORDER_LEVEL_CHARGE_CODE: '713',

    /**
     * Number of visible dealer options
     * @type {number}
     */
    NUMBER_OF_VISIBLE_DEALER_OPTIONS: 6
};

exports.VALUE = VALUE;

/**
 * Get valid token from custom object
 *
 * @returns {string|null} - oAuth token
 */
exports.getValidTokenFromCO = function () {
    var token = null;
    // Get all tokens
    var tokenObj = CustomObjectMgr.getCustomObject(VALUE.OAUTH_TOKEN_CO, VALUE.AUTH_TYPE);
    if (tokenObj) {
        var tokenCreationDate = tokenObj.lastModified || tokenObj.creationDate;
        var tokenExpiresInSeconds = tokenObj.custom.expiresIn;
        var currentCalendar = new Calendar();
        var expireCalendar = new Calendar(tokenCreationDate);
        // We add 3 seconds less in order not to have any issue with the call
        expireCalendar.add(Calendar.SECOND, tokenExpiresInSeconds - 3);
        // Check if token is still valid
        if (currentCalendar.compareTo(expireCalendar) <= 0) {
            token = tokenObj.custom.accessToken;
        }
    }

    return token;
};

/**
 * Save a new token
 *
 * @param {Object} tokenData - token data from API response
 */
exports.saveNewToken = function (tokenData) {
    // Get all tokens
    var tokenObj = CustomObjectMgr.getCustomObject(VALUE.OAUTH_TOKEN_CO, VALUE.AUTH_TYPE);

    // Save a new token
    Transaction.wrap(function () {
        // Create an object if it doesn't exist
        if (!tokenObj) {
            tokenObj = CustomObjectMgr.createCustomObject(VALUE.OAUTH_TOKEN_CO, VALUE.AUTH_TYPE);
        }
        tokenObj.custom.accessToken = tokenData.access_token;
        tokenObj.custom.refreshToken = tokenData.refresh_token;
        tokenObj.custom.expiresIn = Number(tokenData.expires_in);
    });
};

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
