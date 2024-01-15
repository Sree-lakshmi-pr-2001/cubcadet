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
 * Return item detail
 *
 * @param {dw.order.ProductLineItem} pli - product line item object
 * @param {string} addressId - address ID
 * @returns {Object} - item detail request
 */
function itemDetail(pli, addressId) {
    var basePrice = pli.basePrice;
    var adjustedPrice = pli.adjustedPrice.divide(pli.quantityValue);
    var itemDetailObj = {
        itemShipToAddressID: addressId,
        itemNumber: pli.productID,
        itemQuantity: pli.quantityValue,
        itemSequenceNumber: pli.position,
        itemBasePrice: basePrice.value,
        itemSellingPrice: adjustedPrice.value,
        itemDiscountAmount: basePrice.subtract(adjustedPrice).value,
        itemTotalAmount: pli.adjustedPrice.value,
        itemTaxType: pli.custom['ew-type']
    };

    return itemDetailObj;
}

/**
 * Return special charge
 *
 * @param {number} amount - amount value
 * @param {string} code - code value
 * @returns {Object} - special charge request
 */
function specialCharge(amount, code) {
    var specialChargeObj = {
        specialChargeAmount: amount,
        specialChargeCode: code
    };

    return specialChargeObj;
}

/**
 * Get Tax Request
 *
 * @param {dw.order.Basket} basket - basket object
 * @returns {Object} - return request object
 */
exports.getRequest = function (basket) {
    var shippingAddress = basket.defaultShipment.shippingAddress;
    var request = {
        currencyCode: basket.currencyCode.toUpperCase(),
        itemDetails: [],
        shipToAddress: [{
            addressID: shippingAddress.UUID,
            address1: shippingAddress.address1,
            city: shippingAddress.city,
            countryCode: shippingAddress.countryCode.value.toUpperCase(),
            postalCode: shippingAddress.postalCode,
            stateProvinceCode: shippingAddress.stateCode
        }],
        specialCharges: [],
        systemName: Util.VALUE.TAX_SYSTEM_NAME
    };

    // Add item details
    collections.forEach(basket.allProductLineItems, function (pli) {
        var itemDetailObj = itemDetail(pli, shippingAddress.UUID);
        request.itemDetails.push(itemDetailObj);
    });

    // Add special charges
    // First check if we have an order discount
    var totalExcludingOrderDiscount = basket.getAdjustedMerchandizeTotalPrice(false);
    var totalIncludingOrderDiscount = basket.getAdjustedMerchandizeTotalPrice(true);
    var orderDiscount = totalExcludingOrderDiscount.subtract(totalIncludingOrderDiscount);
    if (orderDiscount.value > 0) {
        var discountCharge = specialCharge(0 - orderDiscount.value, Util.VALUE.ORDER_LEVEL_CHARGE_CODE);
        request.specialCharges.push(discountCharge);
    }
    // Added shipping Amount
    var defaultShipment = basket.defaultShipment;
    var shippingCode = (defaultShipment.shippingMethod && defaultShipment.shippingMethod.custom.specialChargeCode) ?
            defaultShipment.shippingMethod.custom.specialChargeCode : Util.VALUE.SHIPPING_CHARGE_CODE.FRT;
    var shipmentCharge = specialCharge(defaultShipment.adjustedShippingTotalNetPrice.value, shippingCode);
    request.specialCharges.push(shipmentCharge);

    return request;
};
