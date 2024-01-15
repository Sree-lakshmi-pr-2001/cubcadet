/**
 * AddressValidationTestSuite.js is a starting template for an integration test suite
 * It contains tests to exercise functionality commonly seen in Address Validation
 */

var bdd = require('/app_test/cartridge/scripts/lib/bdd');
var describe = bdd.describe;
var it = bdd.it;

var expect = require('/app_test/cartridge/scripts/lib/chai').expect;
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
var AddressData = require('./data/AddressValidationTestData');
var AddressModel = require('../models/AddressValidationModel');

module.exports = describe('AddressValidationTestSuite', function () {
    describe('Valid address', function () {
        it('All fields passed', function () {
            var siteId = Site.current.ID;
            var addressPool = AddressData[siteId];

            for (var countryCode in addressPool) {
                var address = addressPool[countryCode].valid;
                var status = AddressModel.verifyAddress(address, countryCode);
                expect(status).to.eql('valid');
            }
        });
    });

    describe('Invalid address - partial match', function () {
        it('All fields passed', function () {
            var siteId = Site.current.ID;
            var addressPool = AddressData[siteId];

            for (var countryCode in addressPool) {
                var address = addressPool[countryCode].invalid_partial;
                var status = AddressModel.verifyAddress(address, countryCode);
                expect(status).to.eql('invalid_partial');
            }
        });
    });

    describe('Invalid address - no match', function () {
        it('All fields passed', function () {
            var siteId = Site.current.ID;
            var addressPool = AddressData[siteId];

            for (var countryCode in addressPool) {
                var address = addressPool[countryCode].invalid_nomatch;
                var status = AddressModel.verifyAddress(address, countryCode);
                expect(status).to.eql('invalid_nomatch');
            }
        });
    });

    describe('Check required fields', function () {
        it('Some required field equals NULL', function () {
            var siteId = Site.current.ID;
            var addressPool = AddressData[siteId];

            for (var countryCode in addressPool) {
                var address = addressPool[countryCode].valid;
                address.city = null;
                var status = AddressModel.verifyAddress(address, countryCode);
                expect(status).to.eql('required_fields_missed');
            }
        });

        it('Some required field is empty', function () {
            var siteId = Site.current.ID;
            var addressPool = AddressData[siteId];

            for (var countryCode in addressPool) {
                var address = addressPool[countryCode].valid;
                address.city = ' ';
                var status = AddressModel.verifyAddress(address, countryCode);
                expect(status).to.eql('required_fields_missed');
            }
        });
    });
});
