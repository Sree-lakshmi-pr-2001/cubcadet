/* global session */
'use strict';

var Logger = require('dw/system/Logger').getLogger('EpcotOrder', 'epcotHelper.js');
var Map = require('dw/util/HashMap');
var mtdAPICalls = require('./mtdAPICalls');

function processRoles(roles) {
    Logger.info("processRoles : " + roles);
        if (roles){
            if (!Array.isArray(roles)){
                roles = [ roles ];
            }

        }
}

function getCountry(site) {
    if (site === 'cubcadetca' || site === 'troybiltca' || site === 'mtdpartsca' || site === 'epcotca') {
        return 'CA';
    } else {
        return "US";
    }
}

function getSitesForCountry(country) {
    if (country == 'US'){
        return (['cubcadet', 'mtdparts', 'troybilt']);
    } else {
        return (['cubcadetca', 'mtdpartsca', 'troybiltca']);
    }
}

function convertCommerceInventoryToMap(commerceInventory) {
    var inventoryMap = new Map();
    for (var i=0; i < commerceInventory.length; i++){
        inventoryMap.put(commerceInventory[i].productId,commerceInventory[i]);
    }

    return inventoryMap;
}

function updateProductSearchProductsWithInventory(productJSON,commerceInventory) {
    Logger.info("Update Inventory of Products getting after search");
    var inventoryMap = convertCommerceInventoryToMap(commerceInventory);
    if (productJSON && productJSON.hits && productJSON.hits.length > 0){
        for (var i=0; i < productJSON.hits.length; i++){
            var productId = productJSON.hits[i].id;
            if (inventoryMap.containsKey(productId)){
                productJSON.hits[i].actualMTDInventory = inventoryMap.get(productId).quantity;
            }

        }
    }
    return productJSON;
}

function updateBasketProductsWithInventory(basketJSON, siteId) {
    Logger.info("in updateBasketProductsWithInventory");
    Logger.info(JSON.stringify(basketJSON));
    var country = getCountry(siteId);

    var productIds = getProductIdsFromBasket(basketJSON);
    Logger.info('productIds length : ' + productIds.length);
    if (productIds.length > 0) {
        var commerceInventory = mtdAPICalls.getCommerceInventory(country, productIds);
        if (commerceInventory.length > 0) {
            var inventoryMap = convertCommerceInventoryToMap(commerceInventory);
            Logger.info('inventoryMap map size : ' + inventoryMap.size());
            if (basketJSON && basketJSON.product_items && basketJSON.product_items.length > 0){
                for (var i=0; i < basketJSON.product_items.length; i++){
                    var productId = basketJSON.product_items[i].product_id;
                    Logger.info('checking for ' + productId);
                    if (inventoryMap.containsKey(productId)){
                        basketJSON.product_items[i].actualMTDInventory = inventoryMap.get(productId).quantity;
                    }
                }
            }
        }
    }


    Logger.info("done in updateBasketProductsWithInventory");

    return basketJSON;
}

function getProductIdsFromProductSearch(productJSON) {
    var productIds = [];

    if (productJSON && productJSON.hits && productJSON.hits.length > 0){
        for (var i=0; i < productJSON.hits.length; i++){
            productIds.push(productJSON.hits[i].id);
        }
    }
    return productIds;
}

function getProductIdsFromBasket(basketJSON) {
    var productIds = [];

    if (basketJSON && basketJSON.product_items && basketJSON.product_items.length > 0){
        for (var i=0; i < basketJSON.product_items.length; i++){
            productIds.push(basketJSON.product_items[i].product_id);
        }
    }
    return productIds;
}

