/* global session empty dw */
'use strict';

/**
 * API dependencies
 */
var MessageDigest = require('dw/crypto/MessageDigest');
var Bytes = require('dw/util/Bytes');
var Encoding = require('dw/crypto/Encoding');

/**
 * Include Modules
 */
var Util = require('~/cartridge/scripts/helpers/Util');
var collections = require('*/cartridge/scripts/util/collections');

/**
 * Check if we can skip tax request
 *
 * @param {dw.order.Basket} basket - basket object
 * @returns {boolean} - return boolean flag
 */
exports.skipTaxCalculation = function (basket) {
    var skipTax = false;
    var cartStateString = '';
    try {
        /**
         * Update basket totals first
         */
        basket.updateTotals();

        /**
         * proceed products
         */
        var productLineItems = basket.getAllProductLineItems().iterator();
        while (productLineItems.hasNext()) {
            var productLineItem = productLineItems.next();
            cartStateString += productLineItem.productID + ';' + productLineItem.quantityValue + ';' + productLineItem.adjustedPrice + '|';
        }

        /**
         * proceed gift cards
         */
        var gifts = basket.getGiftCertificateLineItems().iterator();
        while (gifts.hasNext()) {
            var giftLineItem = gifts.next();
            cartStateString += giftLineItem.giftCertificateID + ';' + giftLineItem.priceValue + '|';
        }

        /**
         * Append shipping totals and basket totals to string (adjustedMerchandizeTotalPrice includes order level price adjustments).
         * Basket Net total checked as catch all for both taxation policies not including taxes.
         */

        cartStateString += basket.adjustedShippingTotalPrice.valueOrNull + '|' + basket.adjustedMerchandizeTotalPrice.valueOrNull + '|' + basket.totalNetPrice.valueOrNull;
        if (!empty(basket.defaultShipment) && !empty(basket.defaultShipment.shippingAddress)) {
            var shipAddr = basket.defaultShipment.shippingAddress;

            cartStateString += '|' + (!empty(shipAddr.stateCode) ? shipAddr.stateCode : null);
            cartStateString += '|' + (!empty(shipAddr.city) ? shipAddr.city : null);
            cartStateString += '|' + (!empty(shipAddr.countryCode) ? shipAddr.countryCode.displayValue : null);
            cartStateString += '|' + (!empty(shipAddr.postalCode) ? shipAddr.postalCode : null) + '|';
        }

        /**
         * coupon codes
         */
        if (basket.couponLineItems.size() > 0) {
            collections.forEach(basket.couponLineItems, function (coupon) {
                cartStateString += '|' + coupon.couponCode;
            });
        }

        /**
         * due to DW quota limit on string length which can be stored in session we should used MD5 hash instead raw string
         */
        var hash = new MessageDigest(MessageDigest.DIGEST_SHA_256).digestBytes(new Bytes(cartStateString)); // eslint-disable-line new-cap
        cartStateString = Encoding.toHex(hash); // eslint-disable-line new-cap

        /**
         * previously saved card state is equal current basket state - so we would skip tax call
         */
        if ('cartStateString' in session.custom && !empty(session.custom.cartStateString)) {
            if (cartStateString === session.custom.cartStateString) {
                skipTax = true;
            } else {
                skipTax = false;
            }
        } else {
            skipTax = false;
        }

        session.custom.cartStateString = cartStateString;
    } catch (e) {
        Util.log.error('{0}: {1}', e, e.stack);
    }

    return skipTax;
};
