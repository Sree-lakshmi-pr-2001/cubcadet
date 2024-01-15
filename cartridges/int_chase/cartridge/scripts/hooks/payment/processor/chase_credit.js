'use strict';

var collections = require('*/cartridge/scripts/util/collections');

var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentStatusCodes = require('dw/order/PaymentStatusCodes');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var Status = require('dw/system/Status');
var ChaseModel = require('int_chase/cartridge/scripts/models/Chase');
var NewOrderRequest = require('int_chase/cartridge/scripts/helpers/NewOrderRequest');
var SafetechFraudAnalysisRequest = require('int_chase/cartridge/scripts/helpers/SafetechFraudAnalysisRequest');
var Util = require('~/cartridge/scripts/helpers/Util');
var Logger = require('dw/system/Logger');

/**
 * Verifies that entered credit card information is a valid card. If the information is valid a
 * credit card payment instrument is created
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @return {Object} returns an error object
 */
function Handle(basket, paymentInformation) {
    var currentBasket = basket;
    var cardErrors = {};
    var cardNumber = paymentInformation.cardNumber.value;
    var cardSecurityCode = paymentInformation.securityCode.value;
    var expirationMonth = paymentInformation.expirationMonth.value;
    var expirationYear = paymentInformation.expirationYear.value;
    var serverErrors = [];
    var creditCardStatus;

    var cardType = paymentInformation.cardType.value;
    var paymentCard = PaymentMgr.getPaymentCard(cardType);

    if (!paymentInformation.creditCardToken) {
        if (paymentCard) {
            creditCardStatus = paymentCard.verify(
                expirationMonth,
                expirationYear,
                cardNumber,
                cardSecurityCode
            );
        } else {
            cardErrors[paymentInformation.cardNumber.htmlName] =
                Resource.msg('error.invalid.card.number', 'creditCard', null);

            return { fieldErrors: [cardErrors], serverErrors: serverErrors, error: true };
        }

        if (creditCardStatus.error) {
            collections.forEach(creditCardStatus.items, function (item) {
                switch (item.code) {
                    case PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER:
                        cardErrors[paymentInformation.cardNumber.htmlName] =
                            Resource.msg('error.invalid.card.number', 'creditCard', null);
                        break;

                    case PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE:
                        cardErrors[paymentInformation.expirationMonth.htmlName] =
                            Resource.msg('error.expired.credit.card', 'creditCard', null);
                        cardErrors[paymentInformation.expirationYear.htmlName] =
                            Resource.msg('error.expired.credit.card', 'creditCard', null);
                        break;

                    case PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE:
                        cardErrors[paymentInformation.securityCode.htmlName] =
                            Resource.msg('error.invalid.security.code', 'creditCard', null);
                        break;
                    default:
                        serverErrors.push(
                            Resource.msg('error.card.information.error', 'creditCard', null)
                        );
                }
            });

            return { fieldErrors: [cardErrors], serverErrors: serverErrors, error: true };
        }
    }

    Transaction.wrap(function () {
        var paymentInstruments = currentBasket.getPaymentInstruments();

        collections.forEach(paymentInstruments, function (item) {
            currentBasket.removePaymentInstrument(item);
        });

        var paymentInstrument = currentBasket.createPaymentInstrument(
            PaymentInstrument.METHOD_CREDIT_CARD, currentBasket.totalGrossPrice
        );

        paymentInstrument.setCreditCardHolder(currentBasket.billingAddress.fullName);
        paymentInstrument.setCreditCardNumber(cardNumber);
        paymentInstrument.setCreditCardType(cardType);
        paymentInstrument.setCreditCardExpirationMonth(expirationMonth);
        paymentInstrument.setCreditCardExpirationYear(expirationYear);
        if (paymentInformation.creditCardToken) {
            paymentInstrument.setCreditCardToken(
                paymentInformation.creditCardToken
            );
        }
    });

    return { fieldErrors: cardErrors, serverErrors: serverErrors, error: false };
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @param {dw.order.Order} order - Order object
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor, order) {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;
    var safetechErrorMessage = null;

    try {
        // Create payment Data Object
        var billingAddress = order.billingAddress;
        var shippingAddress = order.defaultShipment.shippingAddress;
        var paymentData = NewOrderRequest.getPaymentData(order, paymentInstrument, billingAddress, shippingAddress);
        var paymentDataJson = {
            customerRefNum: paymentData.customerRefNum ? paymentData.customerRefNum : '',
            cardNumber: paymentData.cardNumber ? '****' + paymentData.cardNumber.substr(paymentData.cardNumber.length - 4) : '',
            cardExpiration: paymentData.cardExpiration ? paymentData.cardExpiration : '',
    
            fullName: paymentData.fullName ? paymentData.fullName : '',
            address1: paymentData.address1 ? paymentData.address1 : '',
            address2: paymentData.address2 ? paymentData.address2 : null,
            city: paymentData.city ? paymentData.address1 : '',
            state: paymentData.state ? paymentData.state : '',
            zip: paymentData.zip ? paymentData.zip : '',
            countryCode: paymentData.countryCode ? paymentData.countryCode : '',
            phone: paymentData.phone ? paymentData.phone : '',
            amount: paymentData.amount ? paymentData.amount : '',
            orderId: paymentData.orderId ? paymentData.orderId : '',
            customerEmail: paymentData.customerEmail ? paymentData.customerEmail : '',
            destFullName: paymentData.destFullName ? paymentData.destFullName : '',
            destAddress1: paymentData.destAddress1 ? paymentData.destAddress1 : '',
            destAddress2: paymentData.destAddress2 ? paymentData.destAddress2 : null,
            destCity: paymentData.destCity ? paymentData.destCity : '',
            destState: paymentData.destState ? paymentData.destState : '',
            destZip: paymentData.destZip ? paymentData.destZip : '',
            destCountryCode: paymentData.destCountryCode ? paymentData.destCountryCode : '',
            destPhone: paymentData.destPhone ? paymentData.destPhone : '' };

        if (paymentData.cardType) {
            paymentDataJson.cardType = paymentData.cardType ? paymentData.cardType : '';
        }

        if (paymentData.cvv) {
            paymentDataJson.cvv = '***Some CVV***';
        }

        Logger.error('Chase authorize payment data for paymentProcessor ' + paymentProcessor.ID + ' : ' + JSON.stringify(paymentDataJson));
        // Make authorization call
        var authResult = ChaseModel.authorize(paymentData, false, order);
        if (authResult.status === Status.OK) {
            var response = authResult.getDetail('response');
            var fraudStatusCode = null;
            var autoDecisionResponse = null;
            if (response.fraudAnalysisResponse) {
                fraudStatusCode = response.fraudAnalysisResponse.fraudStatusCode;
                autoDecisionResponse = response.fraudAnalysisResponse.autoDecisionResponse;
            }

            Transaction.wrap(function () {
                // we need to save card token for new card
                if (!paymentInstrument.creditCardToken && response.customerRefNum) {
                    paymentInstrument.creditCardToken = response.customerRefNum; // eslint-disable-line no-param-reassign
                }

                var transaction = paymentInstrument.paymentTransaction;
                transaction.setTransactionID(orderNumber);
                transaction.setPaymentProcessor(paymentProcessor);
                transaction.custom.chaseTxRefNum = response.txRefNum;
                transaction.custom.chaseTxRefIdx = response.txRefIdx;
                transaction.custom.chaseRespDateTime = response.respDateTime;
                transaction.custom.chaseApprovalStatus = response.approvalStatus;
                transaction.custom.chaseRespCode = response.respCode;
                transaction.custom.chaseCustomerReferenceNumber = response.customerRefNum;
                transaction.custom.chaseMerchantId = ChaseModel.VALUE.MERCHANT_ID;
                transaction.custom.chaseFraudStatusCode = fraudStatusCode;
                transaction.custom.chaseAutoDecisionResponse = autoDecisionResponse;
            });
            var approvalStatus = response.approvalStatus;

            // Order is approved and for review
            if (approvalStatus === '1' && autoDecisionResponse === 'R') {
                var Order = require('dw/order/Order');
                Logger.error('# ' + order.orderNo + ' Chase authorize approvalStatus is ' + approvalStatus +' and autoDecisionResponse is '+ autoDecisionResponse +' , So order sent for review');
                Transaction.wrap(function () {
                    order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
                    order.custom.fraudManualReviewStatus = 'sentToReview'; // eslint-disable-line
                });
            } else if (approvalStatus !== '1') { // Card was declined
                Logger.error('# ' + order.orderNo + ' Chase authorize approvalStatus is ' + approvalStatus + ',So CC wasn\'t approved');
                throw new Error('CC wasn\'t approved');
            } else if ((fraudStatusCode && fraudStatusCode !== 'A000') || (autoDecisionResponse && autoDecisionResponse !== 'A')) {
                // Void authorization due to fraud decline
                var COHelpers = require('org_mtd/cartridge/scripts/checkout/checkoutHelpers');
                COHelpers.makePaymentVoid(orderNumber, paymentInstrument);

                // Get safetech error from the content asset
                var ContentMgr = require('dw/content/ContentMgr');
                var safetechErrorMessageAsset = ContentMgr.getContent('safetech-declined-order-message');
                safetechErrorMessage = (safetechErrorMessageAsset) ? safetechErrorMessageAsset.custom.body.markup : null;
                Transaction.wrap(function () {
                    order.custom.fraudManualReviewStatus = 'reviewDeclinedProcessed';
                });
                Logger.error('# ' + order.orderNo + ' Chase authorize fraudStatusCode is ' + fraudStatusCode +  ' and autoDecisionResponse '+ autoDecisionResponse + ' ,So CC was approved, but declined for fraud.');
                throw new Error('CC was approved, but declined for fraud.');
            }
            Logger.error('Chase Authorization Approved for the order: #' + order.orderNo);
        } else {
            Logger.error('Issue with Chase service');
            throw new Error('Issue with Chase service');
        }
    } catch (e) {
        error = true;
        serverErrors.push(
            Resource.msg('error.technical', 'checkout', null)
        );
    }

    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error, errorMessage: safetechErrorMessage };
}

