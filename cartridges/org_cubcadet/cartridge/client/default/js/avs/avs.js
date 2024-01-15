'use strict';

var baseAvs = require('org_ma/avs/avs');
var dealerHelpers = require('../dealer/dealer');

var exportAvs = $.extend({}, baseAvs, {
    verifyAddress: function (callback) {
        // Check if we need to skip AVS verification
        if (dealerHelpers.skipAVSCheck()) {
            callback();
            return;
        }

        var verifyUrl = $('#checkout-main').attr('data-verify-address-url');
        var form = $('.single-shipping .shipping-form');
        var addressData = {
            address1: $.trim(form.find('input[name$="_address1"]').val()),
            address2: $.trim(form.find('input[name$="_address2"]').val()) !== '' ? $.trim(form.find('input[name$="_address2"]').val()) : null,
            city: $.trim(form.find('input[name$="_city"]').val()),
            countryCode: $.trim(form.find('select[name$="_country"]').val()),
            postalCode: $.trim(form.find('input[name$="_postalCode"]').val()),
            stateCode: $.trim(form.find('select[name$="_stateCode"]').val())
        };
        var thisModule = this;
        // Verify address
        $.ajax({
            url: verifyUrl,
            type: 'post',
            dataType: 'json',
            data: addressData,
            success: function (response) {
                /**
                 * If service is unavailable or service is disabled or we have no errors
                 * we just go to the next step
                 */
                if (('serviceError' in response && response.serviceError)
                        || ('serviceDisabled' in response && response.serviceDisabled)
                        || ('correctedFlag' in response && !response.correctedFlag
                        && 'errorFlag' in response && !response.errorFlag)) {
                    callback();
                } else {
                    // Don't show dialog if it's dealer delivery and corrected postal code does not equal Dealer's postal code
                    var shippingMethod = $('#dealerShippingMethod').val();
                    var originalPostalCode = addressData.postalCode;
                    var correctedPostalCode = (response && response.correctedAddress) ? response.correctedAddress.postalCode : '';
                    if (shippingMethod === 'dealer-delivery' && originalPostalCode !== correctedPostalCode) {
                        callback();
                    } else {
                        thisModule.showDialog(response, callback);
                    }
                }
            },
            error: function () {
            }
        });
    }
});

module.exports = exportAvs;
