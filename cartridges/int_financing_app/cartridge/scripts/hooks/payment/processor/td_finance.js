'use strict';

var collections = require('*/cartridge/scripts/util/collections');

var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var Status = require('dw/system/Status');
var FinanceUtil = require('int_financing_app/cartridge/scripts/helpers/Util');
var TransactionModel = require('int_financing_app/cartridge/scripts/models/Transaction');
var StringUtils = require('dw/util/StringUtils');
var Logger = require('dw/system/Logger');
var HookMgr = require('dw/system/HookMgr');
var SalesRequest = require('int_financing_app/cartridge/scripts/helpers/SalesRequest');
var VoidRequest = require('int_financing_app/cartridge/scripts/helpers/VoidRequest');
var Calendar = require('dw/util/Calendar');

/**
 * Verifies that entered credit card information is a valid card. If the information is valid a
 * credit card payment instrument is created
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @return {Object} returns an error object
 */
function Handle(basket, paymentInformation) {
    Logger.debug('td_finance.js ->  handle');
    var currentBasket = basket;
    var cardErrors = {};
    var accountNumber = paymentInformation.accountNumber.value.replace(/[- ]/gi, '');
    var planId = paymentInformation.planId.value;
    var serverErrors = [];

    Transaction.wrap(function () {
        var paymentInstruments = currentBasket.getPaymentInstruments();

        collections.forEach(paymentInstruments, function (item) {
            currentBasket.removePaymentInstrument(item);
        });

        var paymentInstrument = currentBasket.createPaymentInstrument(
            FinanceUtil.VALUE.FINANCE_METHOD_ID, currentBasket.totalGrossPrice
        );

        paymentInstrument.custom.tdAccountNumber = accountNumber;
        paymentInstrument.custom.tdPlanID = planId;
        paymentInstrument.custom.tdStoreNumber = FinanceUtil.VALUE.STORE_NUMBER;
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

    // Checking TD Financing Safetech Fraud by Chase before TD Authorize
    if (HookMgr.hasHook('app.payment.processor.chase_credit')) {
        var chaseAuthorizeTDResult = HookMgr.callHook(
            'app.payment.processor.chase_credit',
            'AuthorizeTD',
            orderNumber,
            paymentInstrument,
            paymentProcessor,
            order
        );

        // Don't authorize if chase returned fraud
        if (chaseAuthorizeTDResult && chaseAuthorizeTDResult.error) {
            return chaseAuthorizeTDResult;
        }
    }

    try {
        // Create payment Data Object
        var accountNumber = paymentInstrument.custom.tdAccountNumber;
        var planId = paymentInstrument.custom.tdPlanID;
        var paymentData = SalesRequest.prepareData(accountNumber, order, planId);
        Logger.error('TD Transaction Service payment data : '+ JSON.stringify(paymentData))
        // Make authorization call
        var authResult = TransactionModel.authorize(paymentData);
        if (authResult.status === Status.OK) {
            var response = authResult.getDetail('response');
            Transaction.wrap(function () {
                var transaction = paymentInstrument.paymentTransaction;
                transaction.setTransactionID(response.transactionLink);
                transaction.setPaymentProcessor(paymentProcessor);
                if(response && response.authDate){
                    transaction.custom.authDate = StringUtils.formatCalendar(response.authDate);
                } else {
                    var calendarObj = new Calendar();
                    var estOffset = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
                    var date = new Date();
                    var estTime = new Date(date.getTime() - estOffset);
	                calendarObj.setTime(estTime);
	                var authDate = StringUtils.formatCalendar(calendarObj);
                    transaction.custom.authDate = authDate;
                }
                transaction.custom.authCode = response.authCode;
                // Save current plan promo fee to object for order confirmation and order history
                var planObject = FinanceUtil.getPlanObject(paymentInstrument.custom.tdPlanID);
                if (planObject.processFee > 0) {
                    transaction.custom.processFee = planObject.processFee;
                }
            });

            // Card was declined
            if (response.authRes !== 1) {
                Logger.error('Account Number wasn\'t approved for order #' + orderNumber);
                throw new Error('Account Number wasn\'t approved for order #' + orderNumber);
            }

            // Validate postalCode in case if nameAddressMatchYN does not equal "Y"
            if (response.nameAddressMatchYN && response.nameAddressMatchYN.value() && response.nameAddressMatchYN.value().equals('N')) {
                // Call Void transaction in case if postalCode from response does not equal postalCode from SFCC billing
                if (!response.nameAddress || !response.nameAddress.postalCode || !response.nameAddress.postalCode.equals(order.billingAddress.postalCode)) {
                    var voidData = VoidRequest.prepareData(paymentInstrument.paymentTransaction.transactionID);
                    var voidResult = TransactionModel.void(voidData);

                    if (voidResult.status === Status.OK) {
                        var voidResponse = voidResult.getDetail('response');
                        if (voidResponse.authRes === 1) {
                            Transaction.wrap(function () {
                                paymentInstrument.paymentTransaction.custom.voidTransactionID = voidResponse.transactionLink;  // eslint-disable-line no-param-reassign
                                paymentInstrument.paymentTransaction.custom.voidAuthDate = StringUtils.formatCalendar(voidResponse.authDate); // eslint-disable-line no-param-reassign
                            });
                        }
                    }
                    
                    var errorMessage = StringUtils.format('Postal code {0} from response of Void "td.transaction" service does not equal postalCode {1} from SFCC billing', response.nameAddress.postalCode, order.billingAddress.postalCode);
                    Logger.error(errorMessage);
                    throw new Error(errorMessage);
                }
            }
        } else { 
            Logger.error('Issue with TD service for order #' + orderNumber);
            throw new Error('Issue with TD service for order #' + orderNumber);
        }
    } catch (e) {
        error = true;
        serverErrors.push(
            Resource.msg('error.technical', 'checkout', null)
        );
        Logger.error(e);
    }

    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
