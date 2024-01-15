'use strict';

var addressHelpers = require('base/checkout/address');
var cleave = require('org/components/cleave');

/**
 * updates the billing address selector within billing forms
 * @param {Object} order - the order model
 * @param {Object} customer - the customer model
 */
function updateBillingAddressSelector(order, customer) {
    var shippings = order.shipping;

    var form = $('form[name$=billing]')[0];
    var $billingAddressSelector = $('.addressSelector', form);
    var hasSelectedAddress = false;

    if ($billingAddressSelector && $billingAddressSelector.length === 1) {
        $billingAddressSelector.empty();
        // Add New Address option
        $billingAddressSelector.append(addressHelpers.methods.optionValueForAddress(
            null,
            false,
            order,
            { type: 'billing' }));

        // Separator -
        $billingAddressSelector.append(addressHelpers.methods.optionValueForAddress(
            order.resources.shippingAddresses, false, order, {
                // className: 'multi-shipping',
                type: 'billing'
            }
        ));

        shippings.forEach(function (aShipping) {
            var isSelected = order.billing.matchingAddressId === aShipping.UUID;
            hasSelectedAddress = hasSelectedAddress || isSelected;
            // Shipping Address option
            if (aShipping.selectedShippingMethod.ID !== 'dealer-pickup') {
                $billingAddressSelector.append(
                    addressHelpers.methods.optionValueForAddress(aShipping, isSelected, order,
                        {
                            // className: 'multi-shipping',
                            type: 'billing'
                        }
                    )
                );
            }
        });

        if (customer.addresses && customer.addresses.length > 0) {
            $billingAddressSelector.append(addressHelpers.methods.optionValueForAddress(
                order.resources.accountAddresses, false, order));
            customer.addresses.forEach(function (address) {
                var isSelected = order.billing.matchingAddressId === address.ID;
                hasSelectedAddress = hasSelectedAddress || isSelected;
                // Customer Address option
                $billingAddressSelector.append(
                    addressHelpers.methods.optionValueForAddress({
                        UUID: 'ab_' + address.ID,
                        shippingAddress: address
                    }, isSelected, order, { type: 'billing' })
                );
            });
        }
    }

    if (hasSelectedAddress
        || (!order.billing.matchingAddressId && order.billing.billingAddress.address)) {
        // show
        $(form).attr('data-address-mode', 'edit');
    } else {
        $(form).attr('data-address-mode', 'new');
    }

    $billingAddressSelector.show();
}

/**
 * updates the billing address form values within payment forms
 * @param {Object} order - the order model
 * @param {Object} customer - the customer model
 */
function updateBillingAddressFormValues(order, customer) {
    var billing = order.billing;
    if (!billing.billingAddress || !billing.billingAddress.address) return;

    var form = $('form[name=dwfrm_billing]');
    if (!form) return;

    $('input[name$=_firstName]', form).val(billing.billingAddress.address.firstName);
    $('input[name$=_lastName]', form).val(billing.billingAddress.address.lastName);
    $('input[name$=_address1]', form).val(billing.billingAddress.address.address1);
    $('input[name$=_address2]', form).val(billing.billingAddress.address.address2);
    $('input[name$=_city]', form).val(billing.billingAddress.address.city);
    $('input[name$=_postalCode]', form).val(billing.billingAddress.address.postalCode);
    $('select[name$=_stateCode],input[name$=_stateCode]', form)
        .val(billing.billingAddress.address.stateCode);
    // Uncomment if they expand to multi-country shipping/purchasing
    // if ('value' in billing.billingAddress.address.countryCode) {
    //     $('select[name$=_country]', form).val(billing.billingAddress.address.countryCode.value);
    // }
    $('input[name$=_phone]', form).val(billing.billingAddress.address.phone);

    // Set email address from basket email or from user profile, otherwise it will be empty
    var email = '';
    if (order.orderEmail) {
        email = order.orderEmail;
    } else if (customer.registeredUser) {
        email = customer.profile.email;
    }
    $('input[name$=_email]', form).val(email);

    if (billing.payment && billing.payment.selectedPaymentInstruments
        && billing.payment.selectedPaymentInstruments.length > 0) {
        var instrument = billing.payment.selectedPaymentInstruments[0];
        $('select[name$=expirationMonth]', form).val(instrument.expirationMonth);
        $('select[name$=expirationYear]', form).val(instrument.expirationYear);
        // Force security code and card number clear
        $('input[name$=securityCode]', form).val('');
        $('input[name$=cardNumber]').data('cleave').setRawValue('');
    }
}

/**
 * clears the billing address form values
 */
function clearBillingAddressFormValues() {
    updateBillingAddressFormValues({
        billing: {
            billingAddress: {
                address: {
                    countryCode: {}
                }
            }
        }
    }, { registeredUser: false });
}

/**
 * Updates the billing information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 * @param {Object} customer - customer model to use as basis of new truth
 * @param {Object} [options] - options
 */
