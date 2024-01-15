/* global session */
'use strict';

var server = require('server');
var Logger = require('dw/system/Logger').getLogger('EPCOTORDER', 'EpcotOrderConsumer.js');
// var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
// var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var URLUtils = require('dw/web/URLUtils');
var epcotOcapiHelper = require('../scripts/helpers/epcotOcapiHelper.js');
var epcotOcapiDataCalls = require('../scripts/helpers/epcotOcapiDataCalls.js');
var epcotOcapiShopCalls = require('../scripts/helpers/epcotOcapiShopCalls.js');
var epcotHelper = require('../scripts/helpers/epcotHelper');
var mtdAPICalls = require('../scripts/helpers/mtdAPICalls');
var epcotOrderHelper = require('../scripts/helpers/epcotOrderHelper');

var Site = require('dw/system/Site');

server.get('StartBasket',
    server.middleware.https,
    function (req, res, next) {
        var siteId = Site.getCurrent().getID();
        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;
        var userDetails = JSON.parse(session.custom.bmUserDetails);
        var showNoCharge = epcotOcapiHelper.getVisibilityFromPermission(userDetails, 'apply-no-charge');
        var showDiscounts = epcotOcapiHelper.getVisibilityFromPermission(userDetails, 'apply-discounts');
        var countryCode = epcotHelper.getCountry(siteId);
        var isCARBEnabled = Site.getCurrent().getCustomPreferenceValue('isCARBEnabled');
        Logger.info('Start Basket When clicks on selecting brand');
        var currentBasketId = req.querystring.basketId;
        var commerceStore = req.querystring.commerceStore;
        if (!currentBasketId) {
            currentBasketId = null;
        } else if (!commerceStore) {
            var token = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);
            var basketJSON = epcotOcapiShopCalls.getBasket(currentBasketId, siteId, token);
            commerceStore = basketJSON.c_commerceStore;
        }
        var carbObject = {};
        if (isCARBEnabled) {
            if (session.custom.CARBProductRemoved) {
                carbObject.CARBProductRemoved = session.custom.CARBProductRemoved;
                carbObject.shippingState = session.custom.shippingState;
                carbObject.aletrnativeProductId = session.custom.aletrnativeProductId;
                delete session.custom.CARBProductRemoved;
                delete session.custom.shippingState;
                delete session.custom.aletrnativeProductId;
            } else if (session.custom.shippingState) {
                carbObject.shippingState = session.custom.shippingState;
                delete session.custom.shippingState;
            }
        }

        res.render('checkout/startBasket', {
            basketId: currentBasketId,
            commerceStore: commerceStore,
            siteId: siteId,
            showNoCharge: showNoCharge,
            showDiscounts: showDiscounts,
            countryCode: countryCode,
            carbObject: carbObject
        });
        next();
    }
);

server.get('ChooseBrand',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('Choose Brand Page');
        var currentBasketId = req.querystring.basketId;
        var siteId = Site.getCurrent().getID();
        var country = epcotHelper.getCountry(siteId);
        Logger.info('Site :' + siteId + 'and Country : ' + country);
        if (!currentBasketId) {
            currentBasketId = null;
        }

        res.render('checkout/chooseBrand', {
            basketId: currentBasketId,
            country: country
        });
        next();
    }
);

server.post('ReturnToStartBasket',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('ReturnToStartBasket');
        var isCARBEnabled = Site.getCurrent().getCustomPreferenceValue('isCARBEnabled');
        var currentBasketId;
        if (req.form.basketId) {
            currentBasketId = req.form.basketId;
        } else if (req.querystring.basketId) {
            currentBasketId = req.querystring.basketId;
        }


        if (!currentBasketId) {
            currentBasketId = null;
        }
        if (isCARBEnabled) {
            if (req.form.CARBShippingStateVal) {
                session.custom.shippingState = req.form.CARBShippingStateVal;
            }
        }
        
        var redirectUrl = URLUtils.url('EpcotOrderConsumer-StartBasket',
            'basketId', currentBasketId
        );

        res.redirect(redirectUrl);
        next();
    }
);

server.post('AjaxProductSearch',
    server.middleware.https,
    function (req, res, next) {
        var siteId = Site.getCurrent().getID();
        var country = epcotHelper.getCountry(siteId);
        var productSearchTerm = req.form.searchTerm;
        var accessToken = epcotOcapiHelper.getDataOauthToken();
        Logger.info('oauth token for product search=> ' + accessToken);
        var productSearchResults = epcotOcapiDataCalls.productSearch(accessToken, siteId, productSearchTerm);

        var productIds = epcotHelper.getProductIdsFromProductSearch(productSearchResults);

        if (productIds.length > 0) {
            var commerceInventory = mtdAPICalls.getCommerceInventory(country, productIds);
            if (commerceInventory.length > 0) {
                productSearchResults = epcotHelper.updateProductSearchProductsWithInventory(productSearchResults, commerceInventory);
            }
        }

        // Logger.error(productSearchResults);

        res.json(productSearchResults);
        next();
    }
);

server.post('AjaxAddToBasket',
    server.middleware.https,
    function (req, res, next) {
        var siteId = Site.getCurrent().getID();
        var productJSONString = req.form.productJSONString;
        Logger.info('AddToBasket : ' + productJSONString);
        var productJSON = JSON.parse(productJSONString);
        Logger.info('AddToBasket productJSON : ');
        Logger.info(productJSON);
        var basketId = req.form.basketId;
        var commerceStore = req.form.commerceStore;
        if (basketId === 'null' || basketId === undefined || basketId === 'undefined') {
            basketId = null;
        }
        var quantity = req.form.quantity * 1;

        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;

        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);

        var currency = Site.getCurrent().getDefaultCurrency();
        Logger.info('add to basket currency : ' + currency);

        Logger.info('bm grant token => ' + accessToken);
        var countryCode = epcotHelper.getCountry(siteId);
        var productType = epcotHelper.getProductAttributeValue(productJSON, 'c_product-type', siteId);
        var addToCartCheckDetails = epcotHelper.checkAddToCart(productJSON.manufacturer_sku, countryCode);
        if (productType === 'MANUALS') {
            addToCartCheckDetails.allowAddToCart = true;
        }

        if (addToCartCheckDetails.allowAddToCart) {
            var originalProductId = productJSON.id;
            if (addToCartCheckDetails.replacement) {
                productJSON.id = addToCartCheckDetails.replacement;
                Logger.info('originalProductId : ' + originalProductId + ', replacement : ' + addToCartCheckDetails.replacement);
            }

            Logger.info('token in ajaxAddToBasketRoute, : ' + accessToken);
            var addToBasketJSON = epcotOcapiShopCalls.addProductToBasket(basketId, productJSON, siteId, accessToken, currency, 0, commerceStore, quantity);
            Logger.info('jsonResult :');
            Logger.info(addToBasketJSON);
            if (addToBasketJSON.error) {
                Logger.error('failed to add to cart : ' + addToBasketJSON);
            } else {
                addToBasketJSON = epcotHelper.updateBasketProductsWithInventory(addToBasketJSON, siteId);
                addToBasketJSON.addToCartError = false;
            }

            // var country = epcotHelper.getCountry(siteId);

            // var productIds = epcotHelper.getProductIdsFromBasket(addToBasketJSON);

            // if (productIds.length > 0) {
            //     var commerceInventory = mtdAPICalls.getCommerceInventory(country, productIds);
            //     if (commerceInventory.length > 0) {
            //         addToBasketJSON = epcotHelper.updateBasketProductsWithInventory(addToBasketJSON, commerceInventory);
            //     }
            // }

            res.json(addToBasketJSON);
        } else {
            var addToCartError = addToCartCheckDetails.itemFailure;
            Logger.error('Error while add to cart : ' + addToCartError);
            res.json({
                addToCartError: addToCartError
            });
        }


        next();
    }
);

