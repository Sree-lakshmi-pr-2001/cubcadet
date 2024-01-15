'use strict';

var base = module.superModule;

/**
 * Convert enum values to array values
 * @param {enum} attributeValues - attribute enum
 * @returns {array} - values in array
 */
function enumToArray(attributeValues) {
    var arrayValues = [];
    for (var i = 0, l = attributeValues.length; i < l; i++) { // eslint-disable-line dot-notation
        var attribute = attributeValues[i]; // eslint-disable-line dot-notation
        arrayValues.push(attribute.displayValue);
    }
    return arrayValues;
}

/**
 * @constructor
 * @classdesc The stores model
 * @param {dw.catalog.Store} storeObject - a Store objects
 */
function store(storeObject) {
    var Resource = require('dw/web/Resource');
    base.call(this, storeObject);
    if (storeObject) {
        this.custom.fullLines = false; // true when store carries UTV product category and at least one other category
        this.custom.pro = false; // true when store carries only PRO product category
        this.custom.sno = false; // true when store carries only SNO product category
        this.custom.utvs = false; // true when store carries only UTV product category
        this.custom.fullNoUtvs = false; // true when a store does not carry UTV product category and has other product categories

        var containsPro = false;
        var containsSno = false;
        var containsUtv = false;

        var productCategories = [];
        for (var x = 0, l = storeObject.custom['product_categories'].length; x < l; x++) { // eslint-disable-line dot-notation
            var productCategory = storeObject.custom['product_categories'][x]; // eslint-disable-line dot-notation
            productCategories.push(productCategory.displayValue);
            if (storeObject.custom.product_categories[x].value === 'PRO') {
                containsPro = true;
            } else if (storeObject.custom.product_categories[x].value === 'SNO') {
                containsSno = true;
            } else if (storeObject.custom.product_categories[x].value === 'UTV') {
                containsUtv = true;
            }
        }
        // maintain custom properties for consistent checking in templates
        this.custom.productCategories = productCategories;
        this.custom.pro = containsPro && productCategories.length === 1;
        this.custom.sno = containsSno && productCategories.length === 1;
        this.custom.utvs = containsUtv && productCategories.length === 1;
        this.custom.fullLines = containsUtv && productCategories.length > 1;
        this.custom.fullNoUtvs = !containsUtv && !this.custom.pro && !this.custom.sno && !this.custom.utvs && productCategories.length > 0;

        var limitedRetailers = Resource.msg('limitedline.retailerids.array', 'storeLocator', null).split(',');
        var isLimited = false;
        for (var i = 0; i < storeObject.custom.retailer_id.length; i++) {
            var isMatch = limitedRetailers.indexOf(storeObject.custom.retailer_id[i].value) !== -1;
            // if there is any value is found that does not match a value in the retailer array, consider Limited Line to be false.
            isLimited = isLimited || isMatch;
        }
        this.custom.limited_line = isLimited;

        // Custom store attributes; varies by retailer vs dealer
        this.custom.retailer_id = storeObject.custom.retailer_id ? enumToArray(storeObject.custom.retailer_id) : ''; // eslint-disable-line camelcase
        this.custom.dealer_id = storeObject.custom.dealer_id ? storeObject.custom.dealer_id : ''; // eslint-disable-line camelcase
        this.custom.website = storeObject.custom.website ? storeObject.custom.website : null;
        this.custom.customernumber = storeObject.custom.customernumber ? storeObject.custom.customernumber : '';
        this.custom.cubcadet = storeObject.custom.cubcadet ? storeObject.custom.cubcadet : false;
        this.custom.cubcadetcare = storeObject.custom.cubcadetcare ? storeObject.custom.cubcadetcare : false;
        this.custom.sells_products = storeObject.custom.sells_products ? storeObject.custom.sells_products : false; // eslint-disable-line camelcase
        this.custom.services_products = storeObject.custom.services_products ? storeObject.custom.services_products : false; // eslint-disable-line camelcase

        // Custom Store Elite Dealer Bool
        var isIndependentDealer = ('retailer_id' in storeObject.custom && storeObject.custom.retailer_id && storeObject.custom.retailer_id[0].value === 'dealers');
        var dealerOrElite = storeObject.custom.elite_dealer ? 'elite' : 'dealer';

        this.custom.DealerType = isIndependentDealer ? dealerOrElite : 'retail';
        this.custom.isEliteDealer = storeObject.custom.elite_dealer ? storeObject.custom.elite_dealer : false;

        this.pageTitle = storeObject.custom.pageTitle;
        this.pageDescription = storeObject.custom.pageDescription;

        this.erpShipToNumber = storeObject.custom.erp_ship_to_number ? storeObject.custom.erp_ship_to_number : null;
    }
}

module.exports = store;
