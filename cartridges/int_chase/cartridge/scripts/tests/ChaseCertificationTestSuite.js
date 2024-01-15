var bdd = require('/app_test/cartridge/scripts/lib/bdd');
var describe = bdd.describe;
var it = bdd.it;

var expect = require('/app_test/cartridge/scripts/lib/chai').expect;
var PaymentData = require('./data/ChaseCertificationTestData');
var ChaseModel = require('../models/Chase');
var OrderMgr = require('dw/order/OrderMgr');
var Site = require('dw/system/Site');

/**
 * Create Payment JSON for request
 *
 * @param {Object} creditCard - credit card object
 * @param {string} cardType - card type: visa, mastercard, etc
 * @param {Object} address - address object
 * @param {number} amount - amount for payment
 * @returns {Object} - JSON object
 */
function createPaymentJson(creditCard, cardType, address, amount) {
    var orderId = OrderMgr.createOrderSequenceNo();
    var cardTypeValue = cardType;
    if (cardType.indexOf('Master') === 0) {
        cardTypeValue = 'Master';
    } else if (cardType.indexOf('Visa') === 0) {
        cardTypeValue = 'Visa';
    }
    var data = {
        cardType: cardTypeValue,
        customerRefNum: 'customerRefNum' in creditCard ? creditCard.customerRefNum : null,
        cardNumber: 'number' in creditCard ? creditCard.number : null,
        cardExpiration: 'expiration' in creditCard ? creditCard.expiration : null,
        cvv: creditCard.cvv,
        fullName: address.fullName,
        address1: address.address1,
        address2: ('address2' in address && address.address2 !== '' && address.address2 !== null) ? address.address2 : null,
        city: address.city,
        state: address.state,
        zip: address.zip,
        countryCode: address.countryCode,
        phone: address.phone,
        amount: amount * 100,
        orderId: orderId
    };

    return data;
}

module.exports = describe('ChaseCertificationTestSuite', function () {
    describe('Authorization', function () {
        it('Authorization of Credit Cards', function () {
            var siteId = Site.current.ID;
            var authorizationPaymentData = PaymentData[siteId].authorization;
            for (var creditCardType in authorizationPaymentData) {
                if (Object.prototype.hasOwnProperty.call(authorizationPaymentData, creditCardType)) {
                    var creditCardData = authorizationPaymentData[creditCardType];
                    var addressData = creditCardData.address;
                    var paymentData = createPaymentJson(creditCardData, creditCardType, addressData, creditCardData.amount);
                    var result = ChaseModel.authorize(paymentData);

                    // Verify that status is OK
                    expect(result.status).to.eql(0);
                }
            }
        });

        it('Authorization of Saved Cards', function () {
            var siteId = Site.current.ID;
            var authorizationPaymentData = PaymentData[siteId].savedCard;
            for (var creditCardType in authorizationPaymentData) {
                if (Object.prototype.hasOwnProperty.call(authorizationPaymentData, creditCardType)) {
                    var creditCardData = authorizationPaymentData[creditCardType];
                    var addressData = creditCardData.address;
                    var paymentData = createPaymentJson(creditCardData, creditCardType, addressData, creditCardData.amount);
                    var result = ChaseModel.authorize(paymentData);

                    // Verify that status is OK
                    expect(result.status).to.eql(0);
                }
            }
        });

        it('Negative Test', function () {
            var siteId = Site.current.ID;
            if (!('negative' in PaymentData[siteId])) {
                return;
            }
            var authorizationPaymentData = PaymentData[siteId].negative;
            for (var creditCardType in authorizationPaymentData) {
                if (Object.prototype.hasOwnProperty.call(authorizationPaymentData, creditCardType)) {
                    var creditCardData = authorizationPaymentData[creditCardType];
                    var addressData = creditCardData.address;
                    var paymentData = createPaymentJson(creditCardData, creditCardType, addressData, creditCardData.amount);
                    var result = ChaseModel.authorize(paymentData);

                    // Verify that status is OK
                    expect(result.status).to.eql(0);
                }
            }
        });

        /**
         * Auth/Capture or Authorization to Capture Testing to URL:
         * orbitalvar2.chasepaymentech.com/authorize on port 443 or https://wsvar2.chasepaymentech.com/PaymentechGateway on port 443
         */
        it('Failover Test', function () {
            var siteId = Site.current.ID;
            if (!('failover' in PaymentData[siteId])) {
                return;
            }
            var authorizationPaymentData = PaymentData[siteId].failover;
            for (var creditCardType in authorizationPaymentData) {
                if (Object.prototype.hasOwnProperty.call(authorizationPaymentData, creditCardType)) {
                    var creditCardData = authorizationPaymentData[creditCardType];
                    var addressData = creditCardData.address;
                    var paymentData = createPaymentJson(creditCardData, creditCardType, addressData, creditCardData.amount);
                    var result = ChaseModel.authorize(paymentData);

                    // Verify that status is OK
                    expect(result.status).to.eql(0);
                }
            }
        });
    });
});