server.post('AjaxGetBasket',
    server.middleware.https,
    function (req, res, next) {
        var siteId = Site.getCurrent().getID();
        var basketId = req.form.basketId;
        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;
        var token = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);
        var basketJSON = epcotOcapiShopCalls.getBasket(basketId, siteId, token);
        basketJSON = epcotHelper.updateBasketProductsWithInventory(basketJSON, siteId);
        // var country = epcotHelper.getCountry(siteId);

        // var productIds = epcotHelper.getProductIdsFromBasket(basketJSON);

        // if (productIds.length > 0) {
        //     var commerceInventory = mtdAPICalls.getCommerceInventory(country, productIds);
        //     if (commerceInventory.length > 0) {
        //         basketJSON = epcotHelper.updateBasketProductsWithInventory(basketJSON, commerceInventory);
        //     }
        // }

        res.json(basketJSON);
        next();
    }
);

server.post('AjaxGetOrder',
    server.middleware.https,
    function (req, res, next) {
        var commerceOrderNumber = req.form.orderId;
        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;
        var token = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);
        var orderResponse = epcotOcapiShopCalls.getOrder(token, commerceOrderNumber);
        Logger.info(JSON.stringify(orderResponse));
        var orderJSON = JSON.parse(orderResponse.text);
        Logger.info('AjaxGetOrder : ' + orderJSON);
        Logger.info('returning back json');
        // var country = epcotHelper.getCountry(siteId);

        // var productIds = epcotHelper.getProductIdsFromBasket(basketJSON);

        // if (productIds.length > 0) {
        //     var commerceInventory = mtdAPICalls.getCommerceInventory(country, productIds);
        //     if (commerceInventory.length > 0) {
        //         basketJSON = epcotHelper.updateBasketProductsWithInventory(basketJSON, commerceInventory);
        //     }
        // }

        res.json(orderJSON);
        next();
    }
);


server.post('StartCheckout',
    server.middleware.https,
    function (req, res, next) {
        var basketId = req.form.basketId;
        var commerceStore = req.form.commerceStore;
        Logger.info('in StartCheckout');
        var redirectUrl = URLUtils.url('EpcotOrderConsumer-AddressView',
            'basketId', basketId, 'commerceStore', commerceStore
        );
        res.redirect(redirectUrl);
        next();
    }
);

server.post('SubmitCheckout',
    server.middleware.https,
    function (req, res, next) {
        var redirectUrl = null;
        var siteId = Site.getCurrent().getID();
        var basketId = req.form.basketId;
        var commerceStore = req.form.commerceStore;
        Logger.info('in epcot submit checkout basketId : ' + basketId + ', commerceStore : ' + commerceStore);

        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;

        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);
        var basketJSON = epcotOcapiShopCalls.getBasket(basketId, siteId, accessToken);
        if (commerceStore === null || commerceStore === undefined || commerceStore === 'undefined') {
            // pull from the basket
            commerceStore = basketJSON.c_commerceStore;
            Logger.info('Commerce store was undefined - setting as : ' + commerceStore);
        }
        if (basketJSON.order_total === 0.0) {
            Logger.info('no charge order');
            var paymentMethod = 'NO_CHARGE';

            var orderTotal = basketJSON.order_total;

            var paymentPayload = {
                amount: orderTotal,
                payment_method_id: paymentMethod
            };

            var newBasketJSON = epcotOcapiShopCalls.submitPayment(basketId, accessToken, paymentMethod, orderTotal, paymentPayload);
            var orderResponse = epcotOcapiShopCalls.submitOrder(accessToken, newBasketJSON);
            var orderJSON = JSON.parse(orderResponse.text);
            var commerceOrderNumber = null;

            var paymentPayloadPatch = {
                amount: basketJSON.order_total,
                payment_method_id: 'NO_CHARGE',
                create_customer_payment_instrument: false,
                c_PaymentSource: 'ocapi'
            };

            if (orderJSON && orderJSON.order_no) {
                commerceOrderNumber = orderJSON.order_no;

                if (orderJSON.payment_instruments && orderJSON.payment_instruments.length > 0) {
                    var paymentInstrumentId = orderJSON.payment_instruments[0].payment_instrument_id;
                    epcotOcapiShopCalls.patchOrderPaymentTransaction(commerceOrderNumber, accessToken, paymentInstrumentId, paymentPayloadPatch);

                    var payload = {
                        c_noChargeNeedsApproval: true,
                        c_globalComplianceCheckStatus :'PENDING',
                        c_SfdcCaseNumber: basketJSON.c_SfdcCaseNumber ? basketJSON.c_SfdcCaseNumber : '',
                        c_isSFDCSynced: basketJSON.c_SfdcCaseNumber ? 'N' : ''
                    };

                    var patchedOrder = epcotOcapiShopCalls.patchOrder(commerceOrderNumber, accessToken, payload);
                    Logger.info('patched Order ' + JSON.stringify(patchedOrder));
                }

                //         var orderRes = epcotOcapiShopCalls.submitOrder(bmToken, newBasketJSON);

                //         var jsonRES = JSON.parse(orderRes.text);
                //         var commerceOrderNumber = jsonRES.order_no;
                //         // TODO: error handling on submitOrder?
            }

            // TODO: what happens if hte order failed?
            Logger.info('order placed successfully, order # = ' + commerceOrderNumber);

            redirectUrl = URLUtils.url('EpcotOrderConsumer-OrderView',
                'commerceOrderNumber', commerceOrderNumber,
                'commerceStore', commerceStore
            );
        } else {
            Logger.info('PCI Pal Order');
            redirectUrl = URLUtils.url('PCIPal-StartPayment',
                'basketId', basketId,
                'commerceStore', commerceStore
            );
        }
        res.redirect(redirectUrl);
        next();
    }
);

