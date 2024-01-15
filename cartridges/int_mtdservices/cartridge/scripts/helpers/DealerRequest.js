/* global session */
'use strict';

/**
 * API dependencies
 */

/**
 * Include Modules
 */
var Util = require('~/cartridge/scripts/helpers/Util');
var collections = require('*/cartridge/scripts/util/collections');

/**
 * Get Dealer Fulfillment Request
 *
 * @param {dw.order.Basket} basket - basket object
 * @param {string} countryCode - country code
 * @param {string} zipCode - zip/postal code
 * @returns {Object} - return request object
 */
exports.getFulfillmentRequest = function (basket, countryCode, zipCode) {
    var request = {
        availabilityRequest: {
            consumerProximityToLocation: Util.VALUE.DEALER_CONSUMER_PROXIMITY,
            numberOfDealersAllowed: Util.VALUE.DEALER_NUMBER_ALLOWED,
            orderLineItems: [],
            originCountryCode: countryCode,
            originPostalCode: zipCode,
            retailerBrand: Util.VALUE.DEALER_RETAILER_BRAND,
            totalPrice: basket.merchandizeTotalNetPrice.value
        }
    };

    // Add item details
    collections.forEach(basket.allProductLineItems, function (pli) {
        if (!pli.optionProductLineItem) {
            var itemDetailObj = {
                itemNumber: pli.productID,
                itemPrice: pli.netPrice.divide(pli.quantityValue).value,
                model: pli.productID,
                quantity: pli.quantityValue
            };
            request.availabilityRequest.orderLineItems.push(itemDetailObj);
        }
    });

    return request;
};
