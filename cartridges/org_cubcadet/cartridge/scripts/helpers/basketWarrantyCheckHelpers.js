'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var StoreMgr = require('dw/catalog/StoreMgr');

/**
 * checking if there any extended warranty in the basket
 * @param {dw.order.Basket} basket - The current user's basket
 * @returns {boolean} true if there any extended warranty or false if not
 */
function checkWarranty(basket) {
    var productLineItems = basket.productLineItems;
    var result = false;

    collections.forEach(productLineItems, function (item) {
        if (item.custom['product-type'] === 'ExtendedWarranty' && item.custom['ew-existing-registration'] !== true) {
            result = true;
        }
    });

    return result;
}


module.exports = {
    checkWarranty: checkWarranty
};
