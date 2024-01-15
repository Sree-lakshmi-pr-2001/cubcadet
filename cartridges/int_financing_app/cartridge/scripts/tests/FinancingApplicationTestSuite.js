var bdd = require('/app_test/cartridge/scripts/lib/bdd');
var describe = bdd.describe;
var it = bdd.it;

var expect = require('/app_test/cartridge/scripts/lib/chai').expect;
var AccessTokenModel = require('../models/AccessToken');
var CardholderModel = require('../models/Cardholder');
var TransactionModel = require('../models/Transaction');
var TDTestData = require('./data/TDTestData');
var OrderMgr = require('dw/order/OrderMgr');

module.exports = describe('FinancingApplicationTestSuite', function () {
    describe('Get Token', function () {
        it('Successfull Get Token', function () {
            var result = AccessTokenModel.getToken();
            var url = result.getDetail('url');

            // Verify that status is OK
            expect(result.status).to.eql(0);
            // Verify that transaction is approved
            expect(url).to.not.be.null;
        });
    });

    describe('Card Number Lookup', function () {
        it('Lookup by SSN', function () {
            var data = TDTestData.lookup;
            var result = CardholderModel.getCardNumber(data);
            var accountNumber = result.getDetail('accountNumber');

            // Verify that status is OK
            expect(result.status).to.eql(0);
            // Verify that transaction is approved
            expect(accountNumber).to.not.be.null;
        });
    });

    describe('Transactions', function () {
        it('Authorize', function () {
            var data = TDTestData.authorize;
            data.orderNumber = OrderMgr.createOrderSequenceNo();
            var result = TransactionModel.authorize(data);
            var response = result.getDetail('response');

            // Verify that status is OK
            expect(result.status).to.eql(0);
            // Verify that transaction is approved
            expect(response.authRes).to.eql(1);
        });

        it('Void', function () {
            var authData = TDTestData.authorize;
            authData.orderNumber = OrderMgr.createOrderSequenceNo();
            var authResult = TransactionModel.authorize(authData);
            var authResponse = authResult.getDetail('response');

            // Verify that status is OK
            expect(authResult.status).to.eql(0);
            // Verify that transaction is approved
            expect(authResponse.authRes).to.eql(1);

            // Create void data
            var voidData = {
                transactionLink: authResponse.transactionLink
            };
            var voidResult = TransactionModel.void(voidData);
            var voidResponse = authResult.getDetail('response');

            // Verify that status is OK
            expect(voidResult.status).to.eql(0);
            // Verify that transaction is approved
            expect(voidResponse.authRes).to.eql(1);
        });
    });
});
