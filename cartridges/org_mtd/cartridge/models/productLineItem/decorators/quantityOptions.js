'use strict';

var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var Site = require('dw/system/Site');

/**
 * get the min and max numbers to display in the quantity drop down.
 * @param {Object} productLineItem - a line item of the basket.
 * @param {number} quantity - number of items for this product
 * @returns {Object} The minOrderQuantity and maxOrderQuantity to display in the quantity drop down.
 */
function getMinMaxQuantityOptions(productLineItem, quantity) {
    var availableToSell = productLineItem.product.availabilityModel.inventoryRecord.ATS.value;
    var isPerpetual = productLineItem.product.availabilityModel.inventoryRecord.perpetual;
    if (productLineItem.productInventoryListID) {
        var inventoryList = ProductInventoryMgr.getInventoryList(productLineItem.productInventoryListID);
        var inventoryRecord = inventoryList.getRecord(productLineItem.product.ID);
        availableToSell = inventoryRecord.ATS.value;
        isPerpetual = inventoryRecord.perpetual;
    }
    var maxOrderQty = Site.current.getCustomPreferenceValue('maxOrderQty');
    var max = isPerpetual ? maxOrderQty : Math.max(Math.min(availableToSell, maxOrderQty), quantity);

    return {
        minOrderQuantity: productLineItem.product.minOrderQuantity.value || 1,
        maxOrderQuantity: max
    };
}

module.exports = function (object, productLineItem, quantity) {
    Object.defineProperty(object, 'quantityOptions', {
        enumerable: true,
        value: getMinMaxQuantityOptions(productLineItem, quantity)
    });
};
