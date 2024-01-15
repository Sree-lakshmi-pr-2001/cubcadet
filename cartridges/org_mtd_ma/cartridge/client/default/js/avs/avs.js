'use strict';

var dealerHelpers = require('int_mtdservices/dealer/dealer');
var utils = require('lyonscg/util/utils');

module.exports = {
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
                    thisModule.showDialog(response, callback);
                }
            },
            error: function () {
            }
        });
    },

    showDialog: function (response, callback) {
        var dialogResources = response.dialog;

        var originalAddressHtml = '<div>'
            + '<div class="label-sm">' + dialogResources.originAddressTxt + '</div>'
            + '<div>' + response.originalAddress.address1 + '</div>'
            + ((response.originalAddress.address2 !== '') ? '<div>' + response.originalAddress.address2 + '</div>' : '')
            + '<div>' + response.originalAddress.city + '&nbsp;'
            + response.originalAddress.state + '&nbsp;'
            + response.originalAddress.postalCode + '&nbsp;'
            + '</div>'
            + '<div class="mb-2">' + response.originalAddress.country + '</div>'
            + '<button class="use-original-address btn btn-outline-secondary mr-2">'
            + dialogResources.useThisAddressBtn
            + '</button>'
            + '<button class="edit-address btn btn-secondary">'
            + dialogResources.editAddressBtn
            + '</button>'
            + '</div>';

        var correctedAddressHtml = '<div class="mb-3">' + dialogResources.addressNotFoundTxt + '</div>';
        if (response.correctedAddress) {
            correctedAddressHtml = '<div class="mb-3">'
                + '<div class="label-sm">' + dialogResources.correctedAddressTxt + '</div>'
                + '<div>' + response.correctedAddress.address1 + '</div>'
                + ((response.correctedAddress.address2 !== '') ? '<div>' + response.correctedAddress.address2 + '</div>' : '')
                + '<div>' + response.correctedAddress.city + '&nbsp;'
                + response.correctedAddress.state + '&nbsp;'
                + response.correctedAddress.postalCode + '&nbsp;'
                + '</div>'
                + '<div class="mb-2">' + response.correctedAddress.country + '</div>'
                + '<button class="use-suggested-address btn btn-outline-secondary">'
                + dialogResources.useThisAddressBtn
                + '</button>'
                + '</div>';
        }

        var topTextHtml = '<div class="text-danger mb-2">' + dialogResources.errorValidationAsset + '</div>'
            + '<div class="label-xl mb-3">' + dialogResources.indicateTheAddressTxt + ':</div>';

        var htmlString = '<!-- Modal -->'
            + '<div class="modal" id="address-validation" tabindex="-1" role="dialog" aria-labelledby="modal-title" data-la-initdispnone="true">'
            + '<div class="modal-dialog" role="document">'
            + '<!-- Modal content-->'
            + '<div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">'
            + '<div class="modal-header">'
            + '<h4 class="modal-title">'
            + dialogResources.headerTitle
            + '</h4>'
            + '</div>'
            + '<div class="modal-body">' + topTextHtml + correctedAddressHtml + originalAddressHtml + '</div>'
            + '</div>'
            + '</div>'
            + '</div>';
        $('#checkout-main').append(htmlString);

        // Use original address
        $('#address-validation button.use-original-address').click(function (e) {
            e.preventDefault();
            // Mark basket with address validation error
            $.ajax({
                url: $('#checkout-main').attr('data-use-original-address-url'),
                type: 'get',
                dataType: 'json',
                success: function () {
                },
                error: function () {
                }
            });
            $('#address-validation').remove();
            $('.modal-backdrop').remove();
            callback();
        });

        var form = $('.single-shipping .shipping-form');
        var currentModule = this;

        // Edit Address
        $('#address-validation button.edit-address').click(function (e) {
            e.preventDefault();
            form.attr('data-address-mode', 'details');
            $('#address-validation').remove();
            $('.modal-backdrop').remove();
        });

        // Use suggested address
        $('#address-validation button.use-suggested-address').click(function (e) {
            e.preventDefault();
            currentModule.updateAddress(form, response.correctedAddress);
            $('#address-validation').remove();
            $('.modal-backdrop').remove();
            // Validate all fields before submit
            $('input:visible, select:visible').trigger('invalid');
            var visibleInvalidInputs = $('input.is-invalid:visible, select.is-invalid:visible');
            if (visibleInvalidInputs.length > 0) {
                // scroll to any exposed errors
                utils.scrollBrowser(visibleInvalidInputs.first().offset().top - 30);
            } else {
                callback();
            }
        });
        $('#address-validation').modal();
    },

    updateAddress: function (form, address) {
        form.find('input[name$="_address1"]').val(address.address1);
        form.find('input[name$="_address2"]').val(address.address2);
        form.find('input[name$="_city"]').val(address.city);
        form.find('select[name$="_country"]').val(address.country);
        form.find('input[name$="_postalCode"]').val(address.postalCode).change();
        form.find('select[name$="_stateCode"]').val(address.state);
    }
};