server.get('AddressView',
    server.middleware.https,
    function (req, res, next) {
        var basketId = req.querystring.basketId;
        var commerceStore = req.querystring.commerceStore;
        var siteId = Site.getCurrent().getID();

        if (!basketId) {
            basketId = null;
        }

        Logger.info('AddressView basketId => ' + basketId);

        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;
        var userDetails = JSON.parse(session.custom.bmUserDetails);
        var showNoCharge = epcotOcapiHelper.getVisibilityFromPermission(userDetails, 'apply-no-charge');
        var showDiscounts = epcotOcapiHelper.getVisibilityFromPermission(userDetails, 'apply-discounts');

        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);
        var basketJSON = epcotOcapiShopCalls.getBasket(basketId, siteId, accessToken);

        var countryCode = epcotHelper.getCountry(siteId);

        var addresses = epcotHelper.initializeAddresses(basketJSON, countryCode);

        // var shippingMethods = epcotOcapiShopCalls.getShippingMethods(basketId, siteId, accessToken, false);
        // var selectedShippingMethod = null;
        // if (basketJSON.shipments && basketJSON.shipments.length > 0 && basketJSON.shipments[0].shipping_method) {
        //     selectedShippingMethod = basketJSON.shipments[0].shipping_method.id;
        // }
        res.render('checkout/address', {
            basketId: basketId,
            addresses: addresses,
            siteId: siteId,
            commerceStore: commerceStore,
            showNoCharge: showNoCharge,
            showDiscounts: showDiscounts,
            countryCode: countryCode
        });
        next();
    }
);

server.post('AddressSubmit',
    server.middleware.https,
    function (req, res, next) {
        var siteId = Site.getCurrent().getID();
        Logger.info('siteId is ' + siteId + ', I hope you are happy linting, I used the variable');
        var basketId = req.form.basketId;
        var commerceStore = req.form.commerceStore;
        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;
        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);
        var addressData = epcotOcapiShopCalls.getAddressDataFromRequest(req.form);
        var email = req.form.billing_email;
        //        var shippingMethod = req.form.shippingMethod;
        epcotOcapiShopCalls.updateAddresses(basketId, addressData.billing, addressData.shipping, addressData.sameAsBilling, accessToken);
        epcotOcapiShopCalls.updateCustomerInfo(basketId, email, accessToken);
        //      epcotOcapiShopCalls.updateShippingMethod(accessToken, basketId, shippingMethod);
        var redirectUrl = URLUtils.url('EpcotOrderConsumer-PaymentsAndDiscounts',
            'basketId', basketId, 'commerceStore', commerceStore
        );
        res.redirect(redirectUrl);
        next();
    }
);

server.post('EstimateAddressSubmit',
    server.middleware.https,
    function (req, res, next) {
        var siteId = Site.getCurrent().getID();
        Logger.info('In estimateAddressSubmit - current siteId is : ' + siteId);
        var basketId = req.form.basketId;
        // var commerceStore = req.form.commerceStore;
        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;
        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);
        var countryCode = epcotHelper.getCountry(siteId);
        var stateOrProvinceCode = req.form.stateOrProvinceCode;
        var zipCode = req.form.zipCode;
        var addressData = epcotOcapiShopCalls.getDummyAddressData(zipCode, stateOrProvinceCode, countryCode);
        var email = req.form.email;
        //        var shippingMethod = req.form.shippingMethod;
        epcotOcapiShopCalls.updateAddresses(basketId, addressData.billing, addressData.shipping, addressData.sameAsBilling, accessToken);
        epcotOcapiShopCalls.updateCustomerInfo(basketId, email, accessToken);

        var shippingMethods = epcotOcapiShopCalls.getShippingMethods(basketId, siteId, accessToken, false);
        var basketJSON = epcotOcapiShopCalls.updateShippingMethod(accessToken, basketId, shippingMethods[0].id);
        basketJSON = epcotHelper.updateBasketProductsWithInventory(basketJSON, siteId);
        res.json(basketJSON);
        next();
    }
);

server.get('PaymentsAndDiscounts',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('In PaymentsAndDiscounts');
        var basketId = req.querystring.basketId;
        var commerceStore = req.querystring.commerceStore;
        var siteId = Site.getCurrent().getID();
        if (!basketId) {
            basketId = null;
        }

        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;
        var userDetails = JSON.parse(session.custom.bmUserDetails);
        var showNoCharge = epcotOcapiHelper.getVisibilityFromPermission(userDetails, 'apply-no-charge');
        var showDiscounts = epcotOcapiHelper.getVisibilityFromPermission(userDetails, 'apply-discounts');

        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);
        var basketJSON = epcotOcapiShopCalls.getBasket(basketId, siteId, accessToken);

        var shippingMethods = epcotOcapiShopCalls.getShippingMethods(basketId, siteId, accessToken, false);
        var selectedShippingMethod = null;
        if (basketJSON.shipments && basketJSON.shipments.length > 0 && basketJSON.shipments[0].shipping_method) {
            selectedShippingMethod = basketJSON.shipments[0].shipping_method.id;
        }

        if (siteId === "epcotus") {
            var chkExpedited = [];
            var isExpedited = false;
            basketJSON = epcotHelper.updateBasketProductsWithInventory(basketJSON, siteId);
            for (var i = 0; i < basketJSON.product_items.length; i++){
                if ((basketJSON.product_items[i]["c_product-type"] != "PARTS" && basketJSON.product_items[i]["c_product-type"] != "ACCESSORY") || basketJSON.product_items[i]["c_product-type"] === null || basketJSON.product_items[i].actualMTDInventory <= 0){
                    chkExpedited.push("isNotExpedited");
                } else {
                    chkExpedited.push("isExpedited");
                }
            }

            if (chkExpedited.indexOf("isNotExpedited") == -1) {
                isExpedited = true;
            }
        }

        if (!basketJSON) {
            res.render('checkout/emptyBasket', {});
        } else {
            var pciPalError = req.querystring.pciPalError;
            res.render('checkout/paymentAndDiscounts', {
                basketId: basketId,
                siteId: siteId,
                commerceStore: commerceStore,
                pciPalError: pciPalError,
                shippingMethods: shippingMethods,
                selectedShippingMethod: selectedShippingMethod,
                showNoCharge: showNoCharge,
                showDiscounts: showDiscounts,
                isExpedited: isExpedited
            });
        }
        next();
    }
);