function initializeAddresses (basketJSON, countryCode) {
    var addresses = {
        billing: {},
        shipping: {},
        sameAsBilling: false
    };

    addresses.billing.firstName = '';
    addresses.billing.lastName = '';
    addresses.billing.address1 = '';
    addresses.billing.address2 = '';
    addresses.billing.city = '';
    addresses.billing.state = '';
    addresses.billing.postalCode = '';
    addresses.billing.phone = '';
    addresses.billing.countryCode = countryCode;
    addresses.billing.email = '';

    addresses.shipping.firstName = '';
    addresses.shipping.lastName = '';
    addresses.shipping.address1 = '';
    addresses.shipping.address2 = '';
    addresses.shipping.city = '';
    addresses.shipping.state = '';
    addresses.shipping.postalCode = '';
    addresses.shipping.countryCode = countryCode;
    addresses.shipping.phone = '';

    
    if (basketJSON.billing_address && basketJSON) {
        
        if (basketJSON.billing_address.first_name === 'ESTIMATE ONLY') {
            // keep state / province && zip / postal code from estimate
            addresses.billing.postalCode = basketJSON.billing_address.postal_code;
            addresses.shipping.postalCode = addresses.billing.postalCode;
            addresses.billing.state = basketJSON.billing_address.state_code;
            addresses.shipping.state = addresses.billing.state;
    
            return addresses;
        }

        addresses.billing.firstName = basketJSON.billing_address.first_name;
        addresses.billing.lastName = basketJSON.billing_address.last_name;
        addresses.billing.address1 = basketJSON.billing_address.address1;
        if (basketJSON.billing_address.address2) {
            addresses.billing.address2 = basketJSON.billing_address.address2;
        }
        addresses.billing.city = basketJSON.billing_address.city;
        addresses.billing.state = basketJSON.billing_address.state_code;
        addresses.billing.postalCode = basketJSON.billing_address.postal_code;
        addresses.billing.phone = basketJSON.billing_address.phone;
        addresses.billing.countryCode = countryCode;
    }

    if (basketJSON.shipments && basketJSON.shipments.length > 0 &&  basketJSON.shipments[0].shipping_address) {
        addresses.shipping.firstName = basketJSON.shipments[0].shipping_address.first_name;
        addresses.shipping.lastName = basketJSON.shipments[0].shipping_address.last_name;
        addresses.shipping.address1 = basketJSON.shipments[0].shipping_address.address1;
        if (basketJSON.shipments[0].shipping_address.address2) {
            addresses.shipping.address2 = basketJSON.shipments[0].shipping_address.address2;
        }
        addresses.shipping.city = basketJSON.shipments[0].shipping_address.city;
        addresses.shipping.state = basketJSON.shipments[0].shipping_address.state_code;
        addresses.shipping.postalCode = basketJSON.shipments[0].shipping_address.postal_code;
        addresses.shipping.phone = basketJSON.shipments[0].shipping_address.phone;
        addresses.shipping.countryCode = countryCode;
    }

    if (basketJSON.customer_info.email && basketJSON.customer_info.email != ''){
        addresses.billing.email = basketJSON.customer_info.email;
    }

    return addresses;
}

