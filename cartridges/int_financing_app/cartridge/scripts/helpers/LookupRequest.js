/* global session */
'use strict';

/**
 * API dependencies
 */
var Calendar = require('dw/util/Calendar');

/**
 * Include Modules
 */
var Util = require('~/cartridge/scripts/helpers/Util');

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

    // Set lookup request
    var lookupRequest = webReference.CustCareT1GetRequest(); // eslint-disable-line new-cap
    lookupRequest.setSSN4(data.ssn);
    lookupRequest.setPostalCode5(data.postalCode);
    var dob = new Date(Number(data.dateOfBirth.year), Number(data.dateOfBirth.month) - 1, Number(data.dateOfBirth.day));
    lookupRequest.setDateOfBirth(new Calendar(dob));
    lookupRequest.setExternalIPAddress(Util.getUserIp());

    var requests = webReference.ArrayOfCustCareT1GetRequest(); // eslint-disable-line new-cap
    requests.custCareT1GetRequests.add(lookupRequest);

    return {
        validation: validation,
        requests: requests
    };
};

/**
 * Prepare Data
 * @param {string} ssn - last 4 digits of SSN
 * @param {string} postalCode - postal code
 * @param {string} year - year of birth
 * @param {string} month - month of birth
 * @param {string} day - day of birth
 * @returns {Object} - data
 */
exports.prepareData = function (ssn, postalCode, year, month, day) {
    return {
        ssn: ssn,
        postalCode: postalCode,
        dateOfBirth: {
            year: year,
            month: month,
            day: day
        }
    };
};

