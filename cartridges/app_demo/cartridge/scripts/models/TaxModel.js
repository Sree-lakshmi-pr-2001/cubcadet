'use strict';

var TaxData = require('../tests/data/TaxTestData');
var TaxRatesData = require('../tests/data/TaxRatesData');

/**
 * Calculate Tax
 *
 * @param {Object} addressObj - Address Object
 * @param {string} countryCode - Country Code
 * @param {array} products - Product Collection Object
 * @param {Object} shipping - Shipping Object
 * @return {Object} - Result data
 */
exports.calculate = function (addressObj, countryCode, products, shipping) {
    var addressPool = TaxData.address[countryCode];

    var result = {
        addressStatus: 'invalid',
        products: [],
        shipping: {}
    };
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
            result.addressStatus = addressType;
            break;
        }
    }

    if (result.addressStatus === 'invalid') {
        return result;
    }

    var countryRates = TaxRatesData.rates[countryCode];

    // Calculate product tax
    for (var product in products) {
        var taxClassId = product.taxClass;
        var rate = (taxClassId in countryRates) ? countryRates[taxClassId] : 0;
        var taxAmount = product.amount * rate;
        result.products.push({
            id: product.id,
            qty: product.qty,
            amount: product.amount,
            taxAmount: taxAmount,
            taxClass: taxClassId,
            rate: rate
        });
    }

    // Calculate shipping tax
    var shippingTaxClassId = shipping.taxClass;
    var shippingRate = (taxClassId in countryRates) ? countryRates[shippingTaxClassId] : 0;
    var shippingTaxAmount = shipping.amount * shippingRate;
    result.shipping = {
        shipping: shipping.amount,
        taxAmount: shippingTaxAmount,
        taxClass: shippingTaxClassId,
        rate: shippingRate
    };

    return result;
};
