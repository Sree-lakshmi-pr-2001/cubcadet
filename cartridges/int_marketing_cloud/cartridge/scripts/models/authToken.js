'use strict';

/**
 * @module models/authToken
 */

/**
 * Custom object name
 * @const {string}
 * @private
 */
const customObjectName = 'MarketingCloudAuthToken';
const helpers = require('../util/helpers');
const mcServiceConfig = require('*/cartridge/scripts/init/rest');
const Logger = require('dw/system/Logger');
/**
 * Retrieves cached token from custom object storage
 * If no existing token object, an empty one is created
 * @returns {dw.object.CustomAttributes} Returns token custom attributes
 */
function getObject(iSiteId) {
    var siteId =iSiteId;
    if (!siteId){
        siteId = require('dw/system/Site').current.ID;
    }
    return helpers.getCustomObject(customObjectName, siteId, true);
}

/**
 * Puts token into custom object storage
 * @param {Object} obj A plain JS object with the token
 * @returns {Object} Returns the same plain JS object
 */
function updateCachedTokenObject(obj, siteId) {
    var custObj = getObject(siteId);

    require('dw/system/Transaction').wrap(function(){
        custObj.token = JSON.stringify(obj);
    });

    return obj;
}

/**
 * Returns whether the stored token is valid
 * @returns {boolean} Whether the stored token is valid and not expired
 * @alias module:models/authToken~AuthToken#isValidAuth
 */
function isValidAuth(siteId) {
    if(!this.token || !this.token.accessToken){
        var cachedToken = getObject(siteId);
        if (!cachedToken || !cachedToken.token) {
            return false;
        }
        this.token = JSON.parse(cachedToken.token);
    }

    // check if expires is in the future
    return this.token && this.token.accessToken && this.token.expires > Date.now();
}

/**
 * Gets a valid token from storage or from a new auth request
 * @returns {boolean|Object} False or plain JS object containing the token response
 * @alias module:models/authToken~AuthToken#getValidToken
 */
function getValidToken(siteId) {
    Logger.error('mtd - getValidToken 1 : ' + this.token);
    // if(!this.isValidAuth()){
        var result = mcServiceConfig.getAuthService('marketingcloud.rest.auth', siteId).call();
        if (result.status === 'OK' && result.object) {
            this.token = updateCachedTokenObject(result.object);
        }
    // }
    Logger.error('mtd - getValidToken 2 : ' + JSON.stringify(this.token));

    return this.isValidAuth(siteId) && this.token;
}

/**
 * Token class for checking auth and retrieving valid token
 * @constructor
 * @alias module:models/authToken~AuthToken
 */
function AuthToken() {
    /**
     * Token object returned by Marketing Cloud
     * @type {Object}
     * @property {string} accessToken The token auth string
     * @property {number} expiresIn Expiration in seconds, relative to when requested
     * @property {number} issued Date issued in milliseconds
     * @property {number} expires Date expires in milliseconds
     */
    this.token = null;
}

/**
 * @alias module:models/authToken~AuthToken#prototype
 */
AuthToken.prototype = {
    isValidAuth: function isValid(){
        return isValidAuth.apply(this);
    },

    getValidToken: function getValid(){
        return getValidToken.apply(this);
    }
};

module.exports = AuthToken;