server.post('AjaxNoChargeItem',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('AjaxNoChargeItem');
        var siteId = Site.getCurrent().getID();
        var basketId = req.form.basketId;
        var itemId = req.form.itemId;

        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;

        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);

        var currency = Site.getCurrent().getDefaultCurrency();
        Logger.info('add to basket currency : ' + currency);

        Logger.info('bm grant token => ' + accessToken);
        Logger.info('token in AjaxNoChargeItem route, : ' + accessToken);
        var noChargeItemJson = epcotOcapiShopCalls.addNoChargeToBasketItem(accessToken, basketId, itemId);

        if (noChargeItemJson.success) {
            Logger.info('AjaxNoChargeItem jsonResult :');
            Logger.info(noChargeItemJson);
            noChargeItemJson.success = true;
        } else {
            Logger.error('AjaxNoChargeItem - There was an issue adding no charge to the item');
            var errorType = null;
            var errorMessage = null;
            if (noChargeItemJson && noChargeItemJson.fault) {
                errorType = noChargeItemJson.fault.type;
                errorMessage = noChargeItemJson.fault.message;
            }
            noChargeItemJson = epcotOcapiShopCalls.getBasket(basketId, siteId, accessToken);
            noChargeItemJson.success = false;
            noChargeItemJson.errorType = errorType;
            noChargeItemJson.errorMessage = errorMessage;
        }
        noChargeItemJson = epcotHelper.updateBasketProductsWithInventory(noChargeItemJson, siteId);
        res.json(noChargeItemJson);
        next();
    }
);

server.post('AjaxNoChargeBasket',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('AjaxNoChargeBasket');
        var siteId = Site.getCurrent().getID();
        var basketId = req.form.basketId;
        var itemIdArray = req.form.itemIdArray;
        itemIdArray = JSON.parse(itemIdArray);

        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;

        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);

        var currency = Site.getCurrent().getDefaultCurrency();
        Logger.info('add to basket currency : ' + currency);

        Logger.info('bm grant token => ' + accessToken);
        Logger.info('token in AjaxNoChargeBasket route, : ' + accessToken);

        var noChargeItemJSON = {
            noChargeItems: []
        };
        // ADDED - Add no charge to order
        var couponJSON = epcotOcapiShopCalls.addCoupon(accessToken, basketId, 'CSR_FREESHIP');
        noChargeItemJSON.noChargeItems.push(couponJSON);
        // -----------------------------
        itemIdArray.forEach(function (itemId) {
            var noChargeItemJson = epcotOcapiShopCalls.addNoChargeToBasketItem(accessToken, basketId, itemId);
            if (noChargeItemJson.success) {
                Logger.info('AjaxNoChargeBasket jsonResult :');
                Logger.info(noChargeItemJson);
                noChargeItemJson.success = true;
            } else {
                Logger.error('AjaxNoChargeBasket - There was an issue adding no charge to the item');
                var errorType = null;
                var errorMessage = null;
                if (noChargeItemJson && noChargeItemJson.fault) {
                    errorType = noChargeItemJson.fault.type;
                    errorMessage = noChargeItemJson.fault.message;
                }
                noChargeItemJson = epcotOcapiShopCalls.getBasket(basketId, siteId, accessToken);
                noChargeItemJson.success = false;
                noChargeItemJson.errorType = errorType;
                noChargeItemJson.errorMessage = errorMessage;
            }
            noChargeItemJson = epcotHelper.updateBasketProductsWithInventory(noChargeItemJson, siteId);
            noChargeItemJSON.noChargeItems.push(noChargeItemJson);
        });
        res.json(noChargeItemJSON);
        next();
    }
);

server.post('AjaxPriceAdjustment',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('In AjaxPriceAdjustment');
        var siteId = Site.getCurrent().getID();
        var basketId = req.form.basketId;
        var adjustmentType = req.form.adjustmentType;
        // var reasonCode = req.form.reasonCode;
        var discountValue = req.form.discountValue;

        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;

        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);

        var currency = Site.getCurrent().getDefaultCurrency();
        Logger.info('add to basket currency : ' + currency);

        Logger.info('bm grant token => ' + accessToken);
        Logger.info('token in AjaxPriceAdjustment, : ' + accessToken);
        var priceAdjustmentJSON = epcotOcapiShopCalls.addPriceAdjustment(accessToken, basketId, adjustmentType, discountValue);

        if (priceAdjustmentJSON.success) {
            Logger.info('AjaxPriceAdjustment jsonResult :');
            Logger.info(priceAdjustmentJSON);
            priceAdjustmentJSON.success = true;
        } else {
            var errorType = null;
            var errorMessage = null;
            if (priceAdjustmentJSON && priceAdjustmentJSON.fault) {
                errorType = priceAdjustmentJSON.fault.type;
                errorMessage = priceAdjustmentJSON.fault.message;
            }
            priceAdjustmentJSON = epcotOcapiShopCalls.getBasket(basketId, siteId, accessToken);
            priceAdjustmentJSON.success = false;
            priceAdjustmentJSON.errorType = errorType;
            priceAdjustmentJSON.errorMessage = errorMessage;
        }
        priceAdjustmentJSON = epcotHelper.updateBasketProductsWithInventory(priceAdjustmentJSON, siteId);
        res.json(priceAdjustmentJSON);
        next();
    }
);


server.post('AjaxAddCoupon',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('AjaxAddCoupon');
        var siteId = Site.getCurrent().getID();
        var basketId = req.form.basketId;
        var couponCode = req.form.couponCode;

        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;

        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);

        Logger.info('bm grant token => ' + accessToken);
        Logger.info('token in AjaxAddCoupon, : ' + accessToken);
        var couponJSON = epcotOcapiShopCalls.addCoupon(accessToken, basketId, couponCode);

        if (couponJSON.success) {
            Logger.info('AjaxAddCoupon jsonResult :');
            Logger.info(couponJSON);
            couponJSON.success = true;
        } else {
            var errorType = null;
            var errorMessage = null;
            if (couponJSON && couponJSON.fault) {
                errorType = couponJSON.fault.type;
                errorMessage = couponJSON.fault.message;
            }
            couponJSON = epcotOcapiShopCalls.getBasket(basketId, siteId, accessToken);
            couponJSON.success = false;
            couponJSON.errorType = errorType;
            couponJSON.errorMessage = errorMessage;
        }
        couponJSON = epcotHelper.updateBasketProductsWithInventory(couponJSON, siteId);
        res.json(couponJSON);
        next();
    }
);


server.post('AjaxRemoveCoupon',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('AjaxRemoveCoupon');
        var siteId = Site.getCurrent().getID();
        var basketId = req.form.basketId;
        var couponCode = req.form.couponCode;

        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;

        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);

        Logger.info('bm grant token => ' + accessToken);
        Logger.info('token in AjaxRemoveCoupon, : ' + accessToken);
        var couponJSON = epcotOcapiShopCalls.removeCoupon(accessToken, basketId, couponCode);

        if (couponJSON.success) {
            Logger.info('AjaxRemoveCoupon jsonResult :');
            Logger.info(couponJSON);
            couponJSON.success = true;
        } else {
            var errorType = null;
            var errorMessage = null;
            if (couponJSON && couponJSON.fault) {
                errorType = couponJSON.fault.type;
                errorMessage = couponJSON.fault.message;
            }
            couponJSON = epcotOcapiShopCalls.getBasket(basketId, siteId, accessToken);
            couponJSON.success = false;
            couponJSON.errorType = errorType;
            couponJSON.errorMessage = errorMessage;
        }
        couponJSON = epcotHelper.updateBasketProductsWithInventory(couponJSON, siteId);
        res.json(couponJSON);
        next();
    }
);

