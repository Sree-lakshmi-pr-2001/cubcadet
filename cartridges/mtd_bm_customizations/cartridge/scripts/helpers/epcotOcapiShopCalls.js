const Logger = require('dw/system/Logger').getLogger('OCAPI', 'epcotOcapiShopCalls.js');
const Site = require('dw/system/Site');
const net = require('dw/net');
const epcotOcapiHelper = require('./epcotOcapiHelper');
const epcotHelper = require('./epcotHelper');
const requestHelper = require('./requestHelper');

function addProductToBasket(basketId, productJSON, site, accessToken, currency, attempt, commerceStore, quantity) {
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");
    const productId = productJSON.id;
    let ltlRequired = false;
    let productType = null;

    let isCarbCompliant = false;

    // is this a carb compliant model ?
    // what is the replacement model (if any)
    let carbReplacementItem = epcotHelper.getProductAttributeValue(productJSON, 'c_carb-compliant-item-number', site);;

    if (carbReplacementItem === null) {
        isCarbCompliant = true;
        carbReplacementItem = null;
    } else {
        if (carbReplacementItem === 'n/a' || carbReplacementItem === 'none' || carbReplacementItem === '#') {
            carbComplaint = false;
            carbReplacementItem = 'none';
        } else {
            isCarbCompliant = false;
        }
    }


    Logger.info('in addProductToBasket');
    Logger.info(JSON.stringify(productJSON));

    // if (productJSON["c_ltl-shipment-required"]){
    //     ltlRequired = true;
    // }

    // if (productJSON["c_product-type"]){
    //     productType = productJSON["c_product-type"];
    // }

    let ltlRequiredValue = epcotHelper.getProductAttributeValue(productJSON, 'c_ltl-shipment-required', site);

    if (ltlRequiredValue === 'true' || ltlRequiredValue === true) {
        ltlRequired = true;
    }

    let dealerRequired = epcotHelper.getProductAttributeValue(productJSON, 'c_dealer-required', site);

    if (dealerRequired === 'true' || dealerRequired === true) {
        dealerRequired = true;
    } else {
        dealerRequired = false;
    }

    let edealerEligible = epcotHelper.getProductAttributeValue(productJSON, 'c_edealer-eligible', site);

    if (edealerEligible === 'true' || edealerEligible === true) {
        edealerEligible = true;
    } else {
        edealerEligible = false;
    }

    let edealerProductType = epcotHelper.getProductAttributeValue(productJSON, 'c_edealer-product-type', site);

    productType = epcotHelper.getProductAttributeValue(productJSON, 'c_product-type', site);
    Logger.info(' addProductToBasket productType: ' + productType);


    if (attempt > 1) {
        return ({
            error: true,
            message: 'Error communicating with Commerce Cloud',
            basket_id: null
        });
    } else {
        var existing = false;

        if (basketId) {
            existing = true;
        }
        Logger.info("addProductToBasket, site : " + site + ", accessToken : " + accessToken + ", basketId : " + basketId);

        let url = hostName + shopURL + 'baskets';

        if (basketId) {
            url += "/" + basketId + "/items";
        }

        url += "?" + clientId;

        let productItems = [{
            "product_id": productId,
            "quantity": quantity,
            "c_ltl-shipment-required": ltlRequired,
            "c_product-type": productType,
            "c_carb-compliant": isCarbCompliant,
            "c_carb-compliant-replacement": carbReplacementItem,
            "c_dealer-required": dealerRequired,
            "c_edealer-eligible": edealerEligible,
            "c_edealer-product-type": edealerProductType
        }];


        let postData = {
            "c_commerceStore": commerceStore,
            "agent_basket": true,
            "currency": currency,
            "product_items": productItems
        };

        if (basketId) {
            postData = productItems;
        }

        Logger.info(url);
        Logger.info(JSON.stringify(postData));

        let httpResponse = requestHelper.sendRequest(url, accessToken, postData, "POST", false, 'application/json');

        if (httpResponse.statusCode == 404) {
            Logger.error('Status code 404, trying again with a new basket');
            return addProductToBasket(null, productId, site, accessToken, currency, attempt++);
        } else {
            Logger.error("existing? " + existing + " -> add to basket status : " + httpResponse.statusCode)
            Logger.error("text ===>  " + httpResponse.text)

            if (httpResponse.statusCode === 400) {
                var jsonRES = JSON.parse(httpResponse.errorText);
                Logger.error(JSON.stringify(jsonRES));
                Logger.error('httpResponse.statusCode was 400 ');
                let errorMessage = jsonRES.fault.message;
                Logger.error(errorMessage);
                let errorJSON = {
                    error: true,
                    addToCartError: errorMessage,
                    basketId: basketId
                };

                return errorJSON;
            } else {
                var jsonRES = JSON.parse(httpResponse.text);
                if (jsonRES && jsonRES.basket_id) {
                    Logger.error("existing? " + existing + ", basketId : " + jsonRES.basket_id);
                }
                //Logger.error('text : ' + httpClient.text);
                return jsonRES;
            }
        }
    }
}


