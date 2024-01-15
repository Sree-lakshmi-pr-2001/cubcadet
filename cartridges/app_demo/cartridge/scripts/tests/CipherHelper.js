var bdd = require('/app_test/cartridge/scripts/lib/bdd');
var describe = bdd.describe;
var it = bdd.it;
var before = bdd.before;
var after = bdd.after;
var beforeEach = bdd.beforeEach;
var afterEach = bdd.afterEach;

var expect = require('/app_test/cartridge/scripts/lib/chai').expect;
var Logger = require('dw/system/Logger'); 

module.exports = 
describe('CipherHelper', function() {
	var CipherHelper = require('app_demo/cartridge/scripts/CipherHelper'),
		cyperText = 'wFKBVVb/9+Xmk2XiR9sJiw==';
	
	describe('encrypt', function() {
		before(function () {
			//Logger.debug('before-encrypt called');
		});
		
		after(function () {
			//Logger.debug('after-encrypt called');
		});
		
		beforeEach(function () {
			//Logger.debug('beforeEach-encrypt called');
		});
		
		afterEach(function () {
			//Logger.debug('afterEach-encrypt called');
		});
		
		it('should succeed when using valid input', function() {
			expect(CipherHelper.encrypt('testing')).to.eql(cyperText);
		});
		
		it('should return null when input is null', function() {
			expect(CipherHelper.encrypt(null)).to.eql(null);
		});
		
		it('should return empty string when input is empty string', function() {
			expect(CipherHelper.encrypt('')).to.eql('');
		});
		
		it('should succeed with large string', function() {
			var SecureRandom = require('dw/crypto/SecureRandom');
			
			let secureRandom = new SecureRandom(),
			    stringToEncrypt = StringUtils.encodeBase64(secureRandom.nextBytes(10240).toString()); 
				
			expect(CipherHelper.encrypt(stringToEncrypt)).to.be.ok;
			
		})
	});

	describe('decrypt', function() {
		it('should succeed when using valid input', function() {
			expect(CipherHelper.decrypt(cyperText)).to.eql('testing');
		});
	
		it('should return null if input is null', function() {
			expect(CipherHelper.decrypt(null)).to.eql(null);
		});
		
		it('should return empty string if input is empty string', function() {
			expect(CipherHelper.decrypt('')).to.eql('');
		});
		
		it('should return null for invalid input', function() {
			expect(CipherHelper.decrypt('Unencrypted String')).to.eql(null);
		});
	});
	
	describe('misc', function() {
		it('should throw an error, and it does', function() {
			CipherHelper.throwException();
		}).expectedError('demo exception');
		
		it('should throw an error, but it does not', function() {
			Logger.debug('This is an example of a failed test.');
			CipherHelper.doesNotThrowException();
		}).expectedError('demo exception');
	});
});