server.post('AjaxRemovePriceAdjustment',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('In AjaxRemovePriceAdjustment');
        var siteId = req.form.siteId;
        var basketId = req.form.basketId;
        var adjustmentId = req.form.adjustmentId;
        Logger.info('In AjaxRemovePriceAdjustment : basketId : ' + basketId + ', adjustmentId : ' + adjustmentId);
        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;

        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);

        var priceAdjustmentJSON = epcotOcapiShopCalls.removePriceAdjustment(accessToken, basketId, adjustmentId);
        priceAdjustmentJSON = epcotHelper.updateBasketProductsWithInventory(priceAdjustmentJSON, siteId);
        res.json(priceAdjustmentJSON);

        next();
    }
);

server.post('AjaxRemoveBasketItem',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('In AjaxRemoveBasketItem');
        var siteId = req.form.siteId;
        var basketId = req.form.basketId;
        var itemId = req.form.itemId;
        var isCARBEnabled = Site.getCurrent().getCustomPreferenceValue('isCARBEnabled');
        Logger.info('In AjaxRemoveBasketItem : basketId : ' + basketId + ', itemId : ' + itemId);
        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;

        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);

        var basketJSON = epcotOcapiShopCalls.removeBasketItem(accessToken, basketId, itemId);
        basketJSON = epcotHelper.updateBasketProductsWithInventory(basketJSON, siteId);
        if (isCARBEnabled) {
            if (req.form.CARBProductRemoved) {
                session.custom.shippingState = req.form.shippingState;
                session.custom.aletrnativeProductId = req.form.aletrnativeProductId;
                session.custom.CARBProductRemoved = req.form.CARBProductRemoved;
            }
        }

        res.json(basketJSON);

        next();
    }
);

// Add notes to order
server.post('AjaxAddNotesToOrder',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('in AjaxAddNotesToOrder');
        // var siteId = req.form.siteId;
        var basketId = req.form.basketId;
        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;
        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);
        var notes1 = null;
        var notes2 = null;
        var addToOrder = false;
        var orderNumber = null;
        if (req.form.notes1) {
            notes1 = req.form.notes1;
        }
        if (req.form.notes2) {
            notes2 = req.form.notes2;
        }
        if (req.form.isAudit) {
            addToOrder = req.form.isAudit;
        }
        if (req.form.orderNumber) {
            orderNumber = req.form.orderNumber;
        }
        Logger.info('addNotesToOrder order no : ' + orderNumber);
        var basketJSON = epcotOcapiShopCalls.addNotesToOrder(accessToken, basketId, notes1, notes2, addToOrder, orderNumber);
        res.json(basketJSON);
        next();
    }
);

// AjaxUpdateBasketWithNoChargeReasonCodes
server.post('AjaxUpdateBasketWithNoChargeReasonCodes',
    server.middleware.https,
    function (req, res, next) {
        var siteId = req.form.siteId;
        var basketId = req.form.basketId;
        var convertedArray = JSON.parse(req.form.itemArray);
        var modelNumber = req.form.noChargeModelNumber;
        var serialNumber = req.form.noChargeSerialNumber;
        // eslint-disable-next-line radix
        var reasonCode = parseInt(req.form.noChargeReasonCode);

        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;

        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);
        var basketJSON;
        convertedArray.forEach(function (item) {
            var itemId = item.itemId;
            var quantity = item.quantity;
            basketJSON = epcotOcapiShopCalls.updateBasketItemWithCustomProperties(accessToken, basketId, itemId, quantity, [
                {
                    name: 'noChargeReasonCode',
                    value: reasonCode
                },
                {
                    name: 'noChargeModelNumber',
                    value: modelNumber
                },
                {
                    name: 'noChargeSerialNumber',
                    value: serialNumber
                }
            ]);
            basketJSON = epcotHelper.updateBasketProductsWithInventory(basketJSON, siteId);
        });
        res.json(basketJSON);
        next();
    }
);

server.post('AjaxUpdateBasketItem',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('In AjaxUpdateBasketItem');
        var siteId = req.form.siteId;
        var basketId = req.form.basketId;
        var itemId = req.form.itemId;
        var quantity = (req.form.quantity * 1);
        Logger.info('in AjaxUpdateBasketItem : basketId : ' + basketId + ', itemId : ' + itemId + ', quantity: ' + quantity);
        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;

        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);

        var basketJSON = epcotOcapiShopCalls.updateBasketItem(accessToken, basketId, itemId, quantity);
        basketJSON = epcotHelper.updateBasketProductsWithInventory(basketJSON, siteId);
        res.json(basketJSON);

        next();
    }
);
// TODO: jmiyamoto I don't think this is used anymore 7/21/2022
// server.post('OrderSubmitNoCharge',
//     server.middleware.https,
//     function (req, res, next) {
//         Logger.error('in welcome');
//         var siteId = Site.getCurrent().getID();
//         var basketId = req.form.basketId;
//         var paymentMethod = req.form.paymentMethod;

//         var bmUser = session.custom.bmUser;
//         var bmPassword = session.custom.bmPassword;

//         var bmToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);
//         var basketJSON = epcotOcapiShopCalls.getBasket(basketId, siteId, bmToken);
//         var orderTotal = basketJSON.order_total;

//         var paymentPayload = {
//             amount: orderTotal,
//             payment_method_id: paymentMethod
//         };

//         var newBasketJSON = epcotOcapiShopCalls.submitPayment(basketId, bmToken, paymentMethod, orderTotal, paymentPayload);

//         var orderRes = epcotOcapiShopCalls.submitOrder(bmToken, newBasketJSON);

//         var jsonRES = JSON.parse(orderRes.text);
//         var commerceOrderNumber = jsonRES.order_no;
//         // TODO: error handling on submitOrder?

//         var payload = {
//             c_noChargeNeedsApproval: true
//         };

//         var patchedOrder = epcotOcapiShopCalls.patchOrder(commerceOrderNumber, bmToken, payload);
//         Logger.error('patched Order ' + JSON.stringify(patchedOrder));

//         Logger.error('order # = ' + commerceOrderNumber);

//         Logger.error('all done OrderSubmitNoCharge');

//         var redirectUrl = URLUtils.url('EpcotOrderConsumer-OrderView',
//             'commerceOrderNumber', commerceOrderNumber
//         );

//         res.redirect(redirectUrl);

//         next();
//     }
// );