function getBasket(basketId, site, accessToken) {
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");

    Logger.error("getBasket, site : " + site + ", accessToken : " + accessToken + ", basketId : " + basketId);
    let url = hostName + shopURL + 'baskets/' + basketId;

    if (basketId)
        url += "?" + clientId;
    Logger.error(url);

    let httpResponse = requestHelper.sendRequest(url, accessToken, null, "GET", false, 'application/json');

    Logger.info(" getBasket basketId " + basketId + " -> getbasket status : " + httpResponse.statusCode)
    Logger.info(" getBasket Responsetext ===>  " + httpResponse.text)
    var jsonRES = JSON.parse(httpResponse.text);

    if (jsonRES && jsonRES.basket_id) {
        Logger.info("get basketId : " + jsonRES.basket_id);
    }

    Logger.info('text : ' + httpResponse.text);
    return jsonRES;
}


function getShippingMethods(basketId, site, accessToken, isDF) {
    Logger.info('In getShippingMethods');
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");
    let url = hostName + shopURL + 'baskets/' + basketId + '/shipments/me/shipping_methods?client_id=' + clientId;
    Logger.info("getShippingMethods url : " + url);
    let jsonData = requestHelper.sendRequest(url, accessToken, {}, "GET");
    Logger.info(jsonData.text);
    let json = JSON.parse(jsonData.text);
    Logger.info("getShippingMethods json returned :");
    Logger.info(json);

    let shippingMethods = [];



    if (json.applicable_shipping_methods) {
        let hasStandard = false;
        var hasLTL = false;
        for (var i = 0; i < json.applicable_shipping_methods.length; i++) {
            let ship = json.applicable_shipping_methods[i];
            if (ship.id == 'standard') {
                hasStandard = true;
            }
            if (ship.id == 'LTL-standard') {
                hasLTL = true;
            }
        }

        Logger.info('hasStandard : ' + hasStandard);
        Logger.info('isDF : ' + isDF);

        for (var i = 0; i < json.applicable_shipping_methods.length; i++) {
            let ship = json.applicable_shipping_methods[i];
            let id = ship.id;
            Logger.error(" id : " + id);
            if (id == 'dealer-pickup' || id == 'dealer-delivery') {
                if (isDF) {
                    shippingMethods.push(ship);
                }
            } else {
                if (!isDF) {
                    if (hasStandard) {
                        if (id !== 'standard-remote' && id != 'LTL-standard-mix') {
                            shippingMethods.push(ship);
                        }
                    } else if (hasLTL) {
                        // if(hasLTL && id != 'LTL-standard-mix') {
                        //     shippingMethods.push(ship);
                        // } else {
                        //     if(id === 'standard-remote') {
                        //         shippingMethods.push(ship);
                        //     }
                        // }
                        if (id === 'LTL-standard') {
                            shippingMethods.push(ship);
                        }
                    } else {
                        shippingMethods.push(ship);
                    }
                }
            }
        }

    }
    Logger.info(JSON.stringify(shippingMethods));
    Logger.info("done in shipping methods");

    return shippingMethods;
}


