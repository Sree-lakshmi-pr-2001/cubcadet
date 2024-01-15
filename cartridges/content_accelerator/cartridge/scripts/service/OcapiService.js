'use strict';

/**
 * Ocapi Service
 *
 * This file acts as a wrapper for Ocapi Service calls
 */
/* API Modules */
var dwsvc = require('dw/svc');

/* Script Modules */
var OcapiModel = require('*/cartridge/models/ocapi/ocapi');

/* Constants */
var serviceName = OcapiModel.serviceId;

/**
 *
 * HTTP Services
 *
 */
var serviceConfig = {
    /**
     * Creates the OCAPI service request
     * @param {dw.svc.Service} service - service definition
     * @param {Object} requestDataContainer - extended information for the service
     * @returns {string} - JSON string from parsed request data
     */
    createRequest: function (service, requestDataContainer) {
        var requestMethod = requestDataContainer.requestMethod;
        var requestParams = requestDataContainer.params;
        var requestExpands = requestDataContainer.expands;
        var requestHeaders = requestDataContainer.headers;
        var requestData = requestDataContainer.data;
        var selfService = service;

        selfService.URL = service.configuration.credential.URL + (requestDataContainer.path || '');
        selfService.requestMethod = requestMethod || 'GET';

        if (requestParams) {
            Object.keys(requestParams).forEach(function (paramName) {
                selfService.addParam(paramName, requestParams[paramName]);
            });
        }

        if (requestExpands) {
            requestExpands.forEach(function (expandElement) {
                selfService.addParam('expand', expandElement);
            });
        }

        if (requestHeaders) {
            Object.keys(requestHeaders).forEach(function (headerName) {
                selfService.addHeader(headerName, requestHeaders[headerName]);
            });
        }

        selfService.addParam('client_id', selfService.getConfiguration().getCredential().user);

        if (requestData) {
            return JSON.stringify(requestData);
        }

        return JSON.stringify({ success: false });
    },

    parseResponse: function (service, response) {
        var responseObject = {};
        if (response.statusCode === 200 || response.statusCode === 201) {
            responseObject = JSON.parse(response.text);
        } else {
            throw new Error('Ocapi Service Errored with Status Code: ' + service.statusCode);
        }

        return responseObject;
    }
};

module.exports = dwsvc.LocalServiceRegistry.createService(serviceName, serviceConfig);
