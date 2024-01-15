'use strict';

/* API Modules */
var Logger = require('dw/system/Logger');

var OcapiModel = {
    /**
     * ID of the OCAPI service
     */
    serviceId: 'dw.ocapi',

    /**
     * @name getLogger
     * @desc returns the logger
     * @param {string} method method for accessing the model
     * @returns {Logger} returns a logger with the file name and method
     */
    getLogger: function (method) {
        var categoryName = method !== null ? method : 'Ocapi_General';
        var fileName = 'Ocapi';

        return Logger.getLogger(fileName, categoryName);
    }
};

module.exports = OcapiModel;
