'use strict';

var formatMoney = require('dw/util/StringUtils').formatMoney;

/**
 * Convert API price to an object
 * @param {dw.value.Money} price - Price object returned from the API
 * @returns {Object} price formatted as a simple object
 */
function toPriceModel(price) {
    var value = price.available ? price.getDecimalValue().get() : null;
    var currency = price.available ? price.getCurrencyCode() : null;
    var formattedPrice = price.available ? formatMoney(price) : null;
    var decimalPrice;

    if (formattedPrice) { decimalPrice = price.getDecimalValue().toString(); }

    return {
        value: value,
        currency: currency,
        formatted: formattedPrice,
        decimalPrice: decimalPrice
    };
}

/**
 * Get no price content asset
 *
 * @returns {string} - HTML of content asset
 */
function getNoPriceContent() {
    var ContentMgr = require('dw/content/ContentMgr');
    var noPriceContentAsset = ContentMgr.getContent('no-price-available');
    var html = '';
    if (noPriceContentAsset && noPriceContentAsset.online) {
        html = noPriceContentAsset.custom.body.markup;
    }

    return html;
}

/**
 * @constructor
 * @classdesc Default price class
 * @param {dw.value.Money} salesPrice - Sales price
 * @param {dw.value.Money} listPrice - List price
 */
function DefaultPrice(salesPrice, listPrice) {
    this.sales = toPriceModel(salesPrice);
    if (!this.sales.value) {
        this.sales.noPriceContent = getNoPriceContent();
    }
    this.list = listPrice ? toPriceModel(listPrice) : null;
}

module.exports = DefaultPrice;
