/* global session request */
'use strict';

/**
 * API dependencies
 */
var URLUtils = require('dw/web/URLUtils');
/**
 * Include Modules
 */
var Util = require('~/cartridge/scripts/helpers/Util');
/**
 * Get Request
 *
 * @param {dw.ws.WebReference2} brokerWebReference - WSDL reference
 * @param {dw.svc.ServiceCredential} credentials - Service creds
 * @returns {Object} - return request object
 */
exports.getRequest = function (brokerWebReference, credentials, prequal) {
    // Set credentials
    var validation = brokerWebReference.Validation(); // eslint-disable-line new-cap
    validation.userID = credentials.user;
    validation.password = credentials.password;
    // Set token request
    var accessTokenRequest = brokerWebReference.AccessTokenRequest(); // eslint-disable-line new-cap
    var accessKey = Util.VALUE.ACCESS_KEY;
    if (accessKey) {
        accessTokenRequest.accessKey = accessKey;
    }
    accessTokenRequest.IPAddress = Util.getUserIp();
    if(prequal === 'true'){
        accessTokenRequest.entryType = 'prequal';
        accessTokenRequest.preScreenId = '';
    }
    
    var accessTokenRequests = brokerWebReference.ArrayOfAccessTokenRequest(); // eslint-disable-line
    accessTokenRequests.accessTokenRequest.add(accessTokenRequest);

    // Set return URL
    var refererUrl = request.httpReferer || URLUtils.abs('Home-Show').toString();
    var returnUrls = brokerWebReference.ReturnURLs(); // eslint-disable-line new-cap
    returnUrls.setApprovedReturnUrl(refererUrl);
    returnUrls.setReferredReturnUrl(refererUrl);

    return {
        validation: validation,
        accessTokenRequests: accessTokenRequests,
        returnUrls: returnUrls
    };
};
