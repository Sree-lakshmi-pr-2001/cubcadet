'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
// var StoreMgr = require('dw/catalog/StoreMgr');

/**
 * validates that the product line items exist, are online, and have available inventory.
 * @param {dw.order.Basket} basket - The current user's basket
 * @returns {Object} an error object
 */
function validateProducts(basket) {
    var result = {
        error: false,
        hasInventory: true
    };

    // var dealerId = StoreMgr.getStoreIDFromSession();
    // var dealer = StoreMgr.getStore(dealerId);
    // if (!dealer) {
    //     result.error = true;
    //     return result;
    // }

    var productLineItems = basket.productLineItems;
    var ZTRInCart ='';
    collections.forEach(productLineItems, function (item) {
        if (item.product === null || !item.product.online) {
            result.error = true;
            return;
        }

        // inventory should be always set in cartHelpers in addTocart
        var itemInventory = item.getProductInventoryList();
        // var Logger = require('dw/system/Logger');
        // Logger.error('item: {0}, inventoryId: {1}', item.productID, itemInventory.ID);
        if (itemInventory) {
            result.hasInventory = result.hasInventory
                && (itemInventory.getRecord(item.productID)
                && itemInventory.getRecord(item.productID).ATS.value >= item.quantityValue);
        } else {
            result.error = true;
            return;
        }
        var first2Char =  item.productID.slice(0, 2);
        var checkProductAlreadyExists = ZTRInCart.indexOf(item.productID);

       if(first2Char === '17'){
            if (checkProductAlreadyExists)  {
                ZTRInCart = item.productID +  '||' + ZTRInCart;             
            }
        }
    });
    ZTRInCart =  ZTRInCart.substring(0, ZTRInCart.length - 2);
    session.custom.ZTRInCart =ZTRInCart;

    return result;
}

/**
 * Validates coupons
 * @param {dw.order.Basket} basket - The current user's basket
 * @returns {Object} an error object
 */
function validateCoupons(basket) {
    var invalidCouponLineItem = collections.find(basket.couponLineItems, function (couponLineItem) {
        return !couponLineItem.valid;
    });

    return {
        error: !!invalidCouponLineItem
    };
}

module.exports = {
    validateProducts: validateProducts,
    validateCoupons: validateCoupons,
    validateShipments: COHelpers.ensureValidShipments
};