function getAddressDataFromRequest(map) {
    let addresses = {
        billing: {},
        shipping: {},
        sameAsBilling: false
    };

    Logger.info("map.sameAsBilling : " + map.sameAsBilling);
    addresses.sameAsBilling = false;

    // if (map.sameAsBilling.value == false || map.sameAsBilling.value == 'false') {
    // copy shipping address info
    addresses.shipping.firstName = map.shipping_firstName;
    addresses.shipping.lastName = map.shipping_lastName;
    addresses.shipping.address1 = map.shipping_address1;
    addresses.shipping.address2 = map.shipping_address2;
    addresses.shipping.city = map.shipping_city;
    addresses.shipping.state = map.shipping_state;
    addresses.shipping.postalCode = map.shipping_postalCode;
    addresses.shipping.countryCode = map.shipping_countryCode;
    addresses.shipping.phone = map.shipping_phone;

    // } else {
    //     addresses.sameAsBilling = true;

    // }

    addresses.billing.firstName = map.billing_firstName;
    addresses.billing.lastName = map.billing_lastName;
    addresses.billing.address1 = map.billing_address1;
    addresses.billing.address2 = map.billing_address2;
    addresses.billing.city = map.billing_city;
    addresses.billing.state = map.billing_state;
    addresses.billing.postalCode = map.billing_postalCode;
    addresses.billing.phone = map.billing_phone;
    addresses.billing.email = map.billing_email;
    addresses.billing.countryCode = map.billing_countryCode;


    return addresses;
}

function getDummyAddressData(postalCode, stateOrProvinceCode, countryCode) {
    let addresses = {
        billing: {},
        shipping: {},
        sameAsBilling: false
    };
    addresses.sameAsBilling = true;

    addresses.shipping.firstName = 'ESTIMATE ONLY';
    addresses.shipping.lastName = 'ESTIMATE ONLY';
    addresses.shipping.address1 = 'ESTIMATE ROAD'
    addresses.shipping.address2 = null;
    addresses.shipping.city = 'ESTIMATE CITY'
    addresses.shipping.state = stateOrProvinceCode;
    addresses.shipping.postalCode = postalCode;
    addresses.shipping.countryCode = countryCode;
    addresses.shipping.phone = 'ESTIMATE PHONE';

    addresses.billing.firstName = addresses.shipping.firstName;
    addresses.billing.lastName = addresses.shipping.lastName;
    addresses.billing.address1 = addresses.shipping.address1;
    addresses.billing.address2 = addresses.shipping.address2;
    addresses.billing.city = addresses.shipping.city;
    addresses.billing.state = addresses.shipping.state;
    addresses.billing.postalCode = addresses.shipping.postalCode;
    addresses.billing.phone = addresses.shipping.phone;
    addresses.billing.email = addresses.shipping.email;
    addresses.billing.countryCode = addresses.shipping.countryCode;


    return addresses;
}

