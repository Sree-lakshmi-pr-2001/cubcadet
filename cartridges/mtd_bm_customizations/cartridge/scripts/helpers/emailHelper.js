/**
 * Job Step Type Sends Order Confirmations for Epcot US / CA
 */
'use strict';
const Logger = require('dw/system/Logger').getLogger('EmailLogger', 'emailHelper.js');
const OrderMgr = require('dw/order/OrderMgr');
const Site = require('dw/system/Site');
const Transaction = require('dw/system/Transaction');
const SFMCHelpers = require('int_marketing_cloud/cartridge/scripts/util/helpers');
const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

function sendOrderConfirmation(orderNumber, site) {
    const order = OrderMgr.getOrder(orderNumber);
    const customerEmail = order.getCustomerEmail();
    const orderConfirmationEmailSent = order.custom.orderConfirmationEmailSent;
    Logger.info('sendOrderConfirmation : ' + orderNumber + ', siteId => ' + site.getID());
    Logger.info('orderConfirmationEmailSent : ' + orderConfirmationEmailSent);
    if (orderConfirmationEmailSent != 'W') {
        Logger.info('orderNumber #' + orderNumber + ', orderConfirmationEmailSent was not W, it was : `' + order.custom.orderConfirmationEmailSent + '`');
    } else {
        let siteId = site.getID();
        let customerServiceEmail = site.getCustomPreferenceValue('customerServiceEmail');
        Transaction.begin();
        let orderAsXML = SFMCHelpers.stripXmlNS(order.getOrderExportXML());
        Transaction.commit();
        let storeHomeLink = '';
        let capturedAmountCurrencyCode = order.getCurrencyCode();
        let capturedAmountDecimalValue = '';
        let capturedAmountValue = '';
        let requestJSON = generateJSON(customerServiceEmail, customerEmail, customerEmail, storeHomeLink, siteId, orderAsXML, capturedAmountCurrencyCode, capturedAmountDecimalValue, orderNumber, capturedAmountValue);
        // Logger.error(JSON.stringify(requestJSON));
        let success = sendOrderToSFMC(site, siteId, requestJSON,'order.confirmation');
        Logger.info('was ' + orderNumber + ' sent successfully? ' + success);
        // Logger.error('getAuthService result : ' + JSON.stringify(result.getResponseLogMessage()));
        if (success) {
            Transaction.wrap(function () {
                order.custom.orderConfirmationEmailSent = 'Y';
            });
        }
    }

    Logger.error('*** end sendOrderConfirmation : ' + customerEmail);
    return;
}

function sendOrderToSFMC(siteObject, siteId, requestJSON, requestPurpose) {
    let success = false;
    var authResult = getAuthService('marketingcloud.rest.auth', siteId).call();
    if (authResult.status === 'OK' && authResult.object) {
        //Logger.error('object : ' + JSON.stringify(authResult.object));
        if (authResult.object.accessToken) {
            let token = authResult.object.accessToken;
            Logger.info('token for sendOrderToSFMC : ' + token);

            // let msgSvc = getMsgService('marketingcloud.rest.messaging.send', siteObject, siteId, token, requestJSON);
            // Logger.error(JSON.stringify(requestJSON));
            // var callResponse = msgSvc.call();
            // Logger.error(callResponse);
            var msgResult = getMsgService('marketingcloud.rest.messaging.send', siteObject, siteId, token, requestJSON, requestPurpose).call();
            if (msgResult.status === 'OK' && msgResult.object) {
                if (msgResult.object && msgResult.object.isError == false && msgResult.object.responseObj && msgResult.object.responseObj.responses && msgResult.object.responseObj.responses[0].messages && msgResult.object.responseObj.responses[0].messages[0] == 'Queued') {
                    success = true;
                    Logger.info('successfully sent order confirmation');
                }
            }
        }
    }
    Logger.info('auth result from SFMC Service : ' + authResult);

    return success;
}

function getMsgService(serviceID, siteObject, siteId, accessToken, requestJSON, requestPurpose) {
    return LocalServiceRegistry.createService(serviceID, {
        /**
         * Create request for sending an email
         * @param {dw.svc.HTTPService} svc
         * @param {module:models/message~Message} message A message model instance to be sent to Marketing Cloud
         * @returns {string} Request body
         */
        createRequest: function (svc, message) {
            var svcURL = svc.getConfiguration().credential.URL;
            var svcPath = '/messaging/v1/messageDefinitionSends/{key}/send';

            Logger.info('MTD - rest siteId=> ' + siteId);

            var keyPrefix = siteObject.getCustomPreferenceValue('mcMessageKeyPrefix') ? siteObject.getCustomPreferenceValue('mcMessageKeyPrefix') : '';
            Logger.info(' MC keyPrefix : ' + keyPrefix);
            svcPath = svcPath.replace('{key}', 'key:' + keyPrefix + requestPurpose);
            // }

            // setAuthHeader(svc, accessToken);
            Logger.info('SFMC accessToken => ' + accessToken);
            svc.addHeader('Accept', 'application/json');
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('Authorization', 'Bearer ' + accessToken);
            Logger.info('SBD SFMC  - svcURL + svcPath : ' + svcURL + svcPath);
            svc.setURL(svcURL + svcPath);

            // return JSON.stringify(message);
            return JSON.stringify(requestJSON);;
        },
        /**
         * @param {dw.svc.HTTPService} svc
         * @param {dw.net.HTTPClient} client
         * @returns {{responseObj, isAuthError: boolean, isValidJSON: boolean}}
         */
        parseResponse: function (svc, client) {
            var obj = parseResponse(svc, client);
            // Location value is used for deliveryRecord check
            obj.location = client.getResponseHeader('Location');
            obj.requestId = client.getResponseHeader('X-Mashery-Message-ID');
            Logger.error('MTD - Message response: {0}', JSON.stringify(obj));
            return obj;
        },
        /**
         * Get Request Log Message
         *
         * @param {Object} request - request
         * @returns {Object} - request object to log
         */
        getRequestLogMessage: function (request) {
            console.log('getRequestLogMessage request => ' + JSON.stringify(request));
            return request;
        },
        /**
         * Get Response Log Message
         *
         * @param {Object} response - response object
         * @returns {string} result to log
         */
        getResponseLogMessage: function (response) {
            try {
                var msg = '';
                var headers = response.getResponseHeaders();
                var keySetArray = headers.keySet().toArray();
                for (var i = 0, keyLength = keySetArray.length; i < keyLength; i++) {
                    var header = keySetArray[i];
                    msg += header + ':';
                    var specificHeaders = headers.get(header);
                    for (var j = 0, headerLength = specificHeaders.length; j < headerLength; j++) {
                        var headerValue = specificHeaders[j];
                        msg += headerValue + ((j === headerLength - 1) ? '\n' : '');
                    }
                }
                msg += 'statusMessage:' + response.statusMessage + '\n';
                msg += 'statusCode:' + response.statusCode + '\n';
                msg += 'text:' + response.text + '\n';
                msg += 'errorText:' + response.errorText + '\n';
                return msg;
            } catch (e) {
                return response;
            }
        },
        mockCall: function ( /*svc, requestBody*/ ) {
            var obj = {
                "requestId": "f04952b5-49ae-4d66-90a4-c65be553db1f",
                "responses": [{
                    "recipientSendId": "f04952b5-49ae-4d66-90a4-c65be553db1f",
                    "hasErrors": false,
                    "messages": [
                        "Queued"
                    ]
                }]
            };
            return {
                statusCode: 202,
                statusMessage: 'Accepted',
                text: JSON.stringify(obj)
            };
        }
    });
}

function setAuthHeader(svc, accessToken) {
    Logger.error
    svc.setAuthentication('NONE');
    svc.addHeader('Authorization', 'Bearer ' + accessToken);
}

function getAuthService(serviceID, siteId) {
    return LocalServiceRegistry.createService(serviceID, {
        /**
         * Create request for service authentication
         * @param {dw.svc.HTTPService} svc
         * @throws {Error} Throws error when service credentials are missing
         */
        createRequest: function (svc /*, params*/ ) {
            Logger.info('create SFMC Auth Service Request');
            var origCredentialID = svc.getCredentialID() || svc.getConfiguration().getID();
            var credArr = origCredentialID.split('-');
            var credArrSiteID = credArr[credArr.length - 1];
            try {
                svc.setCredentialID(credArr[0] + '-' + siteId);
            } catch (e) {
                // site-specific credential doesn't exist, reset
                svc.setCredentialID(origCredentialID);
            }

            Logger.info('MC Connector credential ID: {0}', svc.getCredentialID());

            var svcCredential = svc.getConfiguration().credential;
            Logger.info('svcCredential => ' + JSON.stringify(svcCredential));
            Logger.info('svcCredential.user => ' + svcCredential.user);
            Logger.info('svcCredential.password => ' + svcCredential.password);
            if (empty(svcCredential.user) || empty(svcCredential.password)) {
                throw new Error('Service configuration requires valid client ID (user) and secret (password)');
            }

            var requestBody = {
                clientId: svcCredential.user,
                clientSecret: svcCredential.password
            };
            Logger.info('MTD auth - ' + JSON.stringify(requestBody));
            svc.setAuthentication('NONE');
            svc.addHeader('Accept', 'application/json');

            return JSON.stringify(requestBody);
        },
        /**
         * @param {dw.svc.HTTPService} svc
         * @param {dw.net.HTTPClient} client
         * @returns {Object}
         */
        parseResponse: function (svc, client) {
            var responseObj;
            Logger.info('parseResponse');
            try {
                responseObj = JSON.parse(client.text);
                if (responseObj && responseObj.accessToken && responseObj.expiresIn) {
                    var responseDate = new Date(client.getResponseHeader('Date') || null); // Ensure we pass valid string or null

                    // Set the millisecond timestamp values
                    responseObj.issued = responseDate.valueOf();
                    responseObj.expires = responseDate.valueOf() + (responseObj.expiresIn * 1000);
                    Logger.error('responseObj : ' + JSON.stringify(responseObj));
                }
            } catch (e) {
                responseObj = client.text;
                Logger.error('Unable to Authenticate: {0}', responseObj);
            }

            return responseObj;
        }
    });
}

function generateJSON(fromAddress, toAddress, subscriberKey, storeHomeLink, siteID, orderAsXML, capturedAmountCurrencyCode, capturedAmountDecimalValue, orderNumber, capturedAmountValue) {
    return {
        "From": {
            "Address": fromAddress
        },
        "To": {
            "Address": toAddress,
            "SubscriberKey": subscriberKey,
            "ContactAttributes": {
                "SubscriberAttributes": {
                    "StoreHomeLink": storeHomeLink,
                    "SiteID": siteID,
                    "OrderAsXML": orderAsXML,
                    "AffiliatePartnerID": null,
                    "AffiliatePartnerName": null,
                    "CapturedAmountCurrencyCode": capturedAmountCurrencyCode,
                    "CapturedAmountDecimalValue": capturedAmountDecimalValue,
                    "OrderNumber": orderNumber,
                    "CapturedAmountValue": capturedAmountValue
                }
            }
        },
        "OPTIONS": {
            "RequestType": "ASYNC"
        }
    };
}


function parseResponse(svc, client) {
    var isJSON = isResponseJSON(client);
    var parsedBody;

    if (isJSON) {
        try {
            parsedBody = JSON.parse(client.text);
        } catch (e) {
            parsedBody = client.text;
        }
    } else {
        parsedBody = client.text;
    }

    return {
        isValidJSON: isJSON,
        isError: client.statusCode >= 400,
        isAuthError: isValid401(client),
        responseObj: parsedBody,
        errorText: client.errorText
    };
}

/**
 * Check if 401 due to expired token
 * @param {dw.net.HTTPClient} client
 * @returns {boolean} true if expired auth token
 */
function isValid401(client) {
    var is401 = (client.statusCode === 401);
    var isFailureFromBadToken = false;
    var authResHeader = client.getResponseHeader('WWW-Authenticate');

    if (is401 && authResHeader) {
        isFailureFromBadToken = /^Bearer\s.+?invalid_token/.test(authResHeader);
    }

    return isFailureFromBadToken;
}

function isResponseJSON(client) {
    var contentTypeHeader = client.getResponseHeader('Content-Type');
    return contentTypeHeader && contentTypeHeader.split(';')[0].toLowerCase() === 'application/json';
}

function send(emailObj, template, context) {
    var Mail = require('dw/net/Mail');
    var email = new Mail();
    email.addTo(emailObj.to);
    email.setSubject(emailObj.subject);
    email.setFrom(emailObj.from);
    var temp = getRenderedHtml(context, template)
    email.setContent(temp, 'text/html', 'UTF-8');
    var result = email.send();
    return result;
}

function sendReviewNotification(order,customerInfo,billingGTCStatusResponse,shippingGTCStatusResponse) {
    var system = require('dw/system/System');
    var Site = require('dw/system/Site');
    var Bytes = require('dw/util/Bytes');
    var Encoding = require('dw/crypto/Encoding');
    var orderNoBytes = Bytes(order.orderNo);
    var encodedOrderNo = Encoding.toBase64(orderNoBytes);

    var subjectPrefix = '';
    if (system.getInstanceType() !== system.PRODUCTION_SYSTEM) {
        subjectPrefix += '(TEST) - ';
    }
    subjectPrefix += Site.getCurrent().getName() + ' - ';
    var customerServiceEmail = Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com';

    var emailObj = {
        to: Site.current.getCustomPreferenceValue('GTCNotificationEmail'),
        subject: subjectPrefix + 'Compliance Check Request',
        from: customerServiceEmail
    };
    var template = 'email/components/emailTemplate';
    var context = {
        orderId: order.orderNo,
        customerInfo: customerInfo,
        billingGTCStatusResponse: billingGTCStatusResponse,
        shippingGTCStatusResponse:shippingGTCStatusResponse,
        encodedOrderNo : encodedOrderNo,
        siteName: Site.getCurrent().getName()
    };

    return send(emailObj, template, context);

}

function sendOrderCancellation(orderNumber, site){
    var order = OrderMgr.getOrder(orderNumber);
    var customerEmail = order.getCustomerEmail();
        var siteId = site.getID();
        var customerName = order.customerName;
        var requestJSON = orderCancellationJson(customerEmail, orderNumber,customerName);
        // Logger.error(JSON.stringify(requestJSON));
        var success = sendOrderToSFMC(site, siteId, requestJSON,'order.declined');
        Logger.info('was ' + orderNumber + ' sent successfully? ' + success);
        // Logger.error('getAuthService result : ' + JSON.stringify(result.getResponseLogMessage()))
        Logger.info('*** end sendOrderCancellation : ' + customerEmail);
        return;
}


function orderCancellationJson(customerEmail,orderNumber,customerName){
    return {
        "To": {
            "Address": customerEmail,
            "SubscriberKey": customerEmail,
            "ContactAttributes": {
                "SubscriberAttributes": {
                    "currentOrderNo": orderNumber,
                    "customerName": customerName
                }
            }
        }
    }
}

/**
 * gets the render html for the given isml template
 * @param {Object} templateContext - object that will fill template placeholders
 * @param {string} templateName - the name of the isml template to render.
 * @returns {string} the rendered isml.
 */
function getRenderedHtml(templateContext, templateName) {
    var HashMap = require('dw/util/HashMap');
    var Template = require('dw/util/Template');
    var context = new HashMap();

    Object.keys(templateContext).forEach(function (key) {
        context.put(key, templateContext[key]);
    });

    var template = new Template(templateName);
    var temp = template.render(context).text;
    return template.render(context).text;
}


function sendOrderConfirmationFromSFCC(orderNumber) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var ProductFactory = require('app_storefront_base/cartridge/scripts/factories/product');
    var TotalsModel = require('org_mtd_ma/cartridge/models/totals');
    var URLUtils = require('dw/web/URLUtils');
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');
    var products = [];
    var product;
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderNumber)
    var email = order.customerEmail;
    var param ={};
    for each(var lineItem in order.allProductLineItems){
        param.pid = lineItem.productID
        var product = ProductFactory.get(param);
        var productImgUrl = product.images.large[0].url;
        product = {
            productName: lineItem.lineItemText,
            productNo: lineItem.productID,
            quantity: lineItem.quantity.value.toFixed(1),
            price: lineItem.price.value,
            productImgUrl : productImgUrl,
            productSalePrice: product.price.sales.formatted.slice(2),
        }
        products.push(product);
    }
    var totalsModel = new TotalsModel(order);
    var emailOrderObj = {
        orderNo: order.orderNo,
        customerFirstName: order.defaultShipment.shippingAddress.firstName,
        customerEmail: email,
        orderDate: order.creationDate,
        shippingAddress: order.defaultShipment.shippingAddress,
        billingAddress: order.billingAddress,
        products: products,
        shippingMethod: order.defaultShipment.shippingMethodID,
        commerceStore: order.custom.commerceStore, 
        }

    if(order.paymentInstrument.paymentMethod == 'NO_CHARGE') {
        var subTotal = 0;
        for each(var product in products){
            subTotal = subTotal + product.price;
        }
        emailOrderObj.payment = {
            paymentMethod: order.paymentInstrument.paymentMethod,
            paymentMethodName: order.paymentInstrument.paymentMethod,
            
        }

        emailOrderObj.subTotal = '$'+subTotal.toFixed(2);
        emailOrderObj.orderLevelDiscount = '-$'+subTotal.toFixed(2);
        emailOrderObj.orderTotalAmount = '$0.00';
        if(totalsModel.totalShippingCost){
            emailOrderObj.shippingCost = totalsModel.totalShippingCost.slice(1);
        }

        if(totalsModel.totalTax){
            emailOrderObj.salesTax = totalsModel.totalTax.slice(1);
        }

    } else if( order.paymentInstrument.paymentMethod ) {
        emailOrderObj.payment = {
            paymentMethod :order.paymentInstrument.paymentMethod,
            paymentMethodName: order.paymentInstrument.paymentMethod,
         }

         if(totalsModel.subTotal){
            emailOrderObj.subTotal = totalsModel.subTotal;
        }
        
        if(totalsModel.totalShippingCost){
            emailOrderObj.shippingCost = totalsModel.totalShippingCost;
        }

        if(totalsModel.totalTax){
            emailOrderObj.salesTax = totalsModel.totalTax;
        }

        if(totalsModel.orderLevelDiscountTotal){
            emailOrderObj.orderLevelDiscount =  totalsModel.orderLevelDiscountTotal.formatted;
        }

        if(totalsModel.shippingLevelDiscountTotal){
            emailOrderObj.shippingLevelDiscount =  totalsModel.shippingLevelDiscountTotal.formatted;
        }

        if(totalsModel.grandTotal){
            emailOrderObj.orderTotalAmount = totalsModel.grandTotal;
        }

    }
    var homePageUrl = URLUtils.abs('Home-Show').toString();
    var loginUrl = URLUtils.abs('Login-Show').toString();
    var siteName;
    var siteID = Site.getCurrent().getID();
    if(siteID == 'epcotus') {
        if(order.custom.commerceStore == 'CubCadetDotCom'){
            siteName = 'Cub Cadet'
            homePageUrl = homePageUrl.replace(siteID, "cubcadet");
            loginUrl = loginUrl.replace(siteID, "cubcadet");
            emailOrderObj.homePageUrl = homePageUrl;
            emailOrderObj.loginUrl = loginUrl;
        } else if(order.custom.commerceStore == 'TroyBiltDotCom'){
            siteName = 'Troy-Bilt'
            homePageUrl = homePageUrl.replace(siteID, "troybilt");
            loginUrl = loginUrl.replace(siteID, "troybilt");
            emailOrderObj.homePageUrl = homePageUrl;
            emailOrderObj.loginUrl = loginUrl;
        } else if( order.custom.commerceStore == 'MTDPartsDotCom'){
            siteName = 'MTD Parts'
            homePageUrl = homePageUrl.replace(siteID, "mtdparts");
            loginUrl = loginUrl.replace(siteID, "mtdparts");
            emailOrderObj.homePageUrl = homePageUrl;
            emailOrderObj.loginUrl = loginUrl;
        }
    }

    if(siteID == 'epcotca') {
        if(order.custom.commerceStore == 'CubCadetDotCA'){
            siteName = 'Cub Cadet'
            homePageUrl = homePageUrl.replace("epcotca", "cubcadetca");
            loginUrl = loginUrl.replace("epcotca", "cubcadetca");
            emailOrderObj.homePageUrl = homePageUrl;
            emailOrderObj.loginUrl = loginUrl;
        } else if(order.custom.commerceStore == 'TroyBiltDotCA'){
            siteName = 'Troy-Bilt'
            homePageUrl = homePageUrl.replace("epcotca", "troybiltca");
            loginUrl = loginUrl.replace("epcotca", "troybiltca");
            emailOrderObj.homePageUrl = homePageUrl;
            emailOrderObj.loginUrl = loginUrl;
        } else if( order.custom.commerceStore == 'MTDPartsDotCA'){
            siteName = 'MTD Parts'
            homePageUrl = homePageUrl.replace("epcotca", "mtdpartsca");
            loginUrl = loginUrl.replace("epcotca", "mtdpartsca");
            emailOrderObj.homePageUrl = homePageUrl;
            emailOrderObj.loginUrl = loginUrl;
        }
    }

    
    var emailObj = {
        to: email,
        subject: Resource.msgf('email.msg.order.header','email', null, siteName , order.orderNo),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com'
    };
    var template = 'email/components/orderConfirmation';
    var mailSent = send(emailObj, template, emailOrderObj);
    return mailSent;
}


function sendOrderCancellationFormSFCC(commerceOrderNumber){
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(commerceOrderNumber);
    var email = order.customerEmail;
    var emailOrderObj = {
            orderNo: order.orderNo,
            customerFullName: order.defaultShipment.shippingAddress.fullName,
            customerEmail: email,
            commerceStore: order.custom.commerceStore
        }

    var homePageUrl = URLUtils.abs('Home-Show').toString();
    var loginUrl = URLUtils.abs('Login-Show').toString();
    var homePageUrlArray = homePageUrl.split('Sites');
    var loginUrlArray = loginUrl.split('Sites');
    var siteID = Site.getCurrent().getID();
    if(siteID == 'epcotus') {
        if(order.custom.commerceStore == 'CubCadetDotCom'){
            homePageUrl = homePageUrlArray[0]+'Sites-cubcadet'+homePageUrlArray[1];
            loginUrl = loginUrlArray[0]+'Sites-cubcadet'+loginUrlArray[1];
            emailOrderObj.homePageUrl = homePageUrl;
            emailOrderObj.loginUrl = loginUrl;
        } else if(order.custom.commerceStore == 'TroyBiltDotCom'){
            homePageUrl = homePageUrlArray[0]+'Sites-troybilt'+homePageUrlArray[1];
            loginUrl = loginUrlArray[0]+'Sites-troybilt'+loginUrlArray[1];
            emailOrderObj.homePageUrl = homePageUrl;
            emailOrderObj.loginUrl = loginUrl;
        } else if( order.custom.commerceStore == 'MTDPartsDotCom'){
            homePageUrl = homePageUrlArray[0]+'Sites-mtdparts'+homePageUrlArray[1];
            loginUrl = loginUrlArray[0]+'Sites-mtdparts'+loginUrlArray[1];
            emailOrderObj.homePageUrl = homePageUrl;
            emailOrderObj.loginUrl = loginUrl;
        }
    }
    
    if(siteID == 'epcotca') {
        if(order.custom.commerceStore == 'CubCadetDotCA'){
            homePageUrl = homePageUrlArray[0]+'Sites-cubcadetca'+homePageUrlArray[1];
            loginUrl = loginUrlArray[0]+'Sites-cubcadetca'+loginUrlArray[1];
            emailOrderObj.homePageUrl = homePageUrl;
            emailOrderObj.loginUrl = loginUrl;
        } else if(order.custom.commerceStore == 'TroyBiltDotCA'){
            homePageUrl = homePageUrlArray[0]+'Sites-troybiltca'+homePageUrlArray[1];
            loginUrl = loginUrlArray[0]+'Sites-troybiltca'+loginUrlArray[1];
            emailOrderObj.homePageUrl = homePageUrl;
            emailOrderObj.loginUrl = loginUrl;
        } else if( order.custom.commerceStore == 'MTDPartsDotCA'){
            homePageUrl = homePageUrlArray[0]+'Sites-mtdpartsca'+homePageUrlArray[1];
            loginUrl = loginUrlArray[0]+'Sites-mtdpartsca'+loginUrlArray[1];
            emailOrderObj.homePageUrl = homePageUrl;
            emailOrderObj.loginUrl = loginUrl;
        }
    }
    
    var emailObj = {
        to: email,
        subject: Resource.msg('email.msg.order.notProcessed','email', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com'
    };
    var template = 'email/components/orderCancellation';
    var mailSent = send(emailObj, template, emailOrderObj);
    return mailSent;
}

module.exports = {
    sendOrderConfirmation : sendOrderConfirmation,
    sendReviewNotification : sendReviewNotification,
    sendOrderCancellation : sendOrderCancellation,
    sendOrderConfirmationFromSFCC: sendOrderConfirmationFromSFCC,
    sendOrderCancellationFormSFCC: sendOrderCancellationFormSFCC
}