function updateBillingInformation(order, customer) {
    updateBillingAddressSelector(order, customer);

    // update billing address form
    updateBillingAddressFormValues(order, customer);

    // update billing address summary
    addressHelpers.methods.populateAddressSummary('.billing .address-summary',
        order.billing.billingAddress.address);

    // update billing parts of order summary
    $('.order-summary-email').text(order.orderEmail);

    if (order.billing.billingAddress.address) {
        $('.order-summary-phone').text(order.billing.billingAddress.address.phone);
    }
}

/**
 * Updates the payment information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 */
function updatePaymentInformation(order) {
    // update payment details
    var $paymentSummary = $('.payment-details');
    var htmlToAppend = '';

    if (order.billing.payment && order.billing.payment.selectedPaymentInstruments
        && order.billing.payment.selectedPaymentInstruments.length > 0) {
        if (order.billing.payment.selectedPaymentInstruments[0].paymentMethod === 'CREDIT_CARD') {
            var ccType = order.billing.payment.selectedPaymentInstruments[0].type;
            var ccMaster = order.resources.cardMaster;

            htmlToAppend += '<span>' + order.resources.cardType + ' '
                + (ccType.toUpperCase() === 'MASTER' ? ccMaster : ccType)
                + '</span><div>'
                + order.billing.payment.selectedPaymentInstruments[0].formattedCreditCardNumber
                + '</div><div><span>'
                + order.resources.cardEnding + ' '
                + order.billing.payment.selectedPaymentInstruments[0].expirationMonth
                + '/' + order.billing.payment.selectedPaymentInstruments[0].expirationYear
                + '</span></div>';
        } else if (order.billing.payment.selectedPaymentInstruments[0].paymentMethod === 'TD_FINANCE') {
            var selectedPI = order.billing.payment.selectedPaymentInstruments[0];
            var promoFee = selectedPI.processFee ? selectedPI.lang.promoFee : '';
            htmlToAppend += '<div class="finance-card-method">'
                + selectedPI.paymentName
                + '</div>'
                + '<div class="finance-card-terms">'
                + '<span>' + selectedPI.lang.terms + ': </span>'
                + '<strong>' + selectedPI.termName + '<sup>' + selectedPI.ss + '</sup></strong>'
                + '<a href="javascript:void(0)" data-url="' + selectedPI.disclosureUrl + '"  data-title="' + selectedPI.lang.detailsTitle + '" class="td-payment-details">'
                + selectedPI.lang.seeDetails
                + '</a>'
                + '</div>'
                + '<div class="finance-card-amount">'
                + '<span>' + selectedPI.lang.amountFinanced + ': </span>'
                + selectedPI.formattedAmount
                + '</div>'
                + '<div class="finance-card-number">'
                + '<span>' + selectedPI.lang.accountNumber + ': </span>'
                + selectedPI.accountNumber
                + '</div>'
                + '<div class="finance-promofee">'
                + '<span>' + promoFee + '</span>'
                + '</div>';
        }
    }

    $paymentSummary.empty().append(htmlToAppend);
}

/**
 * clears the credit card form
 */
function clearCreditCardForm() {
    $('input[name$="_cardNumber"]').data('cleave').setRawValue('');
    $('select[name$="_expirationMonth"]').val('');
    $('select[name$="_expirationYear"]').val('');
    $('input[name$="_securityCode"]').val('');
}

$('body').on('click', '.payment-options .nav-item', function (e) {
    e.preventDefault();
    var methodID = $(this).data('method-id');
    // Update value on hidden field
    $('input[name$="dwfrm_billing_paymentMethod"]').attr('value', methodID);
    $('.payment-information').data('payment-method-id', methodID);
    var clickType;
    if(methodID === 'TD_FINANCE'){
        if($('.js-account-number').val().length == 0){
            $(".js-pay-btn").attr("disabled", true);
        } else if($('.js-account-number').val() != '' && $('.js-account-number').val().length != 0) {
            var accountNumber = $('.js-account-number').val().replaceAll('-','');
            if(accountNumber.length < 16){
                clickType = 'orderReview';
                updateTDErrorMsg(clickType);
            }
           
        }
    }
});

$('.submit-payment.js-pay-btn').on('click', function(e){
    if($('.payment-options .nav-item .finance-card-tab').hasClass('active')){
        var accountNumber = $('.js-account-number').val().replaceAll('-','');
        var clickType = 'orderReview';
        if(accountNumber.length < 16){
            updateTDErrorMsg(clickType);
        }
    }
})

function updateTDErrorMsg(clickType){
    var errorIndex = 0;
    $('.js-account-number').addClass('is-invalid');
    $('.js-account-number').removeClass('is-valid-custom');
    $(".js-pay-btn").attr("disabled", true);
    var $label = $("label[for='" + $('.js-account-number').attr('id') + "']");
    $label.addClass('text-danger');
    var $errorField = $('.js-account-number').parents('.form-group').find('.invalid-feedback');
    var uniqueErrorID = Date.now().toString() + errorIndex.toString();
    var fieldName = $label.length ? ('(' + $label.first().text().trim() + ') ') : '';
    errorIndex++;
    $errorField.attr('id', uniqueErrorID);
    if(clickType == "TDSelect"){
        $errorField.html('<strong> Required Field: </strong>(Enter your account number) Please fill out this field.');
    } else if(clickType == 'orderReview'){
        $errorField.html('<strong> Please enter a valid account number.</strong>');
    }
    $('.js-account-number').attr('aria-describedby', uniqueErrorID);
}

