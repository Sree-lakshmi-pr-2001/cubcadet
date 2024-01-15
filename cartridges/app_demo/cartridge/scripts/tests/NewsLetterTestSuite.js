var bdd = require('/app_test/cartridge/scripts/lib/bdd');
var describe = bdd.describe;
var it = bdd.it;

var expect = require('/app_test/cartridge/scripts/lib/chai').expect;
var Logger = require('dw/system/Logger'); 
var HTTPClient = require('dw/net/HTTPClient');
var URLUtils = require('dw/web/URLUtils');

module.exports = 
describe('NewsLetterTestSuite', function() {
	describe('Pipeline', function() {
		it('should work', function() {
			let httpClient = new HTTPClient();
			let	username = password = 'storefront';
			
			httpClient.open('GET', URLUtils.http('NewsLetter-SignUp', 'email', 'jmatos@salesforce.com'), username, password);
			httpClient.send();
			
			expect(httpClient.statusCode).to.eql(200);
			expect(httpClient.text).to.eql('Status=ok');
		});
		
		it('should not work if email parameter is missing', function() {
			let httpClient = new HTTPClient();
			let	username = password = 'storefront';
			
			httpClient.open('GET', URLUtils.http('NewsLetter-SignUp'), username, password);
			httpClient.send();
			
			expect(httpClient.statusCode).to.eql(200);
			expect(httpClient.text).to.eql('Status=Missing Email');
		});
	});
});