function updateAddresses(basketId, billingAddress, shippingAddress, sameAsBilling, accessToken) {
    Logger.info("update addresses basketId : " + basketId);
    let postData = {};
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");

    url = hostName + shopURL + 'baskets/' + basketId + '/billing_address?use_as_shipping=' + sameAsBilling + '&client_id=' + clientId;

    postData = {
        "first_name": billingAddress.firstName,
        "last_name": billingAddress.lastName,
        "address1": billingAddress.address1,
        "address2": billingAddress.address2,
        "city": billingAddress.city,
        "state_code": billingAddress.state,
        "country_code": billingAddress.countryCode,
        "phone": billingAddress.phone,
        "postal_code": billingAddress.postalCode
    };

    let result = requestHelper.sendRequest(url, accessToken, postData, 'PUT');
    Logger.info("billing response statusCode: ");
    Logger.info(result.statusCode);
    Logger.info("billing response error text: ");
    Logger.info(result.errorText);
    var jsonRES = JSON.parse(result.text);

    Logger.error("sameAsBilling : " + sameAsBilling);

    if (sameAsBilling) {
        return jsonRES;
    } else {
        url = hostName + shopURL + 'baskets/' + basketId + '/shipments/me/shipping_address?client_id=' + clientId;
        postData = {
            "first_name": shippingAddress.firstName,
            "last_name": shippingAddress.lastName,
            "address1": shippingAddress.address1,
            "address2": shippingAddress.address2,
            "city": shippingAddress.city,
            "state_code": shippingAddress.state,
            "country_code": shippingAddress.countryCode,
            "phone": shippingAddress.phone,
            "postal_code": shippingAddress.postalCode
        };

        result = requestHelper.sendRequest(url, accessToken, postData, 'PUT');
        Logger.info('updateAddresses: ' + result);
        jsonRES = JSON.parse(result.text);

        if (jsonRES && jsonRES.basket_id) {
            Logger.info("get basketId : " + jsonRES.basket_id);
        }

        Logger.error('shipping error text : ' + result.errorText);

        return jsonRES;
    }
}

function updateShippingMethod(accessToken, basketId, shippingMethod) {
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");

    let url = hostName + shopURL + 'baskets/' + basketId + '/shipments/me/shipping_method?client_id=' + clientId;

    //TODO: Does the special charge code ever change? Or is this hard coded?
    let payload = {
        "id": shippingMethod,
        "c_specialChargeCode": "FRT"
    };

    let httpRes = requestHelper.sendRequest(url, accessToken, payload, "PUT");

    Logger.debug("updateShippingMethod statuscode : " + httpRes.statusCode);
    Logger.info('updateShippingMethod : ' + httpRes);
    jsonRES = JSON.parse(httpRes.text);

    if (jsonRES && jsonRES.basket_id) {
        Logger.info("get basketId : " + jsonRES.basket_id);
    }

    Logger.error('shipping error text : ' + httpRes.errorText);

    return jsonRES;
}

function updateCustomerInfo(basketId, email, accessToken) {
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");

    let url = hostName + shopURL + 'baskets/' + basketId + '/customer?client_id=' + clientId;

    //TODO: Does the special charge code ever change? Or is this hard coded?
    let payload = {
        "email": email
    };

    let httpRes = requestHelper.sendRequest(url, accessToken, payload, "PUT");

    Logger.debug("updateShippingMethod statuscode : " + httpRes.statusCode);

    return;
}

function addNoChargeToBasketItem(accessToken, basketId, itemId, type, value) {
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");

    let url = hostName + shopURL + '/baskets/' + basketId + '/price_adjustments?client_id=' + clientId;
    var discountValue = parseFloat(value);
    let payload = {
        discount: {
            type: type, //"percentage",
            value: discountValue //100
        },
        level: "product",
        item_id: itemId
    }

    let result = requestHelper.sendRequest(url, accessToken, payload, "POST");

    Logger.info(JSON.stringify(result));
    var jsonRES = null;
    if (result.text) {
        jsonRES = JSON.parse(result.text);
    } else if (result.errorText) {
        jsonRES = JSON.parse(result.errorText);
    }
    Logger.info('jsonRES in addNoChargeToBasketItem');
    Logger.info(jsonRES);
    if (result.statusCode == 400) {
        jsonRES.success = false;
    } else if (result.statusCode == 200) {
        Logger.info('addNoChargeToBasketItem success');
        if (jsonRES && jsonRES.basket_id) {
            Logger.info("get basketId : " + jsonRES.basket_id);
        }
        jsonRES.success = true;
    } else {
        jsonRES.success = false;
    }

    Logger.error('shipping error text : ' + result.text);

    return jsonRES;
}

function addPriceAdjustment(accessToken, basketId, adjustmentType, discountValue) {
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");

    let url = hostName + shopURL + 'baskets/' + basketId + '/price_adjustments?client_id=' + clientId;

    let payload = {
        discount: {
            type: adjustmentType,
            value: (discountValue * 1)
        },
        level: "order"
    };

    let result = requestHelper.sendRequest(url, accessToken, payload, "POST");

    Logger.info(JSON.stringify(result));
    var jsonRES = null;
    if (result.text) {
        jsonRES = JSON.parse(result.text);
    } else if (result.errorText) {
        jsonRES = JSON.parse(result.errorText);
    }
    Logger.info('jsonRES in priceAdjustment');
    Logger.info(jsonRES);
    if (result.statusCode == 400) {
        jsonRES.success = false;
    } else if (result.statusCode == 200) {
        Logger.info('addPriceAdjustment success');
        if (jsonRES && jsonRES.basket_id) {
            Logger.info("get basketId : " + jsonRES.basket_id);
        }
        jsonRES.success = true;
    } else {
        jsonRES.success = false;
    }

    Logger.error('shipping error text : ' + result.text);

    return jsonRES;
}


function addCoupon(accessToken, basketId, coupon) {
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");

    let url = hostName + shopURL + 'baskets/' + basketId + '/coupons?client_id=' + clientId;

    let payload = {
        code: coupon
    };

    let result = requestHelper.sendRequest(url, accessToken, payload, "POST");

    Logger.info(JSON.stringify(result));
    var jsonRES = null;
    if (result.text) {
        jsonRES = JSON.parse(result.text);
    } else if (result.errorText) {
        jsonRES = JSON.parse(result.errorText);
    }
    Logger.info('jsonRES in addCoupon');
    Logger.info(jsonRES);
    if (result.statusCode == 400) {
        jsonRES.success = false;
    } else if (result.statusCode == 200) {
        Logger.info('addCoupon success');
        if (jsonRES && jsonRES.basket_id) {
            Logger.error("get basketId : " + jsonRES.basket_id);
        }
        jsonRES.success = true;
    } else {
        jsonRES.success = false;
    }

    // Logger.error('shipping error text : ' + result.text);

    return jsonRES;
}



function removeCoupon(accessToken, basketId, couponItemId) {
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");

    let url = hostName + shopURL + 'baskets/' + basketId + '/coupons/' + couponItemId + '?client_id=' + clientId;

    let payload = null;

    let result = requestHelper.sendRequest(url, accessToken, payload, "DELETE");

    Logger.info(JSON.stringify(result));
    var jsonRES = null;
    if (result.text) {
        jsonRES = JSON.parse(result.text);
    } else if (result.errorText) {
        jsonRES = JSON.parse(result.errorText);
    }
    Logger.info('jsonRES in removeCoupon');
    Logger.info(jsonRES);
    if (result.statusCode == 400) {
        jsonRES.success = false;
    } else if (result.statusCode == 200) {
        Logger.info('removeCoupon success');
        if (jsonRES && jsonRES.basket_id) {
            Logger.info("get basketId : " + jsonRES.basket_id);
        }
        jsonRES.success = true;
    } else {
        jsonRES.success = false;
    }

    // Logger.error('shipping error text : ' + result.text);

    return jsonRES;
}

function removePriceAdjustment(accessToken, basketId, adjustmentId) {
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");

    let url = hostName + shopURL + 'baskets/' + basketId + '/price_adjustments/' + adjustmentId + '?client_id=' + clientId;
    let payload = null;
    let result = requestHelper.sendRequest(url, accessToken, payload, 'DELETE');
    let jsonRES = JSON.parse(result.text);
    return jsonRES;
}

function removeBasketItem(accessToken, basketId, itemId) {
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");

    let url = hostName + shopURL + 'baskets/' + basketId + '/items/' + itemId + '?client_id=' + clientId;
    let payload = null;
    let result = requestHelper.sendRequest(url, accessToken, payload, 'DELETE');
    let jsonRES = JSON.parse(result.text);
    return jsonRES;
}