function checkAddToCart(productId, countryCode) {
    Logger.info('checkAddToCart start for ' + productId +', countryCode : ' + countryCode);
    let details = {
        replacement : null
    }
    let itemDetailsFromService = mtdAPICalls.getItemERPDetails(productId, countryCode);
    Logger.info('itemDetailsFromService : ' + JSON.stringify(itemDetailsFromService));
    if (itemDetailsFromService && itemDetailsFromService.length > 0) {
        if (itemDetailsFromService.length > 0){
            let itemBalanceStatus = null;
            let replacementFound = false;
            let cspFound = false;
            let activeItemBalanceFound = false;

            for (var i=0; i < itemDetailsFromService.length; i++){
                let product = itemDetailsFromService[i];

                if (countryCode == 'CA'){
                    // canada doesn't use CSPs (as of 3/13/2022) so assume that this product has a "csp entry"
                    cspFound = true;
                } else {
                    if (product.PRICINGENTRYEXISTS && product.PRICINGENTRYEXISTS == 'Y'){
                        cspFound = true;
                    }
                }

                if (product.SUBITEMNUMBER) {
                    replacementFound = true;
                    details.replacement = product.SUBITEMNUMBER;
                }



                if (product.ITEMBALANCESTATUS){
                    itemBalanceStatus = product.ITEMBALANCESTATUS;
                    if (itemBalanceStatus == 'A') {
                        activeItemBalanceFound = true;
                    }
                }
            }
            // a product must be in a CSP and have an active item balance to be able to sell online
            if (activeItemBalanceFound && cspFound) {
                details.allowAddToCart = true;
            } else {
                if (cspFound == false) {
                    if (details.replacement) {
                        details.itemFailure = productId + ' has been replaced by ' + details.replacement + ' which is not in an active CSP';
                    } else {
                        details.itemFailure = productId + ' is not in an active CSP';
                    }
                } else {
                    if (itemBalanceStatus == 'S') {
                        if (details.replacement) {
                            details.itemFailure = productId + ' has been replaced by ' + details.replacement + ' which does not have an active item balance (S)';
                        } else {
                            details.itemFailure = productId + ' does not have an active item balance (S)';
                        }
                    } else {
                        if (details.replacement) {
                            details.itemFailure = productId + ' has been replaced by ' + details.replacement + ' which does not have an active item balance (item balance does not exist)';
                        } else {
                            details.itemFailure = productId + ' does not have an active item balance (item balance does not exist)';
                        }
                    }
                }
            }
        } else {
            details.allowAddToCart = false;
        }
    } else {
        // details.allowAddToCart = false;
        // details.itemFailure = 'Product not found in ERP';
        details.cspFound = true;
        details.allowAddToCart = true;
    }
    Logger.info('checkAddToCart for ' + productId +', countryCode : ' + countryCode + ', details : ' + JSON.stringify(details));
    return details;
}
function parseUsersList(json){
    let parsedJson = {};
    parsedJson['users'] = [];
    json.users.forEach(function(user){
        let parsedUser = {};
        parsedUser['id'] = user.id;
        parsedUser['email'] = user.email;
        if(user.active === 1){
            parsedUser['active'] = 'Active';
        } else {
            parsedUser['active'] = 'Inactive';
        }
        // parsedUser['active'] = Boolean(user.active);
        parsedUser['maxRole'] = user.roles;
        parsedJson.users.push(parsedUser);
    });
    Logger.info(parsedJson);
    return parsedJson;
}
/**
 * get attribute
 * @param {Object} product - product JSON
 * @param {string} attributeName - website for search
 * @param {string} commerceSite - website for search
 * @returns {Object} attributeValue - whatever the attribute is
 */
 function getProductAttributeValue(product, attributeName, commerceSite) {
    let attributeValue = null;

    let countryCode = 'default@' + commerceSite;
    Logger.info('in getProductAttributeValue looking for ' + attributeName + ' and countryCode = ' + countryCode);
    if (product[attributeName]) {
        Logger.info(attributeName + ' exists');
        if (product[attributeName][countryCode]) {
            attributeValue = product[attributeName][countryCode];
        } else if (product[attributeName].default) {
            attributeValue = product[attributeName].default;
            Logger.info(attributeName + ' default exists = ' + product[attributeName].default);
        } else {
            attributeValue = product[attributeName];
        }
    }

    Logger.info('attributeValue => ' + attributeValue);
    return attributeValue;
}


// // NEED LINTING STUFF HERE
// function combineNoChargeResponses(cubRES, troyRES, mtdRES){
//     formattedJson = [];
//     if(cubRES.hits){
//         Logger.error('Formatting ' + cubRES.hits.length + ' hits');
//         cubRES.hits.forEach(function(order){
//             var formattedOrder = order.data;
//             formattedOrder['store'] = 'CubCadet';
//             formattedJson.push(formattedOrder);
//         });
//     }