server.get('OrderView',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('In OrderView');
        var commerceOrderNumber = req.querystring.commerceOrderNumber;

        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;
        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);
        var siteId = Site.getCurrent().getID();

        // check to see if this user has audit approval

        var audit = req.querystring.audit;

        var orderResponse = epcotOcapiShopCalls.getOrder(accessToken, commerceOrderNumber);
        Logger.info(JSON.stringify(orderResponse));
        var order = JSON.parse(orderResponse.text);
        Logger.info(order);
        var storedUserDetails = JSON.parse(session.custom.bmUserDetails);
        var canApproveOrders = epcotOcapiHelper.getVisibilityFromPermission(storedUserDetails, 'approve-audit');
        res.render('checkout/viewOrder', {
            order: order,
            audit: audit,
            canApproveOrders: canApproveOrders,
            siteId: siteId
        });
        next();
    }
);

server.post('AJAXAddressValidate',
    server.middleware.https,
    function (req, res, next) {
        var addressForm = req.form;
        var billingAddress = {
            address1: addressForm.billing_address1,
            address2: addressForm.billing_address2,
            cityOrMunicipality: addressForm.billing_city,
            country: addressForm.billing_countryCode,
            language: 'en',
            postalCode: addressForm.billing_postalCode,
            stateOrProvince: addressForm.billing_state
        };

        var shippingAddress = {
            address1: addressForm.shipping_address1,
            address2: addressForm.shipping_address2,
            cityOrMunicipality: addressForm.shipping_city,
            country: addressForm.shipping_countryCode,
            language: 'en',
            postalCode: addressForm.shipping_postalCode,
            stateOrProvince: addressForm.shipping_state
        };

        var validateBillingAddress = mtdAPICalls.validateAddress(billingAddress);
        var validateShippingAddress = mtdAPICalls.validateAddress(shippingAddress);
        res.json({
            billing: validateBillingAddress,
            shipping: validateShippingAddress
        });
        next();
    }
);

server.get('AJAXCustomerSearch',
    server.middleware.https,
    function (req, res, next) {
        var customerSearchInfo = {
            firstName: req.querystring.firstName !== undefined ? req.querystring.firstName : '',
            lastName: req.querystring.lastName !== undefined ? req.querystring.lastName : '',
            address: req.querystring.address !== undefined ? req.querystring.address : '',
            city: req.querystring.city !== undefined ? req.querystring.city : '',
            zipCode: req.querystring.zipCode !== undefined ? req.querystring.zipCode : '',
            phoneNumber: req.querystring.phone !== undefined ? req.querystring.phone : '',
            email: req.querystring.email !== undefined ? req.querystring.email : '',
            state: req.querystring.state !== undefined ? req.querystring.state : '',
            countryCode: req.querystring.countryCode !== undefined ? req.querystring.countryCode : ''
        };

        var foundCustomer = mtdAPICalls.existingCustomerSearch(customerSearchInfo);
        res.json({
            customers: foundCustomer
        });
        next();
    }
);

server.post('AjaxAssignShippingMethod',
    server.middleware.https,
    function (req, res, next) {
        var siteId = Site.getCurrent().getID();
        var basketId = req.form.basketId;
        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;
        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);
        var shippingMethod = req.form.shippingMethod;
        var basketJSON = epcotOcapiShopCalls.updateShippingMethod(accessToken, basketId, shippingMethod);
        basketJSON = epcotHelper.updateBasketProductsWithInventory(basketJSON, siteId);
        res.json(basketJSON);
        next();
    }
);

