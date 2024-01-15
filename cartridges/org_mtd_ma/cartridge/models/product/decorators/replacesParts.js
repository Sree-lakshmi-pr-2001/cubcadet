'use strict';

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'replacesParts', {
        enumerable: true,
        value: apiProduct.custom['replaces-parts']
    });
};
