'use strict';

module.exports = function (object) {
    Object.defineProperty(object, 'extendedName', {
        enumerable: true,
        value: object.custom.productName2
    });
};