server.post('AjaxUpdateChargeOrder',
    server.middleware.https,
    function (req, res, next) {
        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;
        var siteId = Site.getCurrent().getID();
        var orderNumber = req.form.orderId;
        var orderStatus = req.form.status;
        var bmToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);
        var dataAccessToken = epcotOcapiHelper.getTokenClientCredentials();
        var clientId = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_CLIENT');
        var patchedOrder = epcotOcapiShopCalls.patchNoChargeOrder(bmToken, orderNumber, false, orderStatus, bmUser);
        Logger.info('patched No Charge Order Response : ' + JSON.stringify(patchedOrder));
        var orderUpdated = epcotOcapiDataCalls.updateOrderStatus(dataAccessToken, siteId, orderNumber, orderStatus, clientId);
        Logger.info('OCAPI CALL to update NoCharge Orders Status Response : ' + orderUpdated);
        if (orderUpdated) {
            var orderResponse = epcotOcapiShopCalls.getOrder(bmToken, orderNumber);
            Logger.info('Get Order Details after Updating Status :');
            Logger.info(JSON.stringify(orderResponse));
            var orderJSON = JSON.parse(orderResponse.text);
            var commerceOrderNumber = orderJSON.order_no;
            if (orderJSON.status === orderStatus && orderStatus !== 'cancelled' ) {
                orderJSON.error = false;
                var GTCStatusService = require('int_worldcheck/cartridge/scripts/services/GTCStatusService');
                var GTCStatusCheckApproved = false;
                var shippingGTCStatusCheck;                                                                                             
                var billingGTCStatusCheck = GTCStatusService.checkCompliance(orderJSON.billing_address.first_name,orderJSON.billing_address.last_name,orderJSON.billing_address.country_code);
                if(orderJSON.billing_address.first_name != orderJSON.shipments[0].shipping_address.first_name && orderJSON.billing_address.last_name != orderJSON.shipments[0].shipping_address.last_name){
                    shippingGTCStatusCheck = GTCStatusService.checkCompliance(orderJSON.shipments[0].shipping_address.first_name,orderJSON.shipments[0].shipping_address.last_name,orderJSON.shipments[0].shipping_address.country_code);
                }else {
                    shippingGTCStatusCheck = billingGTCStatusCheck;
                }

                if((billingGTCStatusCheck && billingGTCStatusCheck.isGTCApproved) && (shippingGTCStatusCheck && shippingGTCStatusCheck.isGTCApproved)){
                    GTCStatusCheckApproved = true;
                }
                if(GTCStatusCheckApproved){
                   var orderNote =  {
                        subject : "Trade Compliance Result - Shipping ",
                         text : "Decision : APPROVED, Timestamp : " + new Date().toISOString()
                    }
                    var updateOrderNote = epcotOcapiShopCalls.updateOrderNote(commerceOrderNumber, bmToken, orderNote);
                    var orderStatusPayload = {
                        c_globalComplianceCheckStatus :'APPROVED',
                    };
                    var orderStatusUpdate = epcotOcapiShopCalls.patchOrder(commerceOrderNumber, bmToken, orderStatusPayload);
                    if (orderStatus === 'open') {
                        orderUpdated = epcotOcapiDataCalls.updateOrderExportStatus(dataAccessToken, siteId, orderNumber, 'ready', clientId);
                        orderResponse = epcotOcapiShopCalls.getOrder(bmToken, orderNumber);
                        orderJSON = JSON.parse(orderResponse.text);
                        if (orderJSON.export_status === 'ready') {
                            orderJSON.error = false;
                        } else {
                            orderJSON.error = true;
                        }
                    }
                }else{
                    var orderNote =  {
                        subject : "Trade Compliance Result - Shipping ",
                         text : "Decision : MANUAL, Timestamp : " + new Date().toISOString()
                    }
                    var updateOrderNote = epcotOcapiShopCalls.updateOrderNote(commerceOrderNumber, bmToken, orderNote);
                    var orderStatusPayload = {
                        c_globalComplianceCheckStatus :'MANUAL'
                    };
                    var orderStatusUpdate = epcotOcapiShopCalls.patchOrder(commerceOrderNumber, bmToken, orderStatusPayload);
                    var OrderMgr = require('dw/order/OrderMgr');
                    var order = OrderMgr.getOrder(orderStatusUpdate.order_no);
                    var customerInfo = JSON.stringify({
                        customer:{
                            Shipping:{
                                Name: order.defaultShipment.shippingAddress.firstName +','+order.defaultShipment.shippingAddress.lastName,
                                AddressLine1: order.defaultShipment.shippingAddress.address1,
                                AddressLine2: order.defaultShipment.shippingAddress.address2,
                                City: order.defaultShipment.shippingAddress.city,
                                Province : order.defaultShipment.shippingAddress.stateCode,
                                Zipcode: order.defaultShipment.shippingAddress.postalCode
                            },
                            Billing:{
                                Name: order.billingAddress.firstName +','+order.billingAddress.lastName,
                                AddressLine1: order.billingAddress.address1,
                                AddressLine2: order.billingAddress.address2,
                                City: order.billingAddress.city,
                                Province : order.billingAddress.stateCode,
                                Zipcode: order.billingAddress.postalCode
                            }
                        }
                    });
                    var sendGTCMail = require('../scripts/helpers/emailHelper.js');
                    var billingGTCStatusResponse = billingGTCStatusCheck.response ? JSON.stringify(billingGTCStatusCheck.response): '';
                    var shippingGTCStatusResponse = shippingGTCStatusCheck.response ? JSON.stringify(shippingGTCStatusCheck.response) : '';
                    var sendReviewNotification = sendGTCMail.sendReviewNotification(order,customerInfo,billingGTCStatusResponse,shippingGTCStatusResponse);
                    orderJSON.error = true;
                }
            } else {
                if(orderStatus === 'cancelled'){
                    var orderNote =  {
                        subject : "Trade Compliance Result - Shipping ",
                         text : "Decision : NOT_APPLICABLE, Timestamp : " + new Date().toISOString()
                    }
                    var updateOrderNote = epcotOcapiShopCalls.updateOrderNote(commerceOrderNumber, bmToken, orderNote);
                    var orderStatusPayload = {
                        c_globalComplianceCheckStatus :'NOT_APPLICABLE'
                    };
                    var orderStatusUpdate = epcotOcapiShopCalls.patchOrder(commerceOrderNumber, bmToken, orderStatusPayload);
                    var HashMap = require('dw/util/HashMap');
                    var siteMap = new HashMap();
                    var sitesList = Site.getAllSites();
                    while (sitesList.length > 0) {
                        var siteObject = sitesList.shift();
                        var siteId = siteObject.ID;
                            siteMap.put(siteId,siteObject);
                    }
                    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
                    var keyPrefixObj = CustomObjectMgr.getCustomObject('epcotReplacementCustomObj',orderStatusUpdate.c_commerceStore ? orderStatusUpdate.c_commerceStore : '' );
                    var emailHelper = require('mtd_bm_customizations/cartridge/scripts/helpers/emailHelper');
                    if (keyPrefixObj && keyPrefixObj.custom.siteId && siteMap.containsKey(keyPrefixObj.custom.siteId)) {
                        var siteObject = siteMap.get(keyPrefixObj.custom.siteId);
                        var sendEmailFromSFCC = Site.current.getCustomPreferenceValue('sendEmailsFromSFCC');
                        if (sendEmailFromSFCC) {
                            emailHelper.sendOrderCancellationFormSFCC(commerceOrderNumber);
                        } else {
                            emailHelper.sendOrderCancellation(commerceOrderNumber, siteObject);
                        }
                    }
                }
                orderJSON.error = true;
            }
            res.json(orderJSON);
        } else {
        Logger.error('Order not Updated');
            res.json({
                error: 'Order Not Updated'
            });
        }
        next();
    }
);

server.post('AjaxAddNoChargeBasketOrItem',
    server.middleware.https,
    function (req, res, next) {
        // Get typical information needed
        Logger.info('AjaxAddNoChargeBasketOrItem');
        var siteId = Site.getCurrent().getID();
        var basketId = req.form.basketId;
        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;
        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);

        var currency = Site.getCurrent().getDefaultCurrency();
        Logger.info('add to basket currency : ' + currency);
        Logger.info('bm grant token => ' + accessToken);
        Logger.info('token in AjaxAddNoChargeBasketOrItem route, : ' + accessToken);

        // 1 - Retrieve Basket
        var currentBasketJSON = epcotOcapiShopCalls.getBasket(basketId, siteId, accessToken);
        var itemId = null;
        var hasNoCharge = null;
        itemId = req.form.itemId;
        var adjustmentType = null;
        var discountValue = 0;
        adjustmentType = req.form.adjustmentType;
        discountValue = req.form.discountValue;
        var appliedDiscount =  req.form.isDiscountApply;
        // 2 - Determine if the no charge is on 1 item or all items
        if (req.form.itemId) {
            // NO CHARGE SINGLE ITEM
            Logger.error('Add No Charge Basket => Single Item');
            itemId = req.form.itemId;

            var productJson = epcotOrderHelper.getProductJson(currentBasketJSON, itemId);
            hasNoCharge = epcotOrderHelper.checkForNoCharge(productJson);
            if (!hasNoCharge && !appliedDiscount) {
                currentBasketJSON = epcotOcapiShopCalls.addNoChargeToBasketItem(accessToken, basketId, itemId, adjustmentType, discountValue);
            } else {
                currentBasketJSON = epcotOcapiShopCalls.addNoChargeToBasketItem(accessToken, basketId, itemId, adjustmentType, discountValue);
            }
        } else {
            // NO CHARGE ENTIRE ORDER
            Logger.info('Add No Charge Basket => Entire Basket');
            var hasCoupon = epcotOrderHelper.checkForCoupon(currentBasketJSON, 'CSR_FREESHIP');
            if (!hasCoupon) {
                epcotOcapiShopCalls.addCoupon(accessToken, basketId, 'CSR_FREESHIP');
            }
            // Iterate over all the items
            var productsJson = epcotOrderHelper.getProductJson(currentBasketJSON); // will return an array if not passing a specific itemId

            // loop through each productJson, sending it off to the check for noCharge
            while (productsJson.length > 0) {
                var currentProductJson = productsJson.shift();
                hasNoCharge = epcotOrderHelper.checkForNoCharge(currentProductJson);
                if (!hasNoCharge) {
                    // since theres no charge, pull the item ID from the JSON and pass to the function
                    itemId = currentProductJson.item_id;
                    currentBasketJSON = epcotOcapiShopCalls.addNoChargeToBasketItem(accessToken, basketId, itemId, adjustmentType, discountValue);
                }
            }
        }

        res.json(currentBasketJSON);
        next();
    }
);

