'use strict';

/**
 * Get estimated total price for product and extended warranty
 * @param {dw.catalog.Product} product - already added to basket
 * @param {dw.catalog.Product} warranty - extended warranty for added product
 * @returns {string} estimated total price
 */
function getEstimatedTotalPrice(product, warranty) {
    var formatCurrency = require('*/cartridge/scripts/util/formatting').formatCurrency;

    var estimatedPrice = product.price.sales.value;
    var formattedPrice = formatCurrency(estimatedPrice, product.price.sales.currency);

    return formattedPrice;
}

/**
 * Check if this Basket is Only Aftermarket Warranty. Used in Shipping page to decide what to display
 * @param {dw.order.Basket} basket - already added to basket
 * @returns {boolean} estimated total price
 */
function checkForAfterMarketOnlyBasket (basket) {
    var results = true;

    for each(let lineItem in basket.allProductLineItems) {
        if ('product-type' in lineItem.custom && lineItem.custom['product-type'] != "ExtendedWarranty") {
      
            //if ('ew-type' in lineItem.custom && lineItem.custom['product-type'] != "ExtendedWarranty" && 'ew-type' in lineItem.custom && lineItem.custom['ew-type'] != "EW_AFT") {
            results = false;
        }
    }
    return results;
}




/**
 * Check if this Basket contains any Aftermarket Warranty. Used in Registration page to decide what to display
 * @param {dw.order.Basket} basket - already added to basket
 * @returns {boolean} estimated total price
 */
 function returnWarranties(basket) {
    var warranties = new Array();
    var purchaseFromAttribute = JSON.parse(dw.system.Site.current.preferences.custom['EW-Purchase-From']);
    var purchaseFrom = purchaseFromAttribute[request.httpLocale]
    var purchaseDisplay = "";

    for each(let purchaseLocation in purchaseFrom) {
        purchaseDisplay = purchaseDisplay + "<option value='" + purchaseLocation + "'>" + purchaseLocation + "</option>";

    }

    for each(let item in basket.allProductLineItems) {
        if ('ew-type' in item.custom && item.custom['ew-type'] == "EW_AFT") {
            var warranty = {
                shortDescription: item.product.shortDescription,
                coverage: item.product.custom['years-of-coverage-text'],
                model: item.custom['ew-model'],
                productName: item.custom['ew-productName'] != null ? item.custom['ew-productName'] : null,
                productID: item.productID,
                type: item.custom['ew-type'],
                endUse: item.custom['ew-aftermarket-end-use'],
                factoryNumber: item.custom['ew-aftermarket-factory-number'],
                serialNumber: item.custom['ew-aftermarket-serial-number'],
                purchaseFrom: purchaseDisplay,
                registered: item.custom['ew-existing-registration']
            };
         
            warranties.push(warranty);
        }
    }
    return warranties;
}

/**
 * Check if this Basket contains any Aftermarket Warranty. Used in Registration page to decide what to display
 * @param {dw.order.Basket} basket - already added to basket
 * @returns {boolean} estimated total price
 */
function checkForAfterMarketInBasket (basket) {
    var result = false;

    for each (let lineItem in basket.allProductLineItems) {
        if ('ew-type' in lineItem.custom && lineItem.custom['ew-type'] === "EW_AFT") {
            result = true;
            break;
        }
    }

    return result;
}

function combinePurchasedFrom (reqForm) {
    var result = {};

    for (let i = 0; i < reqForm.purchasedFromCount; i++) {
        let propName = reqForm['purchasedFromId' + i];
        let propValue = reqForm['purchasedFromValue' + i];
        result[propName] = propValue;
    }

    return result;
}


module.exports = {
    getEstimatedTotalPrice: getEstimatedTotalPrice,
    checkForAfterMarketOnlyBasket: checkForAfterMarketOnlyBasket,
    checkForAfterMarketInBasket: checkForAfterMarketInBasket,
    returnWarranties: returnWarranties,
    combinePurchasedFrom: combinePurchasedFrom
};