/**
 * AuthorizeTD. Check fraud by safetech.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @param {dw.order.Order} order - Order object
 * @return {Object} returns an error object
 */
function AuthorizeTD(orderNumber, paymentInstrument, paymentProcessor, order) {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;
    var safetechErrorMessage = null;

    try {
        // Don't check fraud if Safetech is disabled in custom preferences
        if (!Util.VALUE.SAFETECH_ENABLED) {
            return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error, errorMessage: safetechErrorMessage };
        }

        // Create payment Data Object
        var billingAddress = order.billingAddress;
        var shippingAddress = order.defaultShipment.shippingAddress;
        var paymentData = SafetechFraudAnalysisRequest.getPaymentData(order, paymentInstrument, billingAddress, shippingAddress);
        Logger.error('Chase authorize payment data for paymentProcessor '+ paymentProcessor.ID +' : ' + JSON.stringify(paymentData));
        // Make checking safetech fraud call
        var authResult = ChaseModel.safetechFraudAnalysis(paymentData, false, order);
        if (authResult.status === Status.OK) {
            var response = authResult.getDetail('response');
            var fraudStatusCode = null;
            var autoDecisionResponse = null;
            if (response.fraudAnalysisResponse) {
                fraudStatusCode = response.fraudAnalysisResponse.fraudStatusCode;
                autoDecisionResponse = response.fraudAnalysisResponse.autoDecisionResponse;
            }

            Transaction.wrap(function () {
                var transaction = paymentInstrument.paymentTransaction;
                transaction.custom.chaseFraudStatusCode = fraudStatusCode;
                transaction.custom.chaseAutoDecisionResponse = autoDecisionResponse;
            });

            // Declined for fraud
            var approvalStatus = response.approvalStatus;
            // Order is approved and for review
            if (approvalStatus === '1' && autoDecisionResponse === 'R') {
                var Order = require('dw/order/Order');
                Logger.error('# ' + order.orderNo + ' Safetech FraudAnalysis Request approvalStatus is ' + approvalStatus + ' and autoDecisionResponse is '+ autoDecisionResponse +', So order sent for review');
                Transaction.wrap(function () {
                    order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
                    order.custom.fraudManualReviewStatus = 'sentToReview'; // eslint-disable-line
                });
            } else if (approvalStatus !== '1') {
                Logger.error('# ' + order.orderNo + ' Safetech FraudAnalysis Request approvalStatus is ' + approvalStatus + ' ,So CC wasn\'t approved');
                throw new Error('CC wasn\'t approved');
            } else if ((fraudStatusCode && fraudStatusCode !== 'A000') || (autoDecisionResponse && autoDecisionResponse !== 'A')) {
                // Get safetech error from the content asset
                var ContentMgr = require('dw/content/ContentMgr');
                var safetechErrorMessageAsset = ContentMgr.getContent('safetech-declined-order-message');
                safetechErrorMessage = (safetechErrorMessageAsset) ? safetechErrorMessageAsset.custom.body.markup : null;
                Logger.error('# ' + order.orderNo + ' Safetech FraudAnalysis Request fraudStatusCode is ' + fraudStatusCode + ' and autoDecisionResponse '+ autoDecisionResponse + ' ,So CC was approved, but declined for fraud.');
                throw new Error('Declined for fraud.');
            }

            Logger.error('Safetech FraudAnalysis Approved for the #' + order.orderNo);
        } else {
            Logger.error('Issue with Chase service');
            throw new Error('Issue with Chase service');
        }
    } catch (e) {
        error = true;
        serverErrors.push(
            Resource.msg('error.technical', 'checkout', null)
        );
    }

    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error, errorMessage: safetechErrorMessage };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
exports.AuthorizeTD = AuthorizeTD;
