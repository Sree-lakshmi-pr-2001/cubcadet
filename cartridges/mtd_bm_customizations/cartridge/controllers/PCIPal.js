/* global session */
'use strict';

var server = require('server');
var Logger = require('dw/system/Logger').getLogger('Pcipal', 'PCIPal.js');
var URLUtils = require('dw/web/URLUtils');
var epcotOcapiHelper = require('../scripts/helpers/epcotOcapiHelper.js');
var epcotOcapiShopCalls = require('../scripts/helpers/epcotOcapiShopCalls.js');
var epcotOcapiDataCalls = require('../scripts/helpers/epcotOcapiDataCalls.js');
var pciPalHelper = require('../scripts/helpers/pciPalHelper');
var mtdAPICalls = require('../scripts/helpers/mtdAPICalls');
var Site = require('dw/system/Site');

/**
 * format a string number to number of digits
 * @param {number} str - val of checkbox
 * @param {number} count - number of characters
 * @returns {string} 0 padded number string
 */
function formatNumber(str, count) {
    var str1 = str + '';
    if (str1.length < count) {
        for (var i = 0; i < (count - str1.length); i++) {
            str1 = '0' + str1;
        }
    }
    return str1;
}

/**
 * return a timestamp string
 * @returns {string} timestamp string
 */
function getTimestampForChase() {
    var date = new Date();
    var dateString = date.getFullYear() + formatNumber(date.getMonth() + 1, 2) + formatNumber(date.getDate(), 2) + formatNumber(date.getHours(), 2) + formatNumber(date.getMinutes(), 2) + formatNumber(date.getSeconds(), 2);
    Logger.error('dateString : ' + dateString);
    return dateString;
}

server.get('StartPayment',
    server.middleware.https,
    function (req, res, next) {
        var redirectUrl = null;
        var siteId = Site.getCurrent().getID();
        var basketId = req.querystring.basketId;
        var commerceStore = req.querystring.commerceStore;
        Logger.info('in StartPayment, basketId : ' + basketId + ', commerceStore : ' + commerceStore);
        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;
        var bmUserDetails = JSON.parse(session.custom.bmUserDetails);
        Logger.info('logging bmUserDetails ' + bmUserDetails);
        var token = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);
        var basketJSON = epcotOcapiShopCalls.getBasket(basketId, siteId, token);
        if (commerceStore === null || commerceStore === undefined || commerceStore === 'undefined') {
            // pull from the basket
            commerceStore = basketJSON.c_commerceStore;
            Logger.info('Commerce store was undefined - setting as : ' + commerceStore);
        }
        var authOrderId = mtdAPICalls.getNextAuthOrderId();
        Logger.info('authOrderId : ' + authOrderId);
        var pciPalToken = pciPalHelper.getPCIPalToken();
        var pciPalSettingMap = mtdAPICalls.getPCIPalSettings(commerceStore);
        var merchantId = pciPalSettingMap.get('MerchantID');
        var safetechMerchantID = pciPalSettingMap.get('SafetechMerchantID');
        var websiteShortName = pciPalSettingMap.get('WebsiteShortName');

        Logger.info('Getting user setting - New Voice Media ID');
        var userExtension = epcotOcapiHelper.getUserSetting(bmUserDetails, 'New Voice Media ID');

        var pciPayload = pciPalHelper.getPCIPalPayload(basketJSON, authOrderId, userExtension, merchantId, safetechMerchantID, websiteShortName);
        Logger.info(JSON.stringify(pciPayload));

        var pciPalDetails = pciPalHelper.getPCIPalIFrameDetails(pciPalToken, pciPayload);

        if (pciPalDetails.success) {
            redirectUrl = URLUtils.url('PCIPal-ShowPaymentPage',
                'basketId', basketId,
                'iframeUrl', pciPalDetails.iframeUrl,
                'sessionGuid', pciPalDetails.sessionGuid,
                'agentAccessToken', pciPalDetails.agentAccessToken,
                'iframeUrl', pciPalDetails.iframeUrl,
                'providerSessionGuid', pciPalDetails.providerSessionGuid,
                'paymentFormUrl', pciPalDetails.paymentFormUrl,
                'agentRefreshToken', pciPalDetails.agentRefreshToken,
                'success', pciPalDetails.success,
                'commerceStore', commerceStore
            );

            res.redirect(redirectUrl);
        } else {
            redirectUrl = URLUtils.url('EpcotOrderConsumer-PaymentsAndDiscounts',
                'commerceStore', commerceStore,
                'basketId', basketId,
                'pciPalError', pciPalDetails.errorMessage
            );
            res.redirect(redirectUrl);
        }
        next();
    }
);

