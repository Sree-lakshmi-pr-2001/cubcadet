var bdd = require('/app_test/cartridge/scripts/lib/bdd');
var describe = bdd.describe;
var it = bdd.it;

var expect = require('/app_test/cartridge/scripts/lib/chai').expect;
var PaymentData = require('./data/PaymentTestData');
var PaymentModel = require('../models/PaymentModel');

module.exports = describe('PaymentTestSuite', function () {
    describe('Authorization', function () {
        it('Successfull Authorization of Credit Cards', function () {
            for (var creditCardType in PaymentData.creditCard.valid) {
                var creditCardData = PaymentData.creditCard.valid[creditCardType];
                var result = PaymentModel.authorize(creditCardData, creditCardType, false);

                // Verify that status is approved
                expect(result.status).to.eql('approved');
                // Verify that transaction id exists
                expect(result.transactionId).to.be.above(0);
            }
        });

        it('Failed Authorization of Credit Cards', function () {
            for (var creditCardType in PaymentData.creditCard.invalid) {
                var creditCardData = PaymentData.creditCard.invalid[creditCardType];
                var result = PaymentModel.authorize(creditCardData, creditCardType, false);

                // Verify that status is approved
                expect(result.status).to.eql('declined');
                // Verify that transaction id equals null
                expect(result.transactionId).to.be.null;
            }
        });

        it('Successfull Authorization of Saved Cards', function () {
            for (var creditCardType in PaymentData.savedCard.valid) {
                var creditCardData = PaymentData.savedCard.valid[creditCardType];
                var result = PaymentModel.authorize(creditCardData, creditCardType, true);

                // Verify that status is approved
                expect(result.status).to.eql('approved');
                // Verify that transaction id exists
                expect(result.transactionId).to.be.above(0);
            }
        });

        it('Failed Authorization of Saved Cards', function () {
            for (var creditCardType in PaymentData.savedCard.invalid) {
                var creditCardData = PaymentData.savedCard.invalid[creditCardType];
                var result = PaymentModel.authorize(creditCardData, creditCardType, true);

                // Verify that status is approved
                expect(result.status).to.eql('declined');
                // Verify that transaction id equals null
                expect(result.transactionId).to.be.null;
            }
        });
    });

    describe('Tokenization', function () {
        it('Successfull Tokenization', function () {
            for (var creditCardType in PaymentData.creditCard.valid) {
                var creditCardData = PaymentData.creditCard.valid[creditCardType];
                var result = PaymentModel.tokenizeCard(creditCardData, creditCardType);

                // Verify that status is approved
                expect(result.status).to.eql('approved');
                // Verify that transaction id exists
                expect(result.token).to.not.be.null;
            }
        });

        it('Failed Tokenization', function () {
            for (var creditCardType in PaymentData.creditCard.invalid) {
                var creditCardData = PaymentData.creditCard.invalid[creditCardType];
                var result = PaymentModel.tokenizeCard(creditCardData, creditCardType);

                // Verify that status is approved
                expect(result.status).to.eql('declined');
                // Verify that transaction id exists
                expect(result.token).to.be.null;
            }
        });
    });

    describe('Void', function () {
        it('Successfull Void', function () {
            for (var creditCardType in PaymentData.creditCard.valid) {
                var creditCardData = PaymentData.creditCard.valid[creditCardType];
                var result = PaymentModel.authorize(creditCardData, creditCardType, false);

                // Verify that status is approved
                expect(result.status).to.eql('approved');

                // Make a void of authorized card
                var voidStatus = PaymentModel.void(result.transactionId);
                // Verify void status
                expect(voidStatus).to.eql('success');
            }
        });

        it('Failed Void', function () {
            for (var creditCardType in PaymentData.creditCard.invalid) {
                var creditCardData = PaymentData.creditCard.invalid[creditCardType];
                var result = PaymentModel.authorize(creditCardData, creditCardType, false);

                // Make a void of authorized card
                var voidStatus = PaymentModel.void(result.transactionId);
                // Verify void status
                expect(voidStatus).to.eql('failed');
            }
        });
    });

    describe('Capture', function () {
        it('Successfull Capture', function () {
            for (var creditCardType in PaymentData.creditCard.valid) {
                var creditCardData = PaymentData.creditCard.valid[creditCardType];
                var result = PaymentModel.authorize(creditCardData, creditCardType, false);

                // Verify that status is approved
                expect(result.status).to.eql('approved');

                // Make a void of authorized card
                var captureStatus = PaymentModel.capture(result.transactionId);
                // Verify void status
                expect(captureStatus).to.eql('success');
            }
        });

        it('Failed Capture', function () {
            for (var creditCardType in PaymentData.creditCard.invalid) {
                var creditCardData = PaymentData.creditCard.invalid[creditCardType];
                var result = PaymentModel.authorize(creditCardData, creditCardType, false);

                // Make a void of authorized card
                var captureStatus = PaymentModel.capture(result.transactionId);
                // Verify void status
                expect(captureStatus).to.eql('failed');
            }
        });
    });

    describe('Balance Check', function () {
        it('Successfull Balance Check', function () {
            var result = PaymentModel.checkBalance(PaymentData.giftCard.number, PaymentData.giftCard.pin);

            // Verify status
            expect(result.status).to.eql('success');

            // Verify balance
            expect(result.balance).to.eql(PaymentData.giftCard.balance);
        });

        it('Failed Balance Check', function () {
            var result = PaymentModel.checkBalance(PaymentData.giftCard.number + '123', PaymentData.giftCard.pin);

            // Verify status
            expect(result.status).to.eql('failed');

            // Verify balance
            expect(result.balance).to.eql(0);
        });
    });
});
