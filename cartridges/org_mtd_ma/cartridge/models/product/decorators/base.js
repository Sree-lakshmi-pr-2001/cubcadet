'use strict';

var URLUtils = require('dw/web/URLUtils');

/**
 * Creates an array for a product
 * @param {Strings} value - attribute with a set of strings for a given product.
 * @return {Array} - an array containing the visible object attributes for a product.
 */
function objectArray(value) {
    var array = [];
    for (var i = 0, l = value.length; i < l; i++) {
        var obj = value[i];
        array.push(obj);
    }

    return array;
}

/**
 * Creates an array for a product
 * @param {List} value - attribute with a enum of strings for a given product.
 * @return {Array} - an array containing the visible object attributes for a product.
 */
function enumToArray(value) {
    var array = [];
    for (var i = 0, l = value.length; i < l; i++) {
        var obj = value[i].value;
        array.push(obj);
    }

    return array;
}

function getSuggestionsProdDetails(CARBProductSuggestions){
    var suggestionsObj =  objectArray(CARBProductSuggestions)
    var suggestionsProdArray = [];
    var product;
    if(!empty(suggestionsObj)){
        // suggestionsProdArray = Object.values(suggestionsObj);
        var ProductMgr = require('dw/catalog/ProductMgr');
        for each(var item in suggestionsObj) {
            var productData = {};
            var imageUrl;
            product = ProductMgr.getProduct(item);
            var largImageUrl = product.getImages('large');
            if(largImageUrl.length > 0){
                imageUrl = largImageUrl[0].getHttpsURL().toString();
            }
            productData.id = product.ID
            productData.name = product.name;   
            productData.name2 = product.custom.productName2
            productData.imageUrl = imageUrl;
            productData.pdpUrl = URLUtils.abs('Product-Show','pid',item,'fitsOnModel',false).toString();
            suggestionsProdArray.push(productData);
        }
    }
    return suggestionsProdArray;
}

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

    Object.defineProperty(object, 'extendedName', {
        enumerable: true,
        value: apiProduct.custom.productName2
    });

    Object.defineProperty(object, 'features', {
        enumerable: true,
        value: objectArray(apiProduct.custom.features)
    });

    Object.defineProperty(object, 'clpFeatures', {
        enumerable: true,
        value: objectArray(apiProduct.custom.clpFeatures)
    });

    Object.defineProperty(object, 'productShortDescription', {
        enumerable: true,
        value: apiProduct.shortDescription
    });

    Object.defineProperty(object, 'productLongDescription', {
        enumerable: true,
        value: apiProduct.longDescription
    });

    Object.defineProperty(object, 'productBadge', {
        enumerable: true,
        value: objectArray(apiProduct.custom.productBadge)
    });

    Object.defineProperty(object, 'productType', {
        enumerable: true,
        value: type
    });

    Object.defineProperty(object, 'productAttributeType', {
        enumerable: true,
        value: apiProduct.custom['product-type'].value
    });

    Object.defineProperty(object, 'isBuyable', {
        enumerable: true,
        value: apiProduct.custom['cub-buyable']
    });

    Object.defineProperty(object, 'requestDemo', {
        enumerable: true,
        value: apiProduct.custom.requestADemo
    });

    Object.defineProperty(object, 'whereToBuy', {
        enumerable: true,
        value: enumToArray(apiProduct.custom['where-to-buy'])
    });

    Object.defineProperty(object, 'relatedContent', {
        enumerable: true,
        value: objectArray(apiProduct.custom.relatedContent)
    });

    Object.defineProperty(object, 'CARBCompliantItem', {
        enumerable: true,
        value: apiProduct.custom.CARBCompliantItem
    });

    Object.defineProperty(object, 'CARBProductSuggestions', {
        enumerable: true,
        value: getSuggestionsProdDetails(apiProduct.custom.CARBProductSuggestions)
    });

    Object.defineProperty(object, 'removeCARBProductUrl', {
        enumerable: true,
        value: URLUtils.url('Cart-RemoveProductLineItem').toString(),
    });
};
