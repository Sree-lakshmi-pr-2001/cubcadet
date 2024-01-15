'use strict';

/**
 * API modules
 */
var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');

/**
 * Get site preference if prop65 is enabled
 *
 * @return {boolean} - Has enabled
 */
function enabledProp65() {
    return Site.current.getCustomPreferenceValue('prop65Enabled');
}

/**
 * Verify cart on prop65
 *
 * @param {dw.order.Basket} basket - Basket
 * @return {boolean} - Has Prop65 or doesn't have
 */
function verifyCart(basket) {
    var hasProp = false;

    if (!enabledProp65() || !basket) {
        return hasProp;
    }

    var shippingAddress = basket.defaultShipment.shippingAddress;
    var billingAddress = basket.billingAddress;

    // First we need to check if we have US/CA on billing or/and shipping address
    if ((shippingAddress && shippingAddress.countryCode.value.toUpperCase() === 'US' && shippingAddress.stateCode.toUpperCase() === 'CA')
           || (billingAddress && billingAddress.countryCode.value.toUpperCase() === 'US' && billingAddress.stateCode.toUpperCase() === 'CA')) {
        // Go through all cart's products and find if at least one have prop65 warning enabled
        for (var i = 0, length = basket.productLineItems.size(); i < length; i++) {
            var pli = basket.productLineItems[i];
            if (pli.product && 'prop65Warning' in pli.product.custom && pli.product.custom.prop65Warning) {
                hasProp = true;
                break;
            }
        }
    }

    return hasProp;
}

/**
 * Find products in the cart that have prop65 attribute
 *
 * @param {dw.order.Basket} basket - Basket or Order
 * @return {array} - array of product line item UUIDs with prop65 attribute set to true
 */
function findProductLineItemsWithProp65(basket) {
    var prop65Plis = [];

    if (!enabledProp65() || !basket || !basket.defaultShipment) {
        return prop65Plis;
    }

    var shippingAddress = basket.defaultShipment.shippingAddress;
    var billingAddress = basket.billingAddress;

    // First we need to check if we have US/CA on billing or/and shipping address
    if ((shippingAddress && shippingAddress.countryCode
            && shippingAddress.countryCode.value.toUpperCase() === 'US'
            && shippingAddress.stateCode && shippingAddress.stateCode.toUpperCase() === 'CA')
           || (billingAddress && billingAddress.countryCode.value.toUpperCase() === 'US' && billingAddress.stateCode.toUpperCase() === 'CA')) {
        // Go through all cart's products and find if at least one have prop65 warning enabled
        for (var i = 0, length = basket.productLineItems.size(); i < length; i++) {
            var pli = basket.productLineItems[i];
            if (pli.product && 'prop65Warning' in pli.product.custom && pli.product.custom.prop65Warning) {
                prop65Plis.push(pli.UUID);
            }
        }
    }
    return prop65Plis;
}

/**
 * Build Response
 *
 * @param {dw.order.Basket} basket - Basket
 * @return {Object} - Response
 */
function buildResponse(basket) {
    // Verify prop65
    var prop65Show = verifyCart(basket);

    return {
        show: prop65Show,
        acceptUrl: URLUtils.url('Prop65-Accept').toString()
    };
}

module.exports = {
    verifyCart: verifyCart,
    findProductLineItemsWithProp65: findProductLineItemsWithProp65,
    enabledProp65: enabledProp65,
    buildResponse: buildResponse
};
