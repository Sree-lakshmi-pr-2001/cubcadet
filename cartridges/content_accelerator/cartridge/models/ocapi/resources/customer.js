'use strict';

/** Model Imports */
var OcapiShopModel = require('*/cartridge/models/ocapi/shop');

/**
 * @function
 * @desc Setup the customer model and extend it with the shop model
 * @param {string} customerId - ID of the customer to be used when accessing the API (optional)
 */
function OcapiCustomerModel(customerId) {
    this.customerId = customerId || '';
}

OcapiCustomerModel.prototype = new OcapiShopModel();

/**
 * @function
 * @desc Retrieves the resource location for this API model
 * @returns {string} - Resource location URI
 */
OcapiCustomerModel.prototype.getResourceLocation = function () {
    // apiLocation and version come from the parent class
    return this.apiLocation + this.version + '/customers';
};

/**
 * @function
 * @desc Returns a JSON Web Token used to authorize OCAPI requests on the client site
 * @return {string} - Authorization token used to make API calls
 */
OcapiCustomerModel.prototype.getJsonWebToken = function () {
    var Bytes = require('dw/util/Bytes');
    var OcapiService = require('*/cartridge/scripts/service/OcapiService');
    var login = '';
    var password = '';
    var encoding = require('dw/crypto/Encoding');
    var resourceLocation = this.getResourceLocation();
    var authorization = encoding.toBase64(new Bytes(login + ':' + password));
    var request = {
        requestMethod: 'POST',
        path: resourceLocation + '/auth',
        data: {
            type: 'credentials'
        },
        headers: {
            Authorization: 'Basic ' + authorization
        }
    };

    var serviceResponse = OcapiService.call(request);

    if (serviceResponse.ok) {
        return OcapiService.client.responseHeaders.Authorization[0];
    }

    return serviceResponse.status;
};

/**
 * @function
 * @desc Returns an Oauth2 Token used to authorize OCAPI requests in the business manager
 * @return {string} - Authorization token used to make API calls
 */
OcapiCustomerModel.prototype.getOauthToken = function () {
    var OauthService = require('*/cartridge/scripts/service/OauthService');
    var Bytes = require('dw/util/Bytes');
    var ocapiSvc = require('dw/svc/ServiceRegistry').get('dw.oauth2');
    var login = ocapiSvc.configuration.credential.user ? ocapiSvc.configuration.credential.user : 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    var password = ocapiSvc.configuration.credential.password ? ocapiSvc.configuration.credential.password : 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    var encoding = require('dw/crypto/Encoding');
    var authorization = encoding.toBase64(new Bytes(login + ':' + password));
    var request = {
        requestMethod: 'POST',
        headers: {
            Authorization: 'Basic ' + authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    OauthService.addParam('grant_type', 'client_credentials');
    var serviceResponse = OauthService.call(request);

    if (serviceResponse.ok) {
        return serviceResponse.object.token_type + ' ' + serviceResponse.object.access_token;
    }

    return serviceResponse.status;
};

module.exports = OcapiCustomerModel;
