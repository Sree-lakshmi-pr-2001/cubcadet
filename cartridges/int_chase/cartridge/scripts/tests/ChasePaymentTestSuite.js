var bdd = require('/app_test/cartridge/scripts/lib/bdd');
var describe = bdd.describe;
var it = bdd.it;

var expect = require('/app_test/cartridge/scripts/lib/chai').expect;
var PaymentData = require('./data/ChasePaymentTestData');
var ChaseModel = require('../models/Chase');
var OrderMgr = require('dw/order/OrderMgr');

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
    var data = {
        cardType: cardType,
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
        amount: amount,
        orderId: orderId
    };

    return data;
}

module.exports = describe('ChasePaymentTestSuite', function () {
    describe('Authorization', function () {
        it('Successfull Authorization of Credit Cards', function () {
            for (var creditCardType in PaymentData.creditCard.valid) {
                if (Object.prototype.hasOwnProperty.call(PaymentData.creditCard.valid, creditCardType)) {
                    var creditCardData = PaymentData.creditCard.valid[creditCardType];
                    var addressData = PaymentData.address.valid;
                    var paymentData = createPaymentJson(creditCardData, creditCardType, addressData, 10);
                    var result = ChaseModel.authorize(paymentData);
                    var response = result.getDetail('response');

                    // Verify that status is OK
                    expect(result.status).to.eql(0);
                    // Verify that transaction is approved
                    expect(response.approvalStatus).to.eql('1');
                }
            }
        });

        it('Failed Authorization of Credit Cards', function () {
            for (var creditCardType in PaymentData.creditCard.invalid) {
                if (Object.prototype.hasOwnProperty.call(PaymentData.creditCard.invalid, creditCardType)) {
                    var creditCardData = PaymentData.creditCard.invalid[creditCardType];
                    var addressData = PaymentData.address.valid;
                    var paymentData = createPaymentJson(creditCardData, creditCardType, addressData, 10);
                    var result = ChaseModel.authorize(paymentData);
                    var response = result.getDetail('response');

                    // Verify that status is OK
                    expect(result.status).to.eql(0);
                    // Verify that transaction is declined
                    expect(response.approvalStatus).to.eql('0');
                }
            }
        });

        it('Successfull Authorization of Saved Cards', function () {
            for (var creditCardType in PaymentData.savedCard.valid) {
                if (Object.prototype.hasOwnProperty.call(PaymentData.savedCard.valid, creditCardType)) {
                    var creditCardData = PaymentData.savedCard.valid[creditCardType];
                    var addressData = PaymentData.address.valid;
                    var paymentData = createPaymentJson(creditCardData, creditCardType, addressData, 10);
                    var result = ChaseModel.authorize(paymentData);
                    var response = result.getDetail('response');

                    // Verify that status is OK
                    expect(result.status).to.eql(0);
                    // Verify that transaction is approved
                    expect(response.approvalStatus).to.eql('1');
                }
            }
        });

        it('Failed Authorization of Saved Cards', function () {
            for (var creditCardType in PaymentData.savedCard.invalid) {
                if (Object.prototype.hasOwnProperty.call(PaymentData.savedCard.invalid, creditCardType)) {
                    var creditCardData = PaymentData.savedCard.invalid[creditCardType];
                    var addressData = PaymentData.address.valid;
                    var paymentData = createPaymentJson(creditCardData, creditCardType, addressData, 10);
                    var result = ChaseModel.authorize(paymentData);
                    // var response = result.getDetail('response');

                    // Verify that status is ERROR
                    expect(result.status).to.eql(1);
                }
            }
        });
    });
    describe('Void', function () {
        it('Successfull Reverse of Authorized Card', function () {
            var creditCardData = PaymentData.savedCard.valid.Visa;
            var addressData = PaymentData.address.valid;
            var paymentData = createPaymentJson(creditCardData, 'Visa', addressData, 10);
            var authResult = ChaseModel.authorize(paymentData);
            var authResponse = authResult.getDetail('response');

            // Verify that status is OK
            expect(authResult.status).to.eql(0);
            // Verify that transaction is approved
            expect(authResponse.approvalStatus).to.eql('1');

            // Make a void
            var voidResult = ChaseModel.void(authResponse.orderID, authResponse.txRefNum, authResponse.txRefIdx);
            var voidResponse = voidResult.getDetail('response');

            // Verify that status is OK
            expect(voidResult.status).to.eql(0);
            // Verify that transaction is approved
            expect(voidResponse.approvalStatus).to.eql('1');
        });
    });
});
