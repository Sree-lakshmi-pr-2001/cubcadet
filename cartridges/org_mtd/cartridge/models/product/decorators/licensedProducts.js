'use strict';

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'isLicensedProduct', {
        enumerable: true,
        value: apiProduct.custom.IsLicensedProduct || false
    });

    Object.defineProperty(object, 'licensedProductFindStoreUrl', {
        enumerable: true,
        value: apiProduct.custom.FindAStoreUrl
    });
};
