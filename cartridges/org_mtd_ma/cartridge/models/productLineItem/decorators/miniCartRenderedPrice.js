'use strict';

var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var formatMoney = require('dw/util/StringUtils').formatMoney;
var Money = require('dw/value/Money');

/**
 * Creates the tempalte used when updating the quantity and price of minicart line items
 * @param {Object} object - the product object being used to create the model
 * @returns {string} result - rendered isml template
 */
function getMiniCartRenderedPriceTemplate(object) {
    var miniCartContext;
    var result = {};
    var miniCartTemplate = 'checkout/productCard/productCardMiniCartProductRenderedTotalPrice';
    var totalListPrice;
    var totalSalesPrice;
    var formattedSales;
    var formattedList;

    if (object.price.list && object.price.list.decimalPrice) {
        totalListPrice = object.price.list.decimalPrice * object.quantity;
        formattedList = formatMoney(new Money(totalListPrice, object.price.list.currency));
    }

    if (object.price.sales && object.price.sales.decimalPrice) {
        totalSalesPrice = object.price.sales.decimalPrice * object.quantity;
        formattedSales = formatMoney(new Money(totalSalesPrice, object.price.sales.currency));
    }

    miniCartContext = {
        lineItem: {
            price: object.price,
            quantity: object.quantity,
            totalList: totalListPrice,
            totalSales: totalSalesPrice,
            formattedList: formattedList,
            formattedSales: formattedSales
        }
    };

    result = renderTemplateHelper.getRenderedHtml(miniCartContext, miniCartTemplate);

    return result;
}

module.exports = function (object) {
    Object.defineProperty(object, 'miniCartRenderedPrice', {
        enumerable: true,
        value: getMiniCartRenderedPriceTemplate(object)
    });
};
