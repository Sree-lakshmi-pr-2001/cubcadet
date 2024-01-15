'use strict';

module.exports = function (object, apiProduct, type) {
    Object.defineProperty(object, 'id', {
        enumerable: true,
        value: apiProduct.ID
    });

    Object.defineProperty(object, 'masterId', {
        enumerable: true,
        value: apiProduct.isVariant() ? apiProduct.getMasterProduct().ID : apiProduct.ID
    });

    Object.defineProperty(object, 'productName', {
        enumerable: true,
        value: apiProduct.name
    });

    Object.defineProperty(object, 'productShortDescription', {
        enumerable: true,
        value: apiProduct.shortDescription
    });

    Object.defineProperty(object, 'productLongDescription', {
        enumerable: true,
        value: apiProduct.longDescription
    });

    Object.defineProperty(object, 'productType', {
        enumerable: true,
        value: type
    });
};
