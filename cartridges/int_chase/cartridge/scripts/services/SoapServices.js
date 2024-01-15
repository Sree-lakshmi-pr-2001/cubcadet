/* global webreferences2 webreferences */
'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var NewOrderRequest = require('~/cartridge/scripts/helpers/NewOrderRequest');
var ReversalRequest = require('~/cartridge/scripts/helpers/ReversalRequest');
var SafetechFraudAnalysisRequest = require('~/cartridge/scripts/helpers/SafetechFraudAnalysisRequest');
var System = require('dw/system/System');
var Logger = require('dw/system/Logger');
exports.ChaseService = LocalServiceRegistry.createService('chase.soap.newOrder', {
    /**
     * Initiate Service Client
     * @param {dw.svc.SOAPService} svc - SOAP service
     * @returns {Object} - default service
     */
    initServiceClient: function () {
        this.webReference = webreferences2.ChasePaymentech;
        return this.webReference.getDefaultService();
    },
    /**
     * Create Request
     *
     * @param {dw.svc.SOAPService} svc - SOAP service
     * @param {Object} args - request arguments
     * @returns {string|null} - result
     */
    createRequest: function (svc, args) {
        // Set active server URL
        svc.setURL(args.url);

        var requestObject = {};
        if (args.type === 'authorize') {
            requestObject.xml = NewOrderRequest.getRequest(args.data, this.webReference, svc.configuration.credential, args.order);
        } else if (args.type === 'safetechFraudAnalysis') {
            requestObject.xml = SafetechFraudAnalysisRequest.getRequest(args.data, this.webReference, svc.configuration.credential, args.order);
        } else if (args.type === 'reversal') {
            requestObject.xml = ReversalRequest.getRequest(
                    args.orderId, args.refNum, args.refIdx, this.webReference, svc.configuration.credential, args.onlineReversalInd);
        } else {
            throw new Error('Unkown operation type');
        }
        requestObject.type = args.type;
        return requestObject;
    },
    /**
     * Execute
     * @param {dw.svc.SOAPService} svc - SOAP service
     * @param {Object} requestObject - request object
     * @returns {Object} - result
     */
    execute: function (svc, requestObject) {
        var executeResult;
        if (requestObject.type === 'authorize') {
            executeResult = svc.serviceClient.newOrder(requestObject.xml);
        } else if (requestObject.type === 'safetechFraudAnalysis') {
            executeResult = svc.serviceClient.safetechFraudAnalysis(requestObject.xml);
        } else if (requestObject.type === 'reversal') {
            executeResult = svc.serviceClient.reversal(requestObject.xml);
        } else {
            throw new Error('Unkown operation type');
        }
        return executeResult;
    },
    /**
     * Parse Response
     *
     * @param {dw.svc.SOAPService} svc - SOAP service
     * @param {Object} response - response object
     * @returns {Object} - response object
     */
    parseResponse: function (svc, response) {
        return response;
    },
    /**
     * Get Request Log Message
     * @param {Object} request - request object
     * @returns {Object} request object
     */
    getRequestLogMessage: function (request) {
        var certLogger = Logger.getLogger('chaseCert', 'chaseCert');
        // Certification Logging
        if (System.getInstanceType() !== System.PRODUCTION_SYSTEM
                && System.getInstanceType() !== System.STAGING_SYSTEM
                && request.type === 'authorize') {
            
            var fullCC = String(request.xml.ccAccountNum);
            var cvv = String(request.xml.ccCardVerifyNum);
            var orderId = String(request.xml.orderID);
            var industryType = String(request.xml.industryType);
            var amount = Number(request.xml.amount) / 100;
            var address = ((request.xml.avsAddress2 !== null) ? String(request.xml.avsAddress2) : '') + '\n    ';
            address += String(request.xml.avsAddress1) + '\n    ';
            address += String(request.xml.avsCity) + ', ';
            address += String(request.xml.avsState) + ' ';
            address += String(request.xml.avsZip);

            var logData = '\n============== NEW CARD =============\n';
            logData += '\nCARD NUMBER: \n    {0}\n\n';
            logData += 'CVV: \n    {1}\n\n';
            logData += 'ORDER ID: \n    {2}\n\n';
            logData += 'INDUSTRY TYPE: \n    {3}\n\n';
            logData += 'AMOUNT: \n    {4}\n\n';
            logData += 'ADDRESS: \n    {5}\n';
            certLogger.info(logData, fullCC, cvv, orderId, industryType, amount, address);
        }

        var requestObj = {
            type: request.type,
            xml: {}
        };

        function getProp(xmlObject, newObject) { // eslint-disable-line require-jsdoc
            for (var element in xmlObject) { // eslint-disable-line no-restricted-syntax
                if (Object.prototype.hasOwnProperty.call(xmlObject, element)) {
                    if (xmlObject[element]) {
                        if (typeof xmlObject[element] === 'object') {
                            newObject[element] = {}; // eslint-disable-line no-param-reassign
                            getProp(xmlObject[element], newObject[element]);
                        } else if (typeof xmlObject[element] !== 'function') {
                            var elementValue;
                            if (element === 'ccAccountNum') {
                                var ccNumber = String(xmlObject[element]);
                                elementValue = '****' + ccNumber.substr(ccNumber.length - 4);
                            } else if (element === 'ccCardVerifyNum') {
                                elementValue = '***Some CVV***';
                            } else {
                                elementValue = String(xmlObject[element]);
                            }
                            newObject[element] = elementValue; // eslint-disable-line no-param-reassign
                        }
                    }
                }
            }
        }

        getProp(request.xml, requestObj.xml);
        certLogger.error('Chase ' + request.type + ' request obj :' + JSON.stringify(requestObj));
        return JSON.stringify(requestObj);
    },
    /**
     * Get Response Log Message
     * @param {Object} response - response object
     * @returns {Object} response
     */
    getResponseLogMessage: function (response) {
        var certLogger = Logger.getLogger('chaseCert', 'chaseCert');
        var responsetObj = {};
        var responseXML = response; // eslint-disable-line dot-notation

        // Certification Logging
        if (System.getInstanceType() !== System.PRODUCTION_SYSTEM
                && System.getInstanceType() !== System.STAGING_SYSTEM
                && 'authorizationCode' in responseXML) {
            
            var authCode = String(responseXML.authorizationCode);
            var customerRefNum = String(responseXML.customerRefNum);
            var txRefNum = String(responseXML.txRefNum);
            var statusMsg = String(responseXML.procStatusMessage);
            var respCode = String(responseXML.respCode);

            var logData = '\nAUTHORIZATION CODE: \n    {0}\n\n';
            logData += 'CUSTOMER REF NUMBER: \n    {1}\n\n';
            logData += 'TX REF NUMBER: \n    {2}\n\n';
            logData += 'STATUS MESSAGE: \n    {3}\n\n';
            logData += 'RESPONSE CODE: \n    {4}\n';
            certLogger.info(logData, authCode, customerRefNum, txRefNum, statusMsg, respCode);
        }

        function getProp(xmlObject, newObject) { // eslint-disable-line require-jsdoc
            for (var element in xmlObject) { // eslint-disable-line no-restricted-syntax
                if (Object.prototype.hasOwnProperty.call(xmlObject, element)) {
                    if (xmlObject[element]) {
                        if (typeof xmlObject[element] === 'object') {
                            newObject[element] = {}; // eslint-disable-line no-param-reassign
                            getProp(xmlObject[element], newObject[element]);
                        } else if (typeof xmlObject[element] !== 'function') {
                            newObject[element] = String(xmlObject[element]); // eslint-disable-line no-param-reassign
                        }
                    }
                }
            }
        }

        getProp(responseXML, responsetObj);
        certLogger.error('Chase response: ' + JSON.stringify(responsetObj));
        return JSON.stringify(responsetObj);
    },
    /**
     * Sample Response
     */
    mockCall: function () {
    }
});