function updateBasketItem(accessToken, basketId, itemId, quantity) {
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");

    let url = hostName + shopURL + 'baskets/' + basketId + '/items/' + itemId + '?client_id=' + clientId;
    let payload = {
        quantity: quantity
    };
    let result = requestHelper.sendRequest(url, accessToken, payload, 'PATCH');
    let jsonRES = JSON.parse(result.text);
    return jsonRES;
}

function addNotesToOrder(accessToken, basketId, note1, note2, addToOrder, orderNumber) {
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");
    let url = '';
    
    if (addToOrder === true || addToOrder === 'true') {
        url = hostName + shopURL + 'orders/' + orderNumber + '?client_id=' + clientId;
    } else {
        url = hostName + shopURL + 'baskets/' + basketId + '?client_id=' + clientId;
    }

    let payload = {
        "c_note1": note1,
        "c_note2": note2
    }
    let result = requestHelper.sendRequest(url, accessToken, payload, 'PATCH');
    let jsonRES = JSON.parse(result.text);
    return jsonRES;
}

function formatCustomProperties(quantity, listOfCustomProperties) {
    let formattedJson = {
        quantity: quantity
    };
    while (listOfCustomProperties.length > 0) {
        var currentProperty = listOfCustomProperties.shift();
        var customKeyName = "c_" + currentProperty.name;
        formattedJson[customKeyName] = currentProperty.value;
    }
    return formattedJson;
}

function updateBasketItemWithCustomProperties(accessToken, basketId, itemId, quantity, listOfCustomProperties) {
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");

    let url = hostName + shopURL + 'baskets/' + basketId + '/items/' + itemId + '?client_id=' + clientId;
    let payload = formatCustomProperties(quantity, listOfCustomProperties);
    let result = requestHelper.sendRequest(url, accessToken, payload, 'PATCH');
    let jsonRES = JSON.parse(result.text);
    return jsonRES;
}

function submitPayment(basketId, accessToken, paymentMethod, orderTotal, payload) {
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");

    let url = hostName + shopURL + 'baskets/' + basketId + '/payment_instruments?client_id=' + clientId;

    Logger.error('submitPayment payload : ' + JSON.stringify(payload));

    let result = requestHelper.sendRequest(url, accessToken, payload, 'POST');
    let jsonRES = JSON.parse(result.text);
    if (jsonRES['_v']) {
        delete jsonRES['_v'];
    }
    return jsonRES;
}

function patchOrderPaymentTransaction(orderId, accessToken, paymentInstrumentId, payload) {
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");

    let url = hostName + shopURL + 'orders/' + orderId + '/payment_instruments/' + paymentInstrumentId + '?client_id=' + clientId + '&skip_authorization=false';

    Logger.error('patchOrderPaymentTransaction url ' + url);
    Logger.error('patchOrderPaymentTransaction payload ' + JSON.stringify(payload));

    let result = requestHelper.sendRequest(url, accessToken, payload, 'PATCH');
    let jsonRES = JSON.parse(result.text);
    if (jsonRES['_v']) {
        delete jsonRES['_v'];
    }
    return jsonRES;
}

function patchOrder(orderId, accessToken, payload) {
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");

    let url = hostName + shopURL + 'orders/' + orderId + '?client_id=' + clientId + '&skip_authorization=false';

    Logger.info('patchOrder url ' + url);
    Logger.info('patchOrder payload ' + JSON.stringify(payload));

    let result = requestHelper.sendRequest(url, accessToken, payload, 'PATCH');
    let jsonRES = JSON.parse(result.text);
    if (jsonRES['_v']) {
        delete jsonRES['_v'];
    }
    return jsonRES;
}

function submitOrder(accessToken, basket) {
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");

    let url = hostName + shopURL + 'orders?client_id=' + clientId;
    let httpRes = requestHelper.sendRequest(url, accessToken, basket, 'POST');
    return httpRes;
}

