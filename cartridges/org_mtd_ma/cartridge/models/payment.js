'use strict';

var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var collections = require('*/cartridge/scripts/util/collections');
var ViewHelper = require('*/cartridge/scripts/utils/ViewHelper');
var formatMoney = require('dw/util/StringUtils').formatMoney;
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var Money = require('dw/value/Money');
var Transaction = require('dw/system/Transaction');
/**
 * Creates an array of objects containing applicable payment methods
 * @param {dw.util.ArrayList<dw.order.dw.order.PaymentMethod>} paymentMethods - An ArrayList of
 *      applicable payment methods that the user could use for the current basket.
 * @returns {Array} of object that contain information about the applicable payment methods for the
 *      current cart
 */
function applicablePaymentMethods(paymentMethods) {
    return collections.map(paymentMethods, function (method) {
        return {
            ID: method.ID,
            name: method.name
        };
    });
}

/**
 * Creates an array of objects containing applicable credit cards
 * @param {dw.util.Collection<dw.order.PaymentCard>} paymentCards - An ArrayList of applicable
 *      payment cards that the user could use for the current basket.
 * @returns {Array} Array of objects that contain information about applicable payment cards for
 *      current basket.
 */
function applicablePaymentCards(paymentCards) {
    return collections.map(paymentCards, function (card) {
        return {
            cardType: card.cardType,
            name: card.name
        };
    });
}

/**
 * Creates an array of objects containing selected payment information
 * @param {dw.util.ArrayList<dw.order.PaymentInstrument>} selectedPaymentInstruments - ArrayList
 *      of payment instruments that the user is using to pay for the current basket
 * @returns {Array} Array of objects that contain information about the selected payment instruments
 */
function getSelectedPaymentInstruments(selectedPaymentInstruments,currentBasket) {
    var FinanceUtil = require('int_financing_app/cartridge/scripts/helpers/Util');
    return collections.map(selectedPaymentInstruments, function (paymentInstrument) {
        var results = {
            paymentMethod: paymentInstrument.paymentMethod,
            amount: paymentInstrument.paymentTransaction.amount.value,
            formattedAmount: formatMoney(paymentInstrument.paymentTransaction.amount)
        };
        if (paymentInstrument.paymentMethod === 'CREDIT_CARD') {
            results.lastFour = paymentInstrument.creditCardNumberLastDigits;
            results.owner = paymentInstrument.creditCardHolder;
            results.expirationYear = paymentInstrument.creditCardExpirationYear;
            results.type = paymentInstrument.creditCardType;
            results.maskedCreditCardNumber = paymentInstrument.maskedCreditCardNumber;
            results.formattedCreditCardNumber = ViewHelper.formatMaskedCCNumber(paymentInstrument.maskedCreditCardNumber);
            results.expirationMonth = paymentInstrument.creditCardExpirationMonth;
        } else if (paymentInstrument.paymentMethod === 'GIFT_CERTIFICATE') {
            results.giftCertificateCode = paymentInstrument.giftCertificateCode;
            results.maskedGiftCertificateCode = paymentInstrument.maskedGiftCertificateCode;
        } else if (paymentInstrument.paymentMethod === FinanceUtil.VALUE.FINANCE_METHOD_ID) {
            var accountNumber = paymentInstrument.custom.tdAccountNumber;
            var planObject = FinanceUtil.getPlanObject(paymentInstrument.custom.tdPlanID);
            
            if (accountNumber) {
                results.accountNumber = '**** **** **** ' + accountNumber.substr(accountNumber.length - 4);
            } else {
                // get td account number for showing on confirmation page only
                var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
                results.accountNumber = COHelpers.getSavedTDAccountNumber();
            }

            results.termName = planObject.planName;
            results.planID = planObject.planID;
            results.ss = planObject.superscriptNumber;
            // If we have order placed
            if (paymentInstrument.paymentTransaction
                && paymentInstrument.paymentTransaction.custom.authCode
                && paymentInstrument.paymentTransaction.custom.processFee) {
                results.processFee = paymentInstrument.paymentTransaction.custom.processFee;
            } else {
                results.processFee = planObject.processFee;
            }
            // Add processing fee
            var finalAmount = paymentInstrument.paymentTransaction.amount;
            if (planObject.processFee > 0) {
                var processFeeMoney = new Money(results.processFee, paymentInstrument.paymentTransaction.amount.currencyCode);
                finalAmount = paymentInstrument.paymentTransaction.amount.add(processFeeMoney);
                var planType;
                if ((!planObject.apr || planObject.apr === 0)&& (!planObject.processFee || planObject.processFee === 0)&& (planObject.termLength && planObject.termLength > 0)) {
                    planType = 'deferred';
                } else if (planObject.apr >= 0 && planObject.termLength > 0 && planObject.repaymentFactor) {
                    planType = 'apr';
                }

                if (planType === 'apr') {
                    var monthlyPayment = Math.ceil(Number(finalAmount) * Number(planObject.repaymentFactor));
                    if(planObject.apr !== 0){
                        finalAmount = (Number(monthlyPayment) * Number(planObject.termLength)).toFixed(2);
                        finalAmount = new Money(finalAmount, paymentInstrument.paymentTransaction.amount.currencyCode);
                    }
                }

                results.tdAmount= finalAmount.value
                results.amount = formatMoney(finalAmount);
                results.formattedAmount = formatMoney(finalAmount);
                results.formattedProcessFee = formatMoney(processFeeMoney);
            } else {
                results.tdAmount= finalAmount.value
                results.amount = formatMoney(finalAmount);
                results.formattedAmount = formatMoney(finalAmount);
            }

            var financePaymentMethod = PaymentMgr.getPaymentMethod(FinanceUtil.VALUE.FINANCE_METHOD_ID);
            if (financePaymentMethod) {
                results.paymentName = financePaymentMethod.name;
            }
            results.lang = {
                terms: Resource.msg('finance.terms', 'checkout', null),
                amountFinanced: Resource.msg('finance.amount.financed', 'checkout', null),
                accountNumber: Resource.msg('finance.account.number', 'checkout', null),
                seeDetails: Resource.msg('finance.see.details', 'checkout', null),
                detailsTitle: Resource.msg('finance.details.title', 'checkout', null),
                promoFee: Resource.msgf('finance.plan.placeorder.promofee', 'checkout', null, planObject.processFee)
            };
            results.disclosureUrl = URLUtils.url('FinancingApplication-Disclosure').toString();
        }

        return results;
    });
}

/**
 * Payment class that represents payment information for the current basket
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {dw.customer.Customer} currentCustomer - the associated Customer object
 * @param {string} countryCode - the associated Site countryCode
 * @constructor
 */
function Payment(currentBasket, currentCustomer, countryCode) {
    var paymentAmount = currentBasket.totalGrossPrice;
    var paymentMethods = PaymentMgr.getApplicablePaymentMethods(
        currentCustomer,
        countryCode,
        paymentAmount.value
    );
    var paymentCards = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD)
        .getApplicablePaymentCards(currentCustomer, countryCode, paymentAmount.value);
    var paymentInstruments = currentBasket.paymentInstruments;

    // TODO: Should compare currentBasket and currentCustomer and countryCode to see
    //     if we need them or not
    this.applicablePaymentMethods =
        paymentMethods ? applicablePaymentMethods(paymentMethods) : null;

    this.applicablePaymentCards =
        paymentCards ? applicablePaymentCards(paymentCards) : null;

    this.selectedPaymentInstruments = paymentInstruments ?
        getSelectedPaymentInstruments(paymentInstruments) : null;
}

module.exports = Payment;
