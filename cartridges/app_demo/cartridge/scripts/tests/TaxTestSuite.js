var bdd = require('/app_test/cartridge/scripts/lib/bdd');
var describe = bdd.describe;
var it = bdd.it;

var expect = require('/app_test/cartridge/scripts/lib/chai').expect;
var Logger = require('dw/system/Logger'); 
var Site = require('dw/system/Site');
var TaxData = require('./data/TaxTestData');
var TaxRatesData = require('./data/TaxRatesData');
var TaxModel = require('../models/TaxModel');

module.exports = 
describe('TaxTestSuite', function() {
    describe('Address Validation', function() {
        it('Valid Address', function() {
            for (var countryCode in TaxData.address) {
                var address = TaxData.address[countryCode].valid;
                var result = TaxModel.calculate(address, countryCode, TaxData.products, TaxData.shipping);
                // Verify that we have an valid address
                expect(result.addressStatus).to.eql('valid');
                // Verify that products has taxAmount and rate(s)
                expect(result.products.length).to.eql(TaxData.products.length);
                for (var product in result.products) {
                    expect(product.rate).to.be.above(0);
                    expect(product.taxAmount).to.be.above(0);
                }
                // Verify that shipping has taxAmount and rate(s)
                expect(result.shipping.rate).to.be.above(0);
                expect(result.shipping.taxAmount).to.be.above(0);
            }
        });
        
        it('Invalid Address', function() {
            for (var countryCode in TaxData.address) {
                var address = TaxData.address[countryCode].invalid;
                var result = TaxModel.calculate(address, countryCode, TaxData.products, TaxData.shipping);
                // Verify that we have an valid address
                expect(result.addressStatus).to.eql('invalid');
                // Verify that no product rates is returned
                expect(result.products.length).to.eql(0);
            }
        });
    });
    
    describe('Tax class comparison', function() {
        it('Different rates', function() {
            for (var countryCode in TaxData.address) {
                var address = TaxData.address[countryCode].valid;
                var result = TaxModel.calculate(address, countryCode, TaxData.products, TaxData.shipping);
                // Verify that we have an valid address
                expect(result.addressStatus).to.eql('valid');
                // Verify that products has taxAmount and rate(s)
                expect(result.products.length).to.eql(TaxData.products.length);
                // Verify that rates by class ID
                for (var product in result.products) {
                    expect(product.rate).to.eql(TaxRatesData.rates[countryCode][product.taxClass]);
                }
                // Verify that shipping rate by class ID
                expect(result.shipping.rate).to.eql(TaxRatesData.rates[countryCode][result.shipping.taxClass]);
            }
        });
    });
});