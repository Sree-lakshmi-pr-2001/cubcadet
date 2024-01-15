'use strict';
module.exports = function (object) {
    Object.defineProperty(object, 'productAttributeType', {
        enumerable: true,
        value: object.custom['product-type'].value
    });
};