function getOrder(accessToken, commerceOrderNumber) {
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");

    let url = hostName + shopURL + 'orders/' + commerceOrderNumber + '?client_id=' + clientId;
    Logger.info('OCAPI Shop API url to Get Order : ' + url);
    let postData = null;
    let httpRes = requestHelper.sendRequest(url, accessToken, postData, 'GET');
    return httpRes;
}

function patchNoChargeOrder(accessToken, commerceOrderNumber, needsApproval, noChargeApprovalResponse, noChargeAdmin) {
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");

    let url = hostName + shopURL + 'orders/' + commerceOrderNumber + '?client_id=' + clientId;

    let payload = {
        c_noChargeNeedsApproval: needsApproval,
        c_noChargeApprovalResponse: noChargeApprovalResponse,
        c_noChargeAdmin: noChargeAdmin,
        c_orderConfirmationEmailSent: 'N'
    };

    Logger.info('patch NoChargeOrder url ' + url);
    Logger.info('patch NoChargeOrder payload ' + JSON.stringify(payload));

    let result = requestHelper.sendRequest(url, accessToken, payload, 'PATCH');
    let jsonRES = JSON.parse(result.text);
    if (jsonRES['_v']) {
        delete jsonRES['_v'];
    }
    return jsonRES;
}

function patchOrderWithCustomProperties(accessToken, commerceOrderNumber, postData) {
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");

    let url = hostName + shopURL + 'orders/' + commerceOrderNumber + '?client_id=' + clientId;

    let httpRes = requestHelper.sendRequest(url, accessToken, postData, 'PATCH', false, 'application/json');
    return httpRes;
}

function getNoChargeOrders(accessToken) {
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    // const dataPrefix = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_DATA_URL")
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");
    Logger.info("accessToken to get NoCharge Orders List: " + accessToken);


    // let cubDataPrefix = '/s/cubcadet/dw/shop/v21_8/';
    // let troyDataPrefix = '/s/troybilt/dw/shop/v21_8/';
    // let mtdDataPrefix = '/s/mtdparts/dw/shop/v21_8/';

    // let url = hostName + dataPrefix + "order_search?client_id=" + clientId;
    // Returning:
    // https://dev09-na01-mtd.demandware.net/s/-/dw/data/v21_8/order_search?client_id=a07ec61e-9a54-4281-8d17-dda76e819067

    let postData = {
        "count": 100,
        "query": {
            "filtered_query": {
                "query": {
                    "match_all_query": {}
                },
                "filter": {
                    "bool_filter": {
                        "operator": "and",
                        "filters": [{
                            "term_filter": {
                                "field": "status",
                                "operator": "one_of",
                                "values": ["open", "new"]
                            }
                        },
                        {
                            "term_filter": {
                                "field": "export_status",
                                "operator": "is",
                                "values": ["not_exported"]
                            }
                        },
                        {
                            "term_filter": {
                                "field": "c_noChargeNeedsApproval",
                                "operator": "is",
                                "values": ["true"]
                            }
                        }
                        ]
                    }
                }
            }
        },
        "select": "(hits.(data.(export_status, status, order_no,creation_date, billing_address, c_noChargeNeedsApproval)))",
        "sorts": [{
            "field": "creation_date",
            "sort_order": "desc"
        }]
    };

    let url = hostName + shopURL + "order_search?client_id=" + clientId;
    Logger.info('OCAPI shop call URL to get No Charge Orders List : ' + url);
    let ordersObject = requestHelper.sendRequest(url, accessToken, postData, "POST", false, 'application/json')
    let formattedJson = [];
    if (ordersObject) {
        let orderResponse = JSON.parse(ordersObject.text);
        Logger.info('No Of NoCharge Orders :' + orderResponse.hits);
        if (orderResponse.hits) {
            Logger.info('Formatting ' + orderResponse.hits.length + ' hits');
            orderResponse.hits.forEach(function (order) {
                var formattedOrder = order.data;
                formattedOrder['store'] = Site.current.name;
                formattedJson.push(formattedOrder);
            });
        } else {
            Logger.error('no results for no charge audit');
        }
    }

    // // Cub
    // let cubURL = hostName + cubDataPrefix + "order_search?client_id=" + clientId;
    // Logger.error('CUB URL = > ' + cubURL);
    // let cubResponse = requestHelper.sendRequest(cubURL, accessToken, postData, "POST", false, 'application/json');
    // let cubRES = JSON.parse(cubResponse.text);

    // // Troybilt
    // let troyURL = hostName + troyDataPrefix + "order_search?client_id=" + clientId;
    // Logger.error('TROY URL => ' + troyURL);
    // let troyResponse = requestHelper.sendRequest(troyURL, accessToken, postData, "POST", false, 'application/json');
    // let troyRES = JSON.parse(troyResponse.text);

    // // MTD Parts
    // let mtdURL = hostName + mtdDataPrefix + "order_search?client_id=" + clientId;
    // Logger.error('MTD URL => ' + mtdURL);
    // let mtdResponse = requestHelper.sendRequest(mtdURL, accessToken, postData, "POST", false, 'application/json');
    // let mtdRES = JSON.parse(mtdResponse.text);

    // // Combine the 3
    // var jsonRES = epcotHelper.combineNoChargeResponses(cubRES, troyRES, mtdRES);
    // // Return the 3

    return formattedJson;
}

