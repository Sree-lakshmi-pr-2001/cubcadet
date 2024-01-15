/* global webreferences2 webreferences */
'use strict';

var Site = require('dw/system/Site');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var GetAccessTokenRequest = require('~/cartridge/scripts/helpers/GetAccessTokenRequest');
var LookupRequest = require('~/cartridge/scripts/helpers/LookupRequest');
var SalesRequest = require('~/cartridge/scripts/helpers/SalesRequest');
var VoidRequest = require('~/cartridge/scripts/helpers/VoidRequest');

var brokerServiceName = Site.current.getCustomPreferenceValue('tdBankBrokerServiceName');
var transactionServiceName = Site.current.getCustomPreferenceValue('tdTransactionServiceName');
var cardholderServiceName = Site.current.getCustomPreferenceValue('tdCardholderServiceName');
var Logger = require('dw/system/Logger');

/**
 * Create json from XML
 *
 * @param {Object} xml XML input
 * @param {Object} json JSON output
 */
function soapElementLogging(xml, json) {
    for (var element in xml) { // eslint-disable-line no-restricted-syntax
        if (Object.prototype.hasOwnProperty.call(xml, element)) {
            if (typeof xml[element] !== 'function') {
                if (!xml[element]) {
                    json[element] = null; // eslint-disable-line no-param-reassign
                } else {
                    var typeOfElement = typeof xml[element];
                    if (typeOfElement === 'object') {
                        json[element] = {}; // eslint-disable-line no-param-reassign
                        soapElementLogging(xml[element], json[element]);
                    } else {
                        var elementValue = String(xml[element]);
                        if (element === 'userID' || element === 'password') {
                            elementValue = '****';
                        } else if (element === 'accountNumber') {
                            elementValue = '****' + elementValue.substr(elementValue.length - 4);
                        }
                        json[element] = elementValue; // eslint-disable-line no-param-reassign
                    }
                }
            }
        }
    }
}


/**
 * Get Request Log Message
 * @param {Object} request - request object
 * @returns {Object} request object
 */
function getRequestLogMessage(request) {
    var Logger = require('dw/system/Logger');
    var TDLogger = Logger.getLogger('TD_Transaction', 'TD_Transaction');
    var json = {};
    soapElementLogging(request, json);
    Logger.error('Request:' + JSON.stringify(json));
    TDLogger.error('Transaction service request object : ' + JSON.stringify(json))
    return JSON.stringify(json);
}

/**
 * Get Response Log Message
 * @param {Object} response - response object
 * @returns {Object} response
 */
function getResponseLogMessage(response) {
    var Logger = require('dw/system/Logger');
    var TDLogger = Logger.getLogger('TD_Transaction', 'TD_Transaction');
    var json = {};
    soapElementLogging(response, json);
    Logger.error('Request:' + JSON.stringify(json));
    TDLogger.error('Transaction service response object : ' + JSON.stringify(json))
    return JSON.stringify(json);
}

exports.BrokerService = function(prequal){ 
    
    var getUrl = LocalServiceRegistry.createService(brokerServiceName, {
    /**
     * Initiate Service Client
     * @param {dw.svc.SOAPService} svc - SOAP service
     * @returns {Object} - default service
     */
    initServiceClient: function () {
        this.webReference = webreferences2.BrokerService;
        return this.webReference.getDefaultService();
    },
    /**
     * Create Request
     *
     * @param {dw.svc.SOAPService} svc - SOAP service
     * @returns {string|null} - result
     */
    createRequest: function (svc) {
        var requestObject = GetAccessTokenRequest.getRequest(this.webReference, svc.configuration.credential, prequal);
        return requestObject;
    },
    /**
     * Execute
     * @param {dw.svc.SOAPService} svc - SOAP service
     * @param {Object} requestObject - request object
     * @returns {Object} - result
     */
    execute: function (svc, requestObject) {
        var executeResult = svc.serviceClient.getAccessToken(
            requestObject.validation,
            requestObject.accessTokenRequests,
            requestObject.returnUrls
        ); // eslint-disable-line new-cap

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
    getRequestLogMessage: getRequestLogMessage,
    /**
     * Get Response Log Message
     * @param {Object} response - response object
     * @returns {Object} response
     */
    getResponseLogMessage: getResponseLogMessage,
    /**
     * Sample Response
     */
    mockCall: function () {
    }
});
return getUrl.call();

}

exports.TransactionService = LocalServiceRegistry.createService(transactionServiceName, {
    /**
     * Initiate Service Client
     * @param {dw.svc.SOAPService} svc - SOAP service
     * @returns {Object} - default service
     */
    initServiceClient: function () {
        this.webReference = webreferences2.TransactionWS5;
        return this.webReference.getDefaultService();
    },
    /**
     * Create Request
     *
     * @param {dw.svc.SOAPService} svc - SOAP service
     * @param {Object} args - request arguments
     * @returns {Object} - result
     */
    createRequest: function (svc, args) {
        var requestObject;
        if (args.type === 'Sale') {
            requestObject = SalesRequest.getRequest(this.webReference, svc.configuration.credential, args.data);
        } else if (args.type === 'Void') {
            requestObject = VoidRequest.getRequest(this.webReference, svc.configuration.credential, args.data);
        }
        return {
            xml: requestObject,
            type: args.type
        };
    },
    /**
     * Execute
     * @param {dw.svc.SOAPService} svc - SOAP service
     * @param {Object} requestObject - request object
     * @returns {Object} - result
     */
    execute: function (svc, requestObject) {
        var executeResult;
        if (requestObject.type === 'Sale') {
            executeResult = svc.serviceClient.salePost(requestObject.xml.validation, requestObject.xml.requests); // eslint-disable-line new-cap
        } else if (requestObject.type === 'Void') {
            executeResult = svc.serviceClient.voidPost(requestObject.xml.validation, requestObject.xml.requests); // eslint-disable-line new-cap
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
    getRequestLogMessage: getRequestLogMessage,
    /**
     * Get Response Log Message
     * @param {Object} response - response object
     * @returns {Object} response
     */
    getResponseLogMessage: getResponseLogMessage,
    /**
     * Sample Response
     */
    mockCall: function () {
    }
});

exports.CardholderService = LocalServiceRegistry.createService(cardholderServiceName, {
    /**
     * Initiate Service Client
     * @param {dw.svc.SOAPService} svc - SOAP service
     * @returns {Object} - default service
     */
    initServiceClient: function () {
        this.webReference = webreferences2.CardholderWS4;
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
        var requestObject = LookupRequest.getRequest(this.webReference, svc.configuration.credential, args);
        return requestObject;
    },
    /**
     * Execute
     * @param {dw.svc.SOAPService} svc - SOAP service
     * @param {Object} requestObject - request object
     * @returns {Object} - result
     */
    execute: function (svc, requestObject) {
        var executeResult = svc.serviceClient.custCareT1Get(
            requestObject.validation,
            requestObject.requests
        ); // eslint-disable-line new-cap

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
    getRequestLogMessage: getRequestLogMessage,
    /**
     * Get Response Log Message
     * @param {Object} response - response object
     * @returns {Object} response
     */
    getResponseLogMessage: getResponseLogMessage,
    /**
     * Sample Response
     */
    mockCall: function () {
    }
});
