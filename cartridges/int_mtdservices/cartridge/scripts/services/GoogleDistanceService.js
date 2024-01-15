'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var SecureEncoder = require('dw/util/SecureEncoder');

var googleDistanceServiceUtil = require('*/cartridge/scripts/services/GoogleDistanceServiceUtil');

exports.GoogleDistanceService = LocalServiceRegistry.createService('google.distance.api', {
    /**
     * Create Request
     *
     * @param {dw.svc.HTTPService} svc - HTTPService object
     * @param {Object} args - arguments
     * @returns {null} - result
     */
    createRequest: function (svc, args) {
        svc.addHeader('Content-Type', 'application/json');
        svc.setRequestMethod('GET');

        // Set URL with authentication params
        var url = svc.configuration.credential.URL;
        url += '?units=' + SecureEncoder.forUriComponent(googleDistanceServiceUtil.getUnits());
        url += '&origins=' + SecureEncoder.forUriComponent(googleDistanceServiceUtil.getFormattedOrigin(args.request.origins));
        url += '&destinations=' + SecureEncoder.forUriComponent(googleDistanceServiceUtil.getFormattedDestinations(args.request.destinations));
        url += '&key=' + SecureEncoder.forUriComponent(googleDistanceServiceUtil.getKey());
        svc.setURL(url);

        return null;
    },
    /**
     * Parse Response
     *
     * @param {dw.svc.HTTPService} svc - SVC object
     * @param {dw.net.HTTPClient} client - client response
     * @returns {Object} - response object
     */
    parseResponse: function (svc, client) {
        return JSON.parse(client.text);
    },
    /**
     * Get Request Log Message
     *
     * @param {Object} request - request
     * @returns {Object} - request object to log
     */
    getRequestLogMessage: function (request) {
        return request;
    },
    /**
     * Get Response Log Message
     *
     * @param {Object} response - response object
     * @returns {string} result to log
     */
    getResponseLogMessage: function (response) {
        return JSON.stringify(JSON.parse(response.text));
    },
    /**
     * Sample Response
     * @returns {Object} - mock call
     */
    mockCall: function () {
        return googleDistanceServiceUtil.getMockCall();
    }
});
