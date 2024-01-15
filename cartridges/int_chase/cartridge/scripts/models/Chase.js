'use strict';

/**
 * API dependencies
 */
var Status = require('dw/system/Status');

/**
 * Include dependencies
 */
var Util = require('~/cartridge/scripts/helpers/Util');
var SoapServices = require('~/cartridge/scripts/services/SoapServices');
var Logger = require('dw/system/Logger');
/**
 * Export Values of Util script
 */
exports.VALUE = Util.VALUE;

/**
 * Authorize
 *
 * @param {Object} paymentData - payment JSON data
 * @param {boolean} isRepeat - check if it is second call to another server
 * @param {boolean} order - order
 * @returns {dw.system.Status} - return status
 */
exports.authorize = function (paymentData, isRepeat, order) {
    var status;
    var code;
    var responseObject;
    try {
        // Verify payment data is passed
        if (!paymentData) {
            Logger.error('No required parameters passed')
            throw new Error('No required parameters passed');
        }
        // Get valid sever custom object
        var validServer = Util.getValidServer();
        if (!validServer) {
            Logger.error('No valid server found');
            throw new Error('No valid server found');
        }
        // Make API call
        var result = SoapServices.ChaseService.call({
            data: paymentData,
            url: validServer.custom.serverURL,
            type: 'authorize',
            order: order
        });
        responseObject = result.object;
        if (!result.ok) {
            // Make additional call to another server if first time it failed
            if (!isRepeat) {
                // Mark server as failed
                Util.failServer(validServer);
                return this.authorize(paymentData, true);
            } else { // eslint-disable-line no-else-return
                status = Status.ERROR;
                code = result.error;
            }
        } else {
            status = Status.OK;
            code = 'OK';
        }
    } catch (e) {
        // var exception = e;
        Util.log.error('{0} - {1}', e, e.stack);
        status = Status.ERROR;
        code = 'SYSTEM_ERROR';
    }

    var responseStatus = new Status(status, code);
    // Add redirect URL data to Status
    if (!responseStatus.isError()) {
        responseStatus.addDetail('response', responseObject); // eslint-disable-line dot-notation
    }
    return responseStatus;
};

/**
 * Void
 *
 * @param {string} orderId - Order ID
 * @param {string} refNum - Chase refNum
 * @param {string} refIdx - Chase refIdx
 * @param {boolean} isRepeat - check if it is second call to another server
 * @param {string} cardType - card type for credit
 * @param {string} forceVoidOverReversal - if this is a retry because of a 9812 response
 * @returns {dw.system.Status} - return status
 */
exports.void = function (orderId, refNum, refIdx, isRepeat, cardType, forceVoidOverReversal) {
    var status;
    var code;
    var responseObject;
    try {
        // Verify if required params exist
        if (!orderId || !refNum || !refIdx) {
            throw new Error('No required parameters passed');
        }

        // Get valid sever custom object
        var validServer = Util.getValidServer();
        if (!validServer) {
            throw new Error('No valid server found');
        }

        var onlineReversalIndicator = 'Y';

        if (cardType === 'Amex') {
            // American Express should issue Void, all other CC should be reversals
            onlineReversalIndicator = 'N';
        }

        if (forceVoidOverReversal) {
            onlineReversalIndicator = 'N';
        }

        Logger.debug('orderId #' + orderId + ', cardType : ' + cardType + ', onlineReversalInd : ' + onlineReversalIndicator + ', forceVoidOverReversal : ' + forceVoidOverReversal + ', isRepeat: ' + isRepeat);

        var result = SoapServices.ChaseService.call({
            orderId: orderId,
            refNum: refNum,
            refIdx: refIdx,
            url: validServer.custom.serverURL,
            onlineReversalInd: onlineReversalIndicator,
            type: 'reversal'
        });
        responseObject = result.object;

        if (responseObject && responseObject.procStatus) {
            Logger.debug('orderId #' + orderId + ', cardType : ' + cardType + ', onlineReversalInd : ' + onlineReversalIndicator + ', forceVoidOverReversal : ' + forceVoidOverReversal + ', responseObject.procStatus : ' + responseObject.procStatus);
        }

        if (!isRepeat && responseObject && ( responseObject.procStatus == '9812' || responseObject.procStatus == 9812)) { // eslint-disable-line
            Logger.debug('received 9812, orderId #' + orderId);
            // Util.failServer(validServer);
            return this.void(orderId, refNum, refIdx, true, cardType, true);
        } else { // eslint-disable-line
            if (!result.ok) { // eslint-disable-line
                // Make additional call to another server if first time it failed
                if (!isRepeat) {
                    // Mark server as failed
                    // Util.failServer(validServer);
                    return this.void(orderId, refNum, refIdx, true, cardType, false);
                } else { // eslint-disable-line no-else-return
                    status = Status.ERROR;
                    code = result.error;
                }
            } else {
                status = Status.OK;
                code = 'OK';
            }
        }
    } catch (e) {
        // var exception = e;
        Util.log.error('{0} - {1}', e, e.stack);
        status = Status.ERROR;
        code = 'SYSTEM_ERROR';
    }

    var responseStatus = new Status(status, code);
    // Add redirect URL data to Status
    if (!responseStatus.isError()) {
        responseStatus.addDetail('response', responseObject); // eslint-disable-line dot-notation
    }
    return responseStatus;
};

/**
 * Safetech Fraud Analysis
 *
 * @param {Object} paymentData - payment JSON data
 * @param {boolean} isRepeat - check if it is second call to another server
 * @param {dw.order.Order} order - the order
 * @returns {dw.system.Status} - return status
 */
exports.safetechFraudAnalysis = function (paymentData, isRepeat, order) {
    var status;
    var code;
    var responseObject;
    try {
        // Verify payment data is passed
        if (!paymentData) {
            Logger.error('No required parameters passed');
            throw new Error('No required parameters passed');
        }
        // Get valid sever custom object
        var validServer = Util.getValidServer();
        if (!validServer) {
            Logger.error('No valid server found');
            throw new Error('No valid server found');
        }
        // Make API call
        var result = SoapServices.ChaseService.call({
            data: paymentData,
            url: validServer.custom.serverURL,
            type: 'safetechFraudAnalysis',
            order: order
        });
        responseObject = result.object;
        if (!result.ok) {
            // Make additional call to another server if first time it failed
            if (!isRepeat) {
                // Mark server as failed
                Util.failServer(validServer);
                return this.safetechFraudAnalysis(paymentData, true, order);
            } else { // eslint-disable-line no-else-return
                status = Status.ERROR;
                code = result.error;
            }
        } else {
            status = Status.OK;
            code = 'OK';
        }
    } catch (e) {
        Util.log.error('{0} - {1}', e, e.stack);
        status = Status.ERROR;
        code = 'SYSTEM_ERROR';
    }

    var responseStatus = new Status(status, code);
    // Add redirect URL data to Status
    if (!responseStatus.isError()) {
        responseStatus.addDetail('response', responseObject); // eslint-disable-line dot-notation
    }
    return responseStatus;
};