server.get('ShowPaymentPage',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('in ShowPaymentPage');

        res.render('checkout/pcipal', {
            basketId: req.querystring.basketId,
            iframeUrl: req.querystring.iframeUrl,
            sessionGuid: req.querystring.sessionGuid,
            agentAccessToken: req.querystring.agentAccessToken,
            providerSessionGuid: req.querystring.providerSessionGuid,
            paymentFormUrl: req.querystring.paymentFormUrl,
            agentRefreshToken: req.querystring.agentRefreshToken,
            success: req.querystring.success,
            commerceStore: req.querystring.commerceStore
        });
        next();
    }
);

server.post('CompletePayment',
    server.middleware.https,
    function (req, res, next) {
        var commerceStore = req.form.commerceStore;
        var redirectUrl = null;
        // verify pcipal data
        var siteId = Site.getCurrent().getID();
        var basketId = req.form.basketId;
        var sessionGuid = req.form.nvmSessionUid;
        Logger.info('In CompletePayment basketId : ' + basketId);
        Logger.info('In CompletePayment sessionGuid : ' + sessionGuid);
        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;
        var token = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);
        var basketJSON = epcotOcapiShopCalls.getBasket(basketId, siteId, token);
        if (basketJSON == null) {
            res.render('checkout/emptyBasket', {});
        } else {
            // PAYMENT STATUS IS ONLY AVAILABLE FOR UP TO 15 MINS WHEN THE TRANSACTION HAS BEEN COMPLETED
            var paymentStatus = pciPalHelper.getPaymentStatus(sessionGuid);
            basketJSON = epcotOcapiShopCalls.getBasket(basketId, siteId, token);
            if (commerceStore === null || commerceStore === undefined || commerceStore === 'undefined') {
                // pull from the basket
                commerceStore = basketJSON.c_commerceStore;
                Logger.info('Commerce store was undefined - setting as : ' + commerceStore);
            }
            if (paymentStatus.approvalCode === 'APPROVED') {
                Logger.info('payment for ' + basketId + ' was approved');

                basketJSON = epcotOcapiShopCalls.getBasket(basketId, siteId, token);

                var paymentPayloadPatch = {
                    c_chaseAutoDecisionResponse: paymentStatus.chaseData.chaseAutoDecisionResponse,
                    c_chaseCustomerReferenceNumber: paymentStatus.chaseData.chaseCustomerReferenceNumber,
                    c_chaseFraudStatusCode: paymentStatus.chaseData.chaseFraudStatusCode,
                    c_chaseMerchantId: paymentStatus.chaseData.chaseMerchantId,
                    c_chaseRespCode: paymentStatus.chaseData.chaseRespCode,
                    c_chaseRespDateTime: getTimestampForChase(),
                    c_chaseTxRefIdx: paymentStatus.chaseData.chaseTxRefIdx,
                    c_chaseTxRefNum: paymentStatus.chaseData.chaseTxRefNum,
                    c_PaymentSource: 'ocapi',
                    c_chaseApprovalStatus: paymentStatus.chaseData.approvalStatus,
                    c_chaseCardBrand: paymentStatus.chaseData.chaseCardBrand,
                    c_chaseTransactionId: paymentStatus.chaseData.chaseTransactionId,
                    c_chaseExpirationDate: paymentStatus.chaseData.chaseExpirationDate
                };

                var paymentPayload = {
                    amount: basketJSON.order_total,
                    payment_method_id: 'PCIPAL'
                };

                Logger.info('payment payload : ' + JSON.stringify(paymentPayload));

                basketJSON = epcotOcapiShopCalls.submitPayment(basketId, token, 'PCIPAL', basketJSON.order_total, paymentPayload);

                var orderResponse = epcotOcapiShopCalls.submitOrder(token, basketJSON);

                var orderJSON = JSON.parse(orderResponse.text);
                Logger.info('Response After Submitting PCIPAL Order: ' + orderJSON);
                var commerceOrderNumber = null;
                if (orderJSON && orderJSON.order_no) {
                    commerceOrderNumber = orderJSON.order_no;
                    Logger.info(' Order Number After Submitting PCIPAL, order # = ' + commerceOrderNumber);
                    var customOrderProperties = {
                        c_orderConfirmationEmailSent: 'N',
                        c_globalComplianceCheckStatus :'PENDING',
                        c_SfdcCaseNumber: basketJSON.c_SfdcCaseNumber ? basketJSON.c_SfdcCaseNumber : '',
                        c_isSFDCSynced: basketJSON.c_SfdcCaseNumber ? 'N' : ''

                    };
                    orderResponse = epcotOcapiShopCalls.patchOrderWithCustomProperties(token, commerceOrderNumber, customOrderProperties);
                    var clientId = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_CLIENT');
                    var dataAccessToken = epcotOcapiHelper.getTokenClientCredentials();
                    Logger.info('MTD - orderJSON && orderJSON.order_no true');

                    // call payment transaction patch
                    if (orderJSON.payment_instruments && orderJSON.payment_instruments.length > 0) {
                        Logger.info('MTD - orderJSON.payment_instruments exists');
                        var paymentInstrumentId = orderJSON.payment_instruments[0].payment_instrument_id;
                        var paymentPatchResult = epcotOcapiDataCalls.patchOrderPaymentTransaction(dataAccessToken, siteId, commerceOrderNumber, paymentInstrumentId, paymentPayloadPatch, clientId);
                        Logger.info('paymentPatchResult : ' + JSON.stringify(paymentPatchResult));
                        // epcotOcapiShopCalls.patchOrderPaymentTransaction(commerceOrderNumber, token, paymentInstrumentId, paymentPayloadPatch);

                        // https://{{sfcc_ocapi_host}}/s/-/dw/data/{{sfcc_ocapi_version}}/sites/{{sfcc_ocapi_site}}/orders/{{sfcc_ocapi_order_number}}/payment_instruments/{{sfcc_ocapi_payment_instrument_id}}/transaction?client_id={{sfcc_ocapi_client_id}}
                    } else {
                        Logger.error('MTD - orderJSON.payment_instruments does not exist');
                    }
                    var orderStatus = 'new';

                    var orderUpdated = epcotOcapiDataCalls.updateOrderStatus(dataAccessToken, siteId, commerceOrderNumber, orderStatus, clientId);
                    Logger.info('order status update response : ' + JSON.stringify(orderUpdated));

                    var orderResponse = epcotOcapiShopCalls.getOrder(token, commerceOrderNumber);
                        Logger.info(JSON.stringify(orderResponse));
                        if(orderResponse && orderResponse.text){
                            var orderJSON = JSON.parse(orderResponse.text);
                            var GTCStatusService = require('int_worldcheck/cartridge/scripts/services/GTCStatusService');
                            
                            var GTCStatusCheck = GTCStatusService.checkCompliance(orderJSON.billing_address.first_name,orderJSON.billing_address.last_name,orderJSON.billing_address.country_code);
                            if (GTCStatusCheck && GTCStatusCheck.isGTCApproved) {
                                var orderNote =  {
                                    subject : "Trade Compliance Result - Shipping ",
                                     text : "Decision : APPROVED, Timestamp : " + new Date().toISOString()
                                }
                                var updateOrderNote = epcotOcapiShopCalls.updateOrderNote(commerceOrderNumber, token, orderNote);
                                var orderStatusPayload = {
                                    c_globalComplianceCheckStatus :'APPROVED'
                                };
                                var orderStatusUpdate = epcotOcapiShopCalls.patchOrder(commerceOrderNumber, token, orderStatusPayload);
                                orderUpdated = epcotOcapiDataCalls.updateOrderExportStatus(dataAccessToken, siteId, commerceOrderNumber, 'ready', clientId);
                                Logger.info('order export status update response : ' + JSON.stringify(orderUpdated));
                            } else {
                                var orderNote =  {
                                    subject : "Trade Compliance Result - Shipping ",
                                     text : "Decision : MANUAL, Timestamp : " + new Date().toISOString()
                                }
                                var updateOrderNote = epcotOcapiShopCalls.updateOrderNote(commerceOrderNumber, token, orderNote);
                                var orderStatusPayload = {
                                    c_globalComplianceCheckStatus :'MANUAL'
                                };
                                var orderStatusUpdate = epcotOcapiShopCalls.patchOrder(commerceOrderNumber, token, orderStatusPayload);
                                var OrderMgr = require('dw/order/OrderMgr');
                                var order = OrderMgr.getOrder(orderStatusUpdate.order_no);
                                var sendGTCMail = require('../scripts/helpers/emailHelper.js');
                                var sendReviewNotification = sendGTCMail.sendReviewNotification(order);
                            }
                        } else{
                            Logger.error('MTD - orderJSON && orderJSON.order_no false');
                        }
            
                } else {
                    Logger.error('MTD - orderJSON && orderJSON.order_no false');
                }

                // do we need to update the order w/ the commerce store?

                // var commerceOrderNumber = JSON.parse(orderResponse.text).order_no;
                Logger.info('Pcipal Order placed , order # = ' + commerceOrderNumber);

                redirectUrl = URLUtils.url('EpcotOrderConsumer-OrderView',
                    'commerceOrderNumber', commerceOrderNumber
                );

                res.redirect(redirectUrl);
            } else {
                Logger.info('payment for ' + basketId + ' was not approved');
                Logger.info('paymentStatus :');
                Logger.info(paymentStatus);
                Logger.info(JSON.stringify(paymentStatus));

                if (paymentStatus.approvalCode === 'REVERSAL') {
                    Logger.info('reverse order > ' + paymentStatus.chaseData.chaseCustomerReferenceNumber);
                    var reversalPayload = {
                        MtdOrderID: paymentStatus.chaseData.chaseCustomerReferenceNumber,
                        TxRefNum: paymentStatus.chaseData.chaseTxRefNum,
                        ChaseOrderID: paymentStatus.chaseData.orderId,
                        MerchantID: paymentStatus.chaseData.chaseMerchantId,
                        CardBrand: paymentStatus.chaseData.chaseBrand
                    };
                    Logger.info('reversalPayload=>');
                    Logger.info(JSON.stringify(reversalPayload));

                    var reversal = mtdAPICalls.reverseChaseAuthorization(reversalPayload);
                    Logger.info('reversal : ' + JSON.stringify(reversal));
                } else {
                    Logger.info('payment decline no need to reverse order > ' + paymentStatus.chaseData.chaseCustomerReferenceNumber);
                }

                redirectUrl = URLUtils.url('EpcotOrderConsumer-PaymentsAndDiscounts',
                    'basketId', basketId,
                    'pciPalError', 'Payment declined',
                    'commerceStore', commerceStore
                );
                res.redirect(redirectUrl);
            }
        }
        next();
    }
);

