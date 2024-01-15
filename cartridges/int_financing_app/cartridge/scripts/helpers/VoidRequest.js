/* global session */
'use strict';

/**
 * API dependencies
 */

/**
 * Include Modules
 */

/**
 * Get Request
 *
 * @param {dw.ws.WebReference2} webReference - WSDL reference
 * @param {dw.svc.ServiceCredential} credentials - Service creds
 * @param {Object} data - data object
 * @returns {Object} - return request object
 */
exports.getRequest = function (webReference, credentials, data) {
    // Set credentials
    var validation = webReference.Validation(); // eslint-disable-line new-cap
    validation.userID = credentials.user;
    validation.password = credentials.password;

    // Set void request
    var voidRequest = webReference.VoidElement(); // eslint-disable-line new-cap
    voidRequest.setTransactionLinkTarget(Number(data.transactionLink));

    var requests = webReference.ArrayOfVoid(); // eslint-disable-line new-cap
    requests.voidArray.add(voidRequest);

    return {
        validation: validation,
        requests: requests
    };
};

/**
 * Prepare Data
 * @param {string} transactionLink - transaction link
 * @returns {Object} - data
 */
exports.prepareData = function (transactionLink) {
    return {
        transactionLink: transactionLink
    };
};
