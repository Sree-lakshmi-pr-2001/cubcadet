'use strict';
/* global session, empty */

var base = module.superModule;

var BasketMgr = require('dw/order/BasketMgr');
var ShippingMgr = require('dw/order/ShippingMgr');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var MTDUtil = require('int_mtdservices/cartridge/scripts/helpers/Util');
var ContentMgr = require('dw/content/ContentMgr');

/**
 * Constants
 */

var DELIVERY = {
    /**
     * Dealer pick up delivery
     */
    DEALER_PICK_UP: 'pickup',

    /**
     * Dealer delivery
     */
    DEALER: 'dealer',

    /**
     * Home delivery
     */
    HOME: 'home'
};

/**
 * Get delivery type
 * @returns {string} delivery type
 */
function getDeliveryType() {
    var type = DELIVERY.HOME;
    var currentBasket = BasketMgr.getCurrentBasket();
    if (currentBasket && currentBasket.defaultShipment && !empty(currentBasket.defaultShipment.shippingMethodID)) {
        var shippingMethodID = currentBasket.defaultShipment.shippingMethodID;
        if (shippingMethodID === MTDUtil.VALUE.DEALER_PICKUP_METHOD) {
            type = DELIVERY.DEALER_PICK_UP;
        } else if (shippingMethodID === MTDUtil.VALUE.DEALER_DELIVERY_METHOD) {
            type = DELIVERY.DEALER;
        }
    }

    return type;
}

/**
 * Get shipping section header
 * @returns {string} shipping section header
 */
function getShippingSectionHeader() {
    var header = '';
    var deliveryType = getDeliveryType();
    if (deliveryType === DELIVERY.DEALER_PICK_UP) {
        header = Resource.msg('heading.checkout.shipping.section.dealerpickup', 'checkout', null);
    } else if (deliveryType === DELIVERY.DEALER) {
        header = Resource.msg('heading.checkout.shipping.section.dealer', 'checkout', null);
    } else if (deliveryType === DELIVERY.HOME) {
        header = Resource.msg('heading.checkout.shipping.section.home', 'checkout', null);
    }

    return header;
}

/**
 * Get shipping section header
 * @returns {string} shipping section header
 */
function getShippingAddressHeader() {
    var header = '';
    var deliveryType = getDeliveryType();
    if (deliveryType === DELIVERY.DEALER) {
        header = Resource.msg('heading.checkout.shipping.address.dealer', 'checkout', null);
    } else if (deliveryType === DELIVERY.HOME) {
        header = Resource.msg('heading.checkout.shipping.address.home', 'checkout', null);
    }

    return header;
}

/**
 * Get shipping section header
 * @returns {string} shipping section header
 */
function getShippingDealerHeader() {
    var header = '';
    var deliveryType = getDeliveryType();
    if (deliveryType === DELIVERY.DEALER) {
        header = Resource.msg('heading.checkout.shipping.dealerdelivery', 'checkout', null);
    } else if (deliveryType === DELIVERY.DEALER_PICK_UP) {
        header = Resource.msg('heading.checkout.shipping.dealerpickup', 'checkout', null);
    }

    return header;
}

/**
 *  Update Dealer custom attributes
 * @param {dw.order.LineItemCtnr} lineItemCtnr - lineItemCtnr
 * @param {string} dealerId - dealerId
 * @param {string} erpShipToNumber - erpShipToNumber
 * */
function updateDealerCustomAttributes(lineItemCtnr, dealerId, erpShipToNumber) {
    Transaction.wrap(function () {
        lineItemCtnr.custom.dealer_id = dealerId; // eslint-disable-line
        lineItemCtnr.custom.erp_shipto = erpShipToNumber; // eslint-disable-line
    });
}

/**
 * Set Default Shipping Method
 */
function setDefaultShippingMethod() {
    var currentBasket = BasketMgr.getCurrentBasket();
    var defaultShipment = currentBasket.defaultShipment;

    var allShippingMethods = ShippingMgr.getAllShippingMethods();
    for (var i = 0; i < allShippingMethods.length; i++) {
        var curShipMethod = allShippingMethods[i];
        if (curShipMethod.defaultMethod) {
            Transaction.wrap(function () { // eslint-disable-line
                defaultShipment.setShippingMethod(curShipMethod);
            });
            break;
        }
    }

    base.recalculateBasket(currentBasket);
}

/**
 * Validate zipcode for dealer delivery shipping method
 * @param {Object} shippingAddressFields - shippingAddressFields
 * @returns {Object} result
 */
function validateShippingDeliveryZipcode(shippingAddressFields) {
    var result = {};
    var currentBasket = BasketMgr.getCurrentBasket();
    if (currentBasket) {
        var shipment = currentBasket.defaultShipment;
        if (shipment && shipment.shippingMethodID === 'dealer-delivery') {
            var dealerId = shipment.custom.dealerID;
            var StoreMgr = require('dw/catalog/StoreMgr');
            var dealer = StoreMgr.getStore(dealerId);
            var Helper = require('org_mtd_ma/cartridge/scripts/utils/ButtonStateHelper');
            var postalCode = shippingAddressFields.postalCode.value;
            var isDeliveryInRange = Helper.isDeliveryInRange(dealer, postalCode);
            if (!isDeliveryInRange) {
                var errorFieldZipcodeAsset = ContentMgr.getContent('zipcode-field-range-error-message');
                var errorFieldZipcodeAssetMessage = (errorFieldZipcodeAsset) ? errorFieldZipcodeAsset.custom.body.markup : '';
                result[shippingAddressFields.postalCode.htmlName] = errorFieldZipcodeAssetMessage;
            }
        }
    }

    return result;
}

base.DELIVERY = DELIVERY;
base.getDeliveryType = getDeliveryType;
base.getShippingSectionHeader = getShippingSectionHeader;
base.getShippingAddressHeader = getShippingAddressHeader;
base.getShippingDealerHeader = getShippingDealerHeader;
base.updateDealerCustomAttributes = updateDealerCustomAttributes;
base.setDefaultShippingMethod = setDefaultShippingMethod;
base.validateShippingDeliveryZipcode = validateShippingDeliveryZipcode;

module.exports = base;
