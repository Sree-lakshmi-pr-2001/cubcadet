'use strict';
/* global empty */

/**
 * Get ktt Data
 * @param {dw.order.Order} order - The Order
 * @returns {Object} - return result object
*/
function getKttData(order) {
    var productLineItems = order.getProductLineItems();
    var defaultShipment = order.getDefaultShipment();
    var shippingMethod = defaultShipment.getShippingMethod();
    var kttDataString = 'USHIPPING_METHOD=' + shippingMethod.ID + '&|';
    var result = {
        dataString: '',
        dataLength: ''
    };
    if (!empty(productLineItems)) {
        for (var x = 0; x < productLineItems.length; x++) {
            var stringPLI = '';
            var pli = productLineItems[x];
            var product = pli.product;
            var productName = product.name.replace(/[^0-9a-z ]/gi, '');
            var rawPrice = pli.getAdjustedPrice().value.toFixed(2);
            var price = rawPrice.replace(/[^0-9a-z ]/gi, '');

            stringPLI =
            'T=' + product.custom['product-type'] + '&' +
            'I=' + product.manufacturerSKU + '&' +
            'D=' + productName + '&' +
            'Q=' + pli.getQuantity() + '&' +
            'P=' + price + '&|';

            if (kttDataString.length + stringPLI.length < 999) {
                kttDataString += stringPLI;
            }
        }
        result.dataString = kttDataString;
        result.dataLength = kttDataString.length;
    }
    return result;
}

module.exports = {
    getKttData: getKttData
};