function updateOrderNote(orderId, accessToken, payload) {
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");
    
    let url = hostName + shopURL + 'orders/' + orderId + '/notes';

    Logger.info('OCAPI Shop API url to update Note ' + url);
    Logger.info('Order Note ' + JSON.stringify(payload));

    let result = requestHelper.sendRequest(url, accessToken, payload, 'POST');
    let jsonRES = JSON.parse(result.text);
    if (jsonRES['_v']) {
        delete jsonRES['_v'];
    }
    return jsonRES;
}

function updateCasenumberToBasket(accessToken, basketId, caseNumber) {
    const clientId = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_CLIENT");
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const shopURL = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_SHOP_URL");

    let url = hostName + shopURL + 'baskets/' + basketId + '?client_id=' + clientId;

    let payload = {
        "c_SfdcCaseNumber": caseNumber
    }
    let result = requestHelper.sendRequest(url, accessToken, payload, 'PATCH');
    let jsonRES = JSON.parse(result.text);
    return jsonRES;
}

module.exports.getNoChargeOrders = getNoChargeOrders;
module.exports.addNoChargeToBasketItem = addNoChargeToBasketItem;
module.exports.addProductToBasket = addProductToBasket;
module.exports.getBasket = getBasket;
module.exports.getShippingMethods = getShippingMethods;
module.exports.getAddressDataFromRequest = getAddressDataFromRequest;
module.exports.getDummyAddressData = getDummyAddressData;
module.exports.updateAddresses = updateAddresses;
module.exports.updateShippingMethod = updateShippingMethod;
module.exports.addPriceAdjustment = addPriceAdjustment;
module.exports.removePriceAdjustment = removePriceAdjustment;
module.exports.submitPayment = submitPayment;
module.exports.submitOrder = submitOrder;
module.exports.getOrder = getOrder;
// module.exports.patchBasketWithChaseDetails=patchBasketWithChaseDetails;
module.exports.updateCustomerInfo = updateCustomerInfo;
module.exports.removeBasketItem = removeBasketItem;
module.exports.updateBasketItem = updateBasketItem;
module.exports.addNotesToOrder = addNotesToOrder;
module.exports.updateBasketItemWithCustomProperties = updateBasketItemWithCustomProperties;
module.exports.addCoupon = addCoupon;
module.exports.removeCoupon = removeCoupon;
module.exports.patchOrderPaymentTransaction = patchOrderPaymentTransaction;
module.exports.patchNoChargeOrder = patchNoChargeOrder;
module.exports.patchOrder = patchOrder;
module.exports.patchOrderWithCustomProperties = patchOrderWithCustomProperties;
module.exports.updateOrderNote = updateOrderNote;
module.exports.updateCasenumberToBasket = updateCasenumberToBasket;