server.post('ReturnToDiscounts',
    server.middleware.https,
    function (req, res, next) {
        var redirectUrl = null;
        // verify pcipal data
        var siteId = Site.getCurrent().getID();
        var basketId = req.form.basketId;
        var commerceStore = req.form.commerceStore;
        var sessionGuid = req.form.nvmSessionUid;
        Logger.info(' ReturnToDiscounts basketId : ' + basketId);
        Logger.info('ReturnToDiscounts sessionGuid : ' + sessionGuid);
        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;
        var token = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);
        var basketJSON = epcotOcapiShopCalls.getBasket(basketId, siteId, token);

        if (basketJSON == null) {
            // if basket is empty
            res.render('checkout/emptyBasket', {});
        } else if (sessionGuid) {
            // if sessionGuid is good
            var paymentStatus = pciPalHelper.getPaymentStatus(sessionGuid);
            Logger.info('paymentStatus : ' + JSON.stringify(paymentStatus));
            Logger.info('paymentStatus.reversalRequired : ' + paymentStatus.reversalRequired);
            // reversalRequired = true;
            // fraudStatus = true;

            if (paymentStatus.approvalCode === 'REVERSAL' || paymentStatus.approvalCode === 'APPROVED') {
                Logger.info('payment for ' + basketId + ' needs reversed since we are going back to the payment page');
                Logger.info('paymentStatus :');
                Logger.info(paymentStatus);
                Logger.info(JSON.stringify(paymentStatus));

                var pciPalError = '';
                if (paymentStatus.approvalCode === 'REVERSAL') {
                    pciPalError = 'Payment Declined';
                }

                var reversalPayload = {
                    MtdOrderID: paymentStatus.chaseData.chaseCustomerReferenceNumber,
                    TxRefNum: paymentStatus.chaseData.chaseTxRefNum,
                    ChaseOrderID: paymentStatus.chaseData.orderId,
                    MerchantID: paymentStatus.chaseData.chaseMerchantId,
                    CardBrand: paymentStatus.chaseData.chaseBrand
                };
                Logger.info('reversalPayload=>');
                Logger.info(JSON.stringify(reversalPayload));

                var reversal = mtdAPICalls.reverseChaseAuthorization(reversalPayload);
                Logger.info('reversal : ' + JSON.stringify(reversal));

                redirectUrl = URLUtils.url('EpcotOrderConsumer-PaymentsAndDiscounts',
                    'basketId', basketId,
                    'pciPalError', pciPalError,
                    'commerceStore', commerceStore
                );
                res.redirect(redirectUrl);
            } else {
                Logger.info('no reversal required');
                redirectUrl = URLUtils.url('EpcotOrderConsumer-PaymentsAndDiscounts',
                    'basketId', basketId,
                    'commerceStore', commerceStore,
                    'pciPalError', null
                );
                res.redirect(redirectUrl);
            }
        } else {
            // sessionGuid is empty
            // Logger.error('payment for ' + basketId + ' was not approved');

            redirectUrl = URLUtils.url('EpcotOrderConsumer-PaymentsAndDiscounts',
                'basketId', basketId,
                'commerceStore', commerceStore,
                'pciPalError', null
            );
            res.redirect(redirectUrl);
        }
        next();
    }
);

module.exports = server.exports();
