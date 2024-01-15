var bdd = require('/app_test/cartridge/scripts/lib/bdd');
var describe = bdd.describe;
var it = bdd.it;

var expect = require('/app_test/cartridge/scripts/lib/chai').expect;
var MTDTaxData = require('./data/MTDTaxTestData');
var MTDAddressData = require('./data/MTDAddressTestData');
var MTDManualsData = require('./data/MTDManualsTestData');
var MTDDealerFulfillmentData = require('./data/MTDDealerFulfillmentTestData');
var OAuthModel = require('../models/OAuth');
var TaxModel = require('../models/Tax');
var AddressModel = require('../models/Address');
var ManualsModel = require('../models/Manuals');
var DealerModel = require('../models/Dealer');
var Site = require('dw/system/Site');

module.exports = describe('MTDServicesTestSuite', function () {
    describe('oAuth', function () {
        it('Successfull Authorization', function () {
            var tokenFromAPI = OAuthModel.getToken(true);
            var tokenFromCO = OAuthModel.getToken();

            // Verify that token from API and CO doesn't equal null
            expect(tokenFromAPI).to.not.be.null;
            expect(tokenFromCO).to.not.be.null;

            // Verify that both token is equal
            expect(tokenFromAPI).to.eql(tokenFromCO);
        });
    });

    describe('Tax', function () {
        it('Successfull Tax Api Call', function () {
            var taxResult = TaxModel.get(MTDTaxData);
            var taxResponse = taxResult.getDetail('response');

            // Verify that response is not null
            expect(taxResponse).to.not.be.null;

            // Verify that we have tax amount
            expect(taxResponse.totalTaxAmount).to.be.above(0);

            // Verify that each item has tax amount
            for (var i = 0, itemLength = taxResponse.returnedItemDetails.length; i < itemLength; i++) {
                var itemResponse = taxResponse.returnedItemDetails[i];
                expect(itemResponse.salesTaxAmount).to.be.above(0);
            }

            // Verify that each special charge has tax amount
            for (var j = 0, specialItemLength = taxResponse.returnedSpecialCharges.length; j < specialItemLength; j++) {
                var specialItemResponse = taxResponse.returnedSpecialCharges[j];
                expect(specialItemResponse.salesTaxAmount).to.not.be.eql(0);
            }
        });

        it('Error Tax Api Call', function () {
            // Remove shipping Address
            delete MTDTaxData.shipToAddress[0];
            // Make API call
            var taxResult = TaxModel.get(MTDTaxData);
            var taxResponse = taxResult.getDetail('response');

            // Verify tax result status
            expect(taxResult.error).to.be.eql(true);
            expect(taxResult.code).to.be.eql('500');

            // Verify that response is null
            expect(taxResponse).to.be.null;
        });
    });

    describe('Address', function () {
        it('Successfull Address Validation', function () {
            var siteId = Site.current.ID;
            var addressPool = MTDAddressData[siteId];

            var address = addressPool.valid;
            var addressResult = AddressModel.verify(address);
            // Verify success API status
            expect(addressResult.error).to.be.eql(false);
            // Verify that address has no corrected and error flag
            var addressResponse = addressResult.getDetail('response');
            expect(addressResponse.correctedFlag).to.be.eql(false);
            expect(addressResponse.errorFlag).to.be.eql(false);
        });

        it('Corrected Address Validation', function () {
            var siteId = Site.current.ID;
            var addressPool = MTDAddressData[siteId];

            var address = addressPool.incorrect;
            var addressResult = AddressModel.verify(address);
            // Verify success API status
            expect(addressResult.error).to.be.eql(false);
            // Verify that address has no corrected and error flag
            var addressResponse = addressResult.getDetail('response');
            expect(addressResponse.correctedFlag).to.be.eql(true);
            expect(addressResponse.errorFlag).to.be.eql(false);
        });

        it('Failed Address Validation', function () {
            var siteId = Site.current.ID;
            var addressPool = MTDAddressData[siteId];

            var address = addressPool.failed;
            var addressResult = AddressModel.verify(address);
            // Verify success API status
            expect(addressResult.error).to.be.eql(false);
            // Verify that address has no corrected and error flag
            var addressResponse = addressResult.getDetail('response');
            expect(addressResponse.correctedFlag).to.be.eql(false);
            expect(addressResponse.errorFlag).to.be.eql(true);
        });
    });

    describe('Manuals', function () {
        it('Successfull Search by Model Number', function () {
            var manualResult = ManualsModel.searchManuals(MTDManualsData.validModelNo);

            // Verify success API status
            expect(manualResult.error).to.be.eql(false);
            // Verify we have some items in the response
            var manualResponse = manualResult.getDetail('response');
            expect(manualResponse.length).to.be.above(0);
        });

        it('No result by Model Number', function () {
            var manualResult = ManualsModel.searchManuals(MTDManualsData.invalidModelNo);

            // Verify success API status
            expect(manualResult.error).to.be.eql(false);
            // Verify not found response code
            var manualResponse = manualResult.getDetail('response');
            expect(manualResponse.length).to.be.eql(0);
        });
    });

    describe('Dealer Fullfilment', function () {
        it('Successfull get dealer fullfilment data', function () {
            var result = DealerModel.getFulfillment(MTDDealerFulfillmentData);

            // Verify success API status
            expect(result.error).to.be.eql(false);
            // Verify we have some items in the response
            var response = result.getDetail('response');
            expect(response.dealerAvailability.dealerGroup.dealers.length).to.be.above(0);
        });
    });
});
