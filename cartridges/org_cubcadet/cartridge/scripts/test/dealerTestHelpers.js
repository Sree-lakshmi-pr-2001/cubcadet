'use strict';

var ShippingMgr = require('dw/order/ShippingMgr');
var BasketMgr = require('dw/order/BasketMgr');
var StoreMgr = require('dw/catalog/StoreMgr');
var Transaction = require('dw/system/Transaction');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

var DELIVERY = {
    DEALER_PICKUP: 'dealer-pickup',
    DEALER_DELIVERY: 'dealer-delivery',
    HOME: 'standard'
};

var selectedDelivery = DELIVERY.DEALER_DELIVERY;
var selectedDealerID = '101365';

/**
 * Set Delivery
 */
function setDelivery() {
    // Set store for testing
    StoreMgr.setStoreIDToSession(selectedDealerID);

    // Set delivery method for testing
    var currentBasket = BasketMgr.getCurrentBasket();
    var defaultShipment = currentBasket.defaultShipment;

    var allShippingMethods = ShippingMgr.getAllShippingMethods();
    for (var i = 0; i < allShippingMethods.length; i++) {
        var curShipMethod = allShippingMethods[i];
        if (curShipMethod.ID === selectedDelivery) { // dealer-pickup dealer-delivery standard
            Transaction.wrap(function () { // eslint-disable-line
                defaultShipment.setShippingMethod(curShipMethod);
            });
            break;
        }
    }

    COHelpers.recalculateBasket(currentBasket);
}

module.exports = {
    setDelivery: setDelivery
};