//     if(troyRES.hits){
//         Logger.error('Formatting ' + troyRES.hits.length + ' hits');
//         troyRES.hits.forEach(function(order){
//             var formattedOrder = order.data;
//             formattedOrder['store'] = 'TroyBilt';
//             formattedJson.push(formattedOrder);
//         });
//     }

//     if(mtdRES.hits){
//         Logger.error('Formatting ' + mtdRES.hits.length + ' hits');
//         mtdRES.hits.forEach(function(order){
//             var formattedOrder = order.data;
//             formattedOrder['store'] = 'MTD Parts';
//             formattedJson.push(formattedOrder);
//         });
//     }

//     // Logger.error('FORMATTED NO CHARGE JSON => ');
//     // Logger.error(JSON.stringify(formattedJson));

//     return(formattedJson);
// }

// module.exports.combineNoChargeResponses=combineNoChargeResponses;

function validateAddressUsingGoogle (address) {
    var addressRequest1 = {
        address: {
            'regionCode': address.country,
            'locality': address.cityOrMunicipality,
            'administrativeArea': address.stateOrProvince,
            'postalCode': address.postalCode,
            'addressLines': address.address1
        }
    }
    var googleAddressValidation = require('int_mtdservices/cartridge/scripts/helpers/GoogleAddressValidation');

    var validationResponse = googleAddressValidation.verify(addressRequest1);

    if (validationResponse && validationResponse.result && validationResponse.result.verdict && validationResponse.result.verdict.addressComplete) {
        validationResponse.errorFlag = false;
        validationResponse.originalAddress = {
            address1: address.address1,
            address2: address.address2,
            city: address.cityOrMunicipality,
            state: address.stateOrProvince,
            postalCode: address.postalCode,
            country: address.country,
        };
        if(validationResponse && validationResponse.result && validationResponse.result.address && validationResponse.result.address.formattedAddress ){
            validationResponse.correctedFlag = true;
            var correctedAddressTxt = '';
            correctedAddressTxt = validationResponse.result.address.formattedAddress.split(",");
            var stateCode = correctedAddressTxt[2].trim().split(" ");
            var country = address.country === 'us' || address.country === 'US' || address.country === 'USA';
            var correctedPostalCode = '';
            if (country) {
                correctedPostalCode = validationResponse.result.uspsData.standardizedAddress.zipCode;
            } else {
                correctedPostalCode = validationResponse.result.address.postalAddress.postalCode;
            }

            validationResponse.correctedAddress = {
                address1: correctedAddressTxt[0],
                address2: '',
                city: correctedAddressTxt[1],
                state: stateCode[0],
                postalCode: correctedPostalCode,
                country: validationResponse.result.address.postalAddress.regionCode,
            }
        }
        return validationResponse;
    } else {
        validationResponse = {
            errorFlag: true,
            correctedFlag: false,
        };
        validationResponse.correctedAddress = null;
        validationResponse.originalAddress = {
            address1: address.address1,
            address2: address.address2,
            city: address.cityOrMunicipality,
            state: address.stateOrProvince,
            postalCode: address.postalCode,
            country: address.country,
        }
        return validationResponse;
    }
}


module.exports.parseUsersList=parseUsersList;
module.exports.processRoles=processRoles;
module.exports.getCountry=getCountry;
module.exports.convertCommerceInventoryToMap=convertCommerceInventoryToMap;
module.exports.updateProductSearchProductsWithInventory=updateProductSearchProductsWithInventory;
module.exports.getProductIdsFromProductSearch=getProductIdsFromProductSearch;
module.exports.initializeAddresses=initializeAddresses;
module.exports.checkAddToCart=checkAddToCart;
module.exports.getProductAttributeValue=getProductAttributeValue;
module.exports.updateBasketProductsWithInventory=updateBasketProductsWithInventory;
module.exports.getProductIdsFromBasket=getProductIdsFromBasket;
module.exports.getSitesForCountry=getSitesForCountry;
module.exports.validateAddressUsingGoogle = validateAddressUsingGoogle;