'use strict';

/**
 * AddressValidationModel.js is a mock representation of an Address Validation service
 * Its functions are exercised by the test suite using test data
 */

var StringUtils = require('dw/util/StringUtils');
var Site = require('dw/system/Site');
var AddressData = require('../tests/data/AddressValidationTestData');

/**
 * Verify Address
 *
 * @param {Object} addressObj - Address Object
 * @param {string} countryCode - Country Code
 * @return {string} - Status
 */
exports.verifyAddress = function (addressObj, countryCode) {
    var status = 'invalid_nomatch';
    var requiredFields = ['address1', 'city', 'state', 'zip'];
    // verify that all required fields is not empty
    for (var field in addressObj) {
        if (requiredFields.indexOf(field) >= 0
                && (addressObj[field] === null
                    || StringUtils.trim(addressObj[field]) === '')) {
            status = 'required_fields_missed';
            return status;
        }
    }

    var siteId = Site.current.ID;
    var addressPool = AddressData[siteId][countryCode];

    // verify that address is valid
    for (var addressType in addressPool) {
        var addressData = addressPool[addressType];
        var valid = true;
        for (var field in addressData) {
            var fieldValue = addressData[field];
            if (addressObj[field] !== fieldValue) {
                valid = false;
                break;
            }
        }

        if (valid) {
            status = addressType;
            break;
        }
    }

    return status;
};
