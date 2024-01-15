'use strict';
var base = module.superModule;
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');
var URLUtils = require('dw/web/URLUtils');

/**
 * creates a url of the product's selected attributes
 * @param {dw.catalog.ProductVariationModel} variationModel - The product's variation model
 * @param {dw.catalog.ProductOptionModel} optionModel - The product's option model
 * @param {string} id - the current product's id
 * @returns {string} a url of the product's selected attributes
 */
function getQtyUrl(variationModel, optionModel, id) {
    var params = [];
    var action = 'Product-Variation';
    var optionsQueryParams = productHelper.getSelectedOptionsUrl(optionModel).split('?')[1];
    var url = variationModel ? variationModel.url(action) : URLUtils.url(action, 'pid', id);

    if (optionsQueryParams) {
        optionsQueryParams.split('&').forEach(function (keyValue) {
            params.push(keyValue);
        });
    }

    return urlHelper.appendQueryParams(url.relative().toString(), params);
}

module.exports = function (object, variationModel, optionModel, endPoint, id, quantity) {
    base.call(this, object, variationModel, optionModel, endPoint, id, quantity);
    Object.defineProperty(object, 'qtyUrl', {
        enumerable: true,
        value: getQtyUrl(variationModel, optionModel, id)
    });
};