module.exports = {
    methods: {
        updateBillingAddressSelector: updateBillingAddressSelector,
        updateBillingAddressFormValues: updateBillingAddressFormValues,
        clearBillingAddressFormValues: clearBillingAddressFormValues,
        updateBillingInformation: updateBillingInformation,
        updatePaymentInformation: updatePaymentInformation,
        clearCreditCardForm: clearCreditCardForm
    },

    showBillingDetails: function () {
        $('.btn-show-billing-details').on('click', function () {
            $(this).parents('[data-address-mode]').attr('data-address-mode', 'new');
        });
    },

    hideBillingDetails: function () {
        $('.btn-hide-billing-details').on('click', function () {
            $(this).parents('[data-address-mode]').attr('data-address-mode', 'shipment');
        });
    },

    selectBillingAddress: function () {
        $('.payment-form .addressSelector').on('change', function () {
            var form = $(this).parents('form')[0];
            var selectedOption = $('option:selected', this);
            var optionID = selectedOption[0].value;

            if (optionID === 'new') {
                // Show Address
                $(form).attr('data-address-mode', 'new');
            } else {
                // Hide Address
                $(form).attr('data-address-mode', 'shipment');
            }

            // Copy fields
            var attrs = selectedOption.data();
            var element;

            Object.keys(attrs).forEach(function (attr) {
                element = attr === 'countryCode' ? 'country' : attr;
                if (element === 'cardNumber') {
                    $('.cardNumber').data('cleave').setRawValue(attrs[attr]);
                } else if (element !== 'country') {
                    // do not change countryCode selection
                    // revert after multi-country select enabled
                    $('[name$=' + element + ']', form).val(attrs[attr]);
                }
            });
        });
    },

    handleCreditCardNumber: function () {
        cleave.handleCreditCardNumber('.cardNumber', '#cardType');
    },

    formatAccountNumber: function () {
        $('#accountNumber').on('change keypress', function () {
            var acctNum = $(this).val().split('-').join(''); // remove hyphens
            if (acctNum.length > 0) {
                acctNum = acctNum.match(new RegExp('.{1,4}', 'g')).join('-');
            }
            $(this).val(acctNum);
        });
    },

    santitizeForm: function () {
        $('body').on('checkout:serializeBilling', function (e, data) {
            var serializedForm = cleave.serializeData(data.form);

            data.callback(serializedForm);
        });
    },

    selectSavedPaymentInstrument: function () {
        $(document).on('click', '.saved-payment-instrument', function (e) {
            e.preventDefault();
            // only handle if a different payment instrument
            if ($(this).find('.saved-payment-security-code')[0].hasAttribute('required')) {
                return;
            }
            // clear radio selection
            $('.stored-payments .custom-radio input').each(function () {
                $(this).prop('checked', false);
            });
            $(this).find('.custom-radio input').prop('checked', true);
            $('.saved-payment-security-code').val('');
            $('.saved-payment-instrument').removeClass('selected-payment');
            $(this).addClass('selected-payment');
            $('.saved-payment-instrument .card-image').removeClass('checkout-hidden');
            $('.saved-payment-instrument .security-code-input').addClass('checkout-hidden');
            // clear previous validation
            $('.saved-payment-instrument .security-code-input input').removeAttr('required');
            $('.saved-payment-instrument .security-code-input').find('label').removeClass('text-danger');
            $('.saved-payment-instrument .security-code-input input').removeClass('is-invalid');
            // add validation to exposed input
            $('.saved-payment-instrument.selected-payment .security-code-input').removeClass('checkout-hidden');
            $('.saved-payment-instrument.selected-payment .security-code-input input').attr('required', true);
        });
    },

    addNewPaymentInstrument: function () {
        $('.btn.add-payment').on('click', function (e) {
            e.preventDefault();
            $('.payment-information').data('is-new-payment', true);
            clearCreditCardForm();
            $('.credit-card-form').removeClass('checkout-hidden');
            $('.user-payment-instruments').addClass('checkout-hidden');
        });
    },

    cancelNewPayment: function () {
        $('.cancel-new-payment').on('click', function (e) {
            e.preventDefault();
            $('.payment-information').data('is-new-payment', false);
            clearCreditCardForm();
            $('.user-payment-instruments').removeClass('checkout-hidden');
            $('.credit-card-form').addClass('checkout-hidden');
        });
    },

    clearBillingForm: function () {
        $('body').on('checkout:clearBillingForm', function () {
            clearBillingAddressFormValues();
        });
    }
};