server.post('AjaxRemoveNoChargeBasketOrItem',
    server.middleware.https,
    function (req, res, next) {
        // Get typical information needed
        Logger.info('AjaxRemoveNoChargeBasketOrItem');
        var siteId = Site.getCurrent().getID();
        var basketId = req.form.basketId;
        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;
        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);

        var currency = Site.getCurrent().getDefaultCurrency();
        Logger.info('add to basket currency : ' + currency);
        Logger.info('bm grant token => ' + accessToken);
        Logger.info('token in AjaxNoChargeBasketNEW route, : ' + accessToken);

        // 1 - Retrieve Basket
        var currentBasketJSON = epcotOcapiShopCalls.getBasket(basketId, siteId, accessToken);
        var adjustmentId = null;
        var hasNoCharge = null;

        // 2 - Determine if we are removing the no charge on a single item or the entire order
        if (req.form.adjustmentId) {
            // REMOVE NO CHARGE FROM SINGLE ITEM VIA COUPON ID
            Logger.info('Remove No Charge Basket => Single Item');
            adjustmentId = req.form.adjustmentId;
            currentBasketJSON = epcotOcapiShopCalls.removePriceAdjustment(accessToken, basketId, adjustmentId);
        } else {
            // REMOVE NO CARGE FROM ENTIRE ORDER
            Logger.info('Remove No Charge Basket => Entire Basket');
            var hasCoupon = epcotOrderHelper.checkForCoupon(currentBasketJSON, 'CSR_FREESHIP');

            if (hasCoupon) {
                Logger.info('Removing coupon');
                // retrieve coupon code
                var couponCode = epcotOrderHelper.getCouponId(currentBasketJSON, 'CSR_FREESHIP');
                Logger.info('Coupon code : ' + couponCode);
                epcotOcapiShopCalls.removeCoupon(accessToken, basketId, couponCode);
            }

            // Iterate over all the items
            var productsJson = epcotOrderHelper.getProductJson(currentBasketJSON); // will return an array if not passing a specific itemId

            // loop through each productJson, sending it off to the check if theres a no charge on each product
            while (productsJson.length > 0) {
                var currentProductJson = productsJson.shift();
                hasNoCharge = epcotOrderHelper.checkForNoCharge(currentProductJson);
                if (hasNoCharge) {
                    // if there's a no charge
                    adjustmentId = epcotOrderHelper.getAdjustmentId(currentProductJson);
                    Logger.error('ADJUSTMENT ID => ' + adjustmentId);
                    currentBasketJSON = epcotOcapiShopCalls.removePriceAdjustment(accessToken, basketId, adjustmentId);
                }
            }
        }

        res.json(currentBasketJSON);
        next();
    }
);


server.get('OrderProcessedByReviewer',
    function(req,res,next){
        var Transaction = require('dw/system/Transaction');
        var OrderMgr = require('dw/order/OrderMgr');
        var Encoding = require('dw/crypto/Encoding');
        var encodedOrderNo = req.querystring.orderNo;
        var processedType = req.querystring.process;
        if(encodedOrderNo && processedType && (processedType === 'APPROVED' || processedType ===  'NOT_APPROVED')){
            var decodeOrderNoBytes = Encoding.fromBase64(encodedOrderNo);
            var decodeOrderNo = decodeOrderNoBytes.toString();
            var order = OrderMgr.getOrder(decodeOrderNo);
            if(!empty(order)){
                if(order && order.custom && order.custom.globalComplianceCheckStatus && order.custom.globalComplianceCheckStatus == 'MANUAL'){
                    if(processedType === 'APPROVED'){
                        Transaction.wrap(function(){
                            order.custom.globalComplianceCheckStatus = 'APPROVED';
                        })
                    } else{
                        Transaction.wrap(function(){
                            order.custom.globalComplianceCheckStatus = 'NOT_APPROVED';
                        })
                    }
                    res.render('/common/approve',{error:false});
                } else {
                    errorText = 'This order was already processed to approved or declined.'
                    res.render('/common/approve',{error:true,errorText:errorText});
                }
            } else {
                errorText = 'Please check, this order is not available.'
                res.render('/common/approve',{error:true,errorText:errorText});
            }
        } else {
            errorText = 'Please check, order number or order processing type is incorrect.'
            res.render('/common/approve',{error:true,errorText:errorText});
        }
        
    next();
});

server.post('AJAXGetSfdcCaseDetails',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('Fetch SFDC Case Details');
        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;
        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);
        var caseNumber = req.form.caseNumber;
        var basketId = req.form.basketId;
        var sfdcService = require('int_sfdc/cartridge/scripts/services/SFDCServices');
        var caseDetails = sfdcService.getSFDCCaseDetails(caseNumber);
        if(caseDetails.response && caseDetails.response.error != true){
            var basketJSON = epcotOcapiShopCalls.updateCasenumberToBasket(accessToken, basketId, caseNumber);
        }
        res.json(caseDetails);
        next();
    }
);

server.post('UpdateCaseNumberTOBasket',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('Update Case Number to Basket');
        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;
        var accessToken = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);
        var caseNumber = req.form.caseNumber;
        var basketId = req.form.basketId;
        var basketJSON = epcotOcapiShopCalls.updateCasenumberToBasket(accessToken, basketId, '');
        res.json(basketJSON);
        next();
    }
);


server.post('VerifyAddressByGoogle', function (req, res, next) {
    var addressForm = req.form;
    var billingAddress = {
        address1: addressForm.billing_address1,
        address2: addressForm.billing_address2,
        cityOrMunicipality: addressForm.billing_city,
        country: addressForm.billing_countryCode,
        language: 'en',
        postalCode: addressForm.billing_postalCode,
        stateOrProvince: addressForm.billing_state
    };

    var shippingAddress = {
        address1: addressForm.shipping_address1,
        address2: addressForm.shipping_address2,
        cityOrMunicipality: addressForm.shipping_city,
        country: addressForm.shipping_countryCode,
        language: 'en',
        postalCode: addressForm.shipping_postalCode,
        stateOrProvince: addressForm.shipping_state
    };

    var validateBillingAddress = epcotHelper.validateAddressUsingGoogle(billingAddress);
    var validateShippingAddress = epcotHelper.validateAddressUsingGoogle(shippingAddress);

    res.json({
        billing: validateBillingAddress,
        shipping: validateShippingAddress
    });
    next();
});

module.exports = server.exports();
