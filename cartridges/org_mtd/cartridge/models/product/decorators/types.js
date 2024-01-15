'use strict';

module.exports = function (object, apiProduct) {
    var MTDHelper = require('*/cartridge/scripts/util/MTDHelper');
    Object.defineProperty(object, 'isParts', {
        enumerable: true,
        value: MTDHelper.isPartsProduct(apiProduct)
    });
    Object.defineProperty(object, 'isWholeGood', {
        enumerable: true,
        value: MTDHelper.isWholeGoodProduct(apiProduct)
    });
    Object.defineProperty(object, 'isAccessory', {
        enumerable: true,
        value: MTDHelper.isAccessoryProduct(apiProduct)
    });
    Object.defineProperty(object, 'mtdProductType', {
        enumerable: true,
        value: apiProduct.custom['product-type'].value
    });
};
