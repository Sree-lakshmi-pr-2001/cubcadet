/* global session */
'use strict';

/**
 * Include Modules
 */
var Util = require('~/cartridge/scripts/helpers/Util');

/**
 * Get Request Object by Number
 *
 * @param {string} orderId - Order ID
 * @param {string} refNum - Chase refNum
 * @param {string} refIdx - Chase refId
 * @param {dw.ws.WebReference2} chaseWebReference - WSDL reference
 * @param {dw.svc.ServiceCredential} credentials - Service creds
 * @param {string} onlineReversalInd - Y for reversals, N for voids
 * @returns {Object} - return request object
 */
exports.getRequest = function (orderId, refNum, refIdx, chaseWebReference, credentials, onlineReversalInd) {
    var request = chaseWebReference.ReversalElement(); // eslint-disable-line new-cap

    // Set credentials
    request.orbitalConnectionUsername = credentials.user;
    request.orbitalConnectionPassword = credentials.password;

    // Set Configuration
    request.version = Util.VALUE.SOAP_VERSION;
    request.bin = Util.VALUE.SOAP_BIN;
    request.merchantID = Util.VALUE.MERCHANT_ID;
    request.terminalID = Util.VALUE.TERMINAL_ID;

    // Set Void data
    request.orderID = orderId;
    request.txRefNum = refNum;
    request.txRefIdx = refIdx;
    request.onlineReversalInd = onlineReversalInd;

    return request;
};
