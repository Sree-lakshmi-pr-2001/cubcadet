/* global google */
'use strict';
var shippingHelpers = require('org/checkout/shipping');
var addressHelpers = require('base/checkout/address');
var clientSideValidation = require('org_ma/components/clientSideValidation');

/**
 * Select shipping method
 * @param {string} methodID - shipping method ID
 */
function selectShippingMethod(methodID) {
    var $shippingForm = $('.shipping-form');
    var shipmentUUID = $shippingForm.find('[name=shipmentUUID]').val();
    var urlParams = addressHelpers.methods.getAddressFieldsFromUI($shippingForm);
    // var urlParams = {};
    urlParams.shipmentUUID = shipmentUUID;
    urlParams.methodID = methodID;
    urlParams.isGift = $shippingForm.find('.gift').prop('checked');
    urlParams.giftMessage = $shippingForm.find('textarea[name$=_giftMessage]').val();

    var url = $('.dealer-shipping-block').data('select-shipping-method-url');
    shippingHelpers.methods.selectShippingMethodAjax(url, urlParams);
}

/**
 * Normalize zip code
 * @param {string} zipCode - zip code
 * @returns {string} - normalized zip code
 */
function normalizeZipCode(zipCode) {
    var zipCodeParts = zipCode.split('-');
    return $.trim(zipCodeParts[0]);
}

/**
 * Helper for input active state styles
 */
function updateInputState() {
    // set selection to outer cards separately
    $('body').on('click', '.dealer-option', function () {
        // clear delivery selection
        $('input[name=dealer-delivery]').attr('checked', false);
        // new selection
        $(this).find('input[name=dealer-delivery]').attr('checked', true)
        .trigger('change');
    });

    // set selection of dealer pickup
    $('body').on('click', '.pickup-option', function () {
        $('input[name=dealer-pickup]').attr('checked', false);
        $(this).find('input[name=dealer-pickup]').attr('checked', true)
        .trigger('change');
    });

    // update active state of input containers
    $('body').on('change', 'input[name=dealer-pickup]', function () {
        $('.pickup-option').removeClass('active');
        $('input[name=dealer-pickup]:checked').closest('.pickup-option').addClass('active');
    });
    $('body').on('change', 'input[name=dealer-delivery]', function () {
        $('.dealer-option').removeClass('active');
        $('input[name=dealer-delivery]:checked').closest('.dealer-option').addClass('active');
    });
}

/**
 * Verify Dealer Lookup Zip with Delivery Zip Code
 */
function verifyDealerAndShippingZipCode() {
    var dealerShippingBlock = $('.dealer-shipping-block');
    var dealerCurrentShippingMethod = $('#dealerShippingMethod').val();
    var dealerDeliveryMethodID = dealerShippingBlock.data('deliveryMethod');
    var ableToDeliver = dealerShippingBlock.data('ableToDeliver');
    var nextPaymentButton = $('.submit-shipping');
    // We should verify zip codes only if we have dealer delivery
    if (ableToDeliver && dealerCurrentShippingMethod === dealerDeliveryMethodID) {
        var dealerZipCodeInput = $('#dealerZipCode');
        var deliveryZipCodeInput = $('#shippingZipCode');
        var errorMsg = $('.dealer-zip-code-error');
        var dealerLookupCode = normalizeZipCode($.trim(dealerZipCodeInput.val()));
        var devileryZipCode = normalizeZipCode($.trim(deliveryZipCodeInput.val()));
        // If dealer and delivery zip code are not empty and doesn't match
        // we need to show error and disable next step button
        if (dealerLookupCode !== ''
            && devileryZipCode !== ''
            && dealerLookupCode !== devileryZipCode) {
            dealerZipCodeInput.addClass('is-invalid');
            dealerZipCodeInput.addClass('has-error');
            deliveryZipCodeInput.addClass('has-error');
            errorMsg.css('display', 'inline');
            errorMsg.siblings('label').addClass('text-danger');
            nextPaymentButton.attr('disabled', 'disabled');
        } else {
            dealerZipCodeInput.removeClass('is-invalid');
            dealerZipCodeInput.removeClass('has-error');
            deliveryZipCodeInput.removeClass('has-error');
            errorMsg.hide();
            errorMsg.siblings('label').removeClass('text-danger');
            nextPaymentButton.removeAttr('disabled');
        }
    }
}

/**
 * Initiate shipping summary UI
 */
function shippingSummaryInit() {
    var dealerShippingBlock = $('.dealer-shipping-block');
    // Verify that DF is enabled
    if (dealerShippingBlock.length === 0) {
        return;
    }
    var dealerCurrentShippingMethod = dealerShippingBlock.length > 0 ? $('#dealerShippingMethod').val() : '';
    var dealerDeliveryMethodID = dealerShippingBlock.data('deliveryMethod');
    var dealerPickupMethodID = dealerShippingBlock.data('pickupMethod');

    var factoryDeliveryHeader = $('.factory-delivery-header');
    var dealerDeliveryHeader = $('.dealer-delivery-header');
    var dealerPickupHeader = $('.dealer-pickup-header');
    var factoryDeliveryTitle = $('.shipping-addr-label');
    var dealerDeliveryTitle = $('.dealer-delivery-addr-label');
    var dealerPickupTitle = $('.dealer-pickup-addr-label');
    var addressFirstName = $('.address-summary').find('.firstName');
    var addressLastName = $('.address-summary').find('.lastName');
    var addressDealerName = $('.address-summary').find('.dealerName');
    var shippingMethodBlock = $('.shipping-method-info');
    var dealerInfoBlock = $('.shipping-dealer-info-block');

    if (dealerCurrentShippingMethod === dealerDeliveryMethodID) { // Dealer Delivery
        factoryDeliveryHeader.addClass('hidden');
        dealerPickupHeader.addClass('hidden');
        factoryDeliveryTitle.addClass('hidden');
        dealerPickupTitle.addClass('hidden');
        addressDealerName.addClass('hidden');
        shippingMethodBlock.addClass('hidden');

        dealerDeliveryHeader.removeClass('hidden');
        dealerDeliveryTitle.removeClass('hidden');
        addressFirstName.removeClass('hidden');
        addressLastName.removeClass('hidden');
        dealerInfoBlock.removeClass('hidden');
    } else if (dealerCurrentShippingMethod === dealerPickupMethodID) { // Dealer Pickup
        factoryDeliveryHeader.addClass('hidden');
        dealerDeliveryHeader.addClass('hidden');
        factoryDeliveryTitle.addClass('hidden');
        dealerDeliveryTitle.addClass('hidden');
        addressFirstName.addClass('hidden');
        addressLastName.addClass('hidden');
        shippingMethodBlock.addClass('hidden');
        dealerInfoBlock.addClass('hidden');

        dealerPickupHeader.removeClass('hidden');
        dealerPickupTitle.removeClass('hidden');
        addressDealerName.removeClass('hidden');
    } else { // Factory Shipping
        dealerDeliveryHeader.addClass('hidden');
        dealerPickupHeader.addClass('hidden');
        dealerDeliveryTitle.addClass('hidden');
        dealerPickupTitle.addClass('hidden');
        addressDealerName.addClass('hidden');
        dealerInfoBlock.addClass('hidden');

        factoryDeliveryHeader.removeClass('hidden');
        factoryDeliveryTitle.removeClass('hidden');
        addressFirstName.removeClass('hidden');
        addressLastName.removeClass('hidden');
        shippingMethodBlock.removeClass('hidden');
    }
}

/**
 * Initiate function of dealer fulfillment
 */
function initDealerUI() {
    var dealerShippingBlock = $('.dealer-shipping-block');
    // If we have dealer fulfillment enabled
    if (dealerShippingBlock.length === 0) {
        return;
    }
    var dealerAbleToDeliver = dealerShippingBlock.data('ableToDeliver');
    var factoryShippingEnabled = dealerShippingBlock.data('factoryShipping');
    var dealerCurrentShippingMethod = $('#dealerShippingMethod').val();
    var dealerDeliveryMethodID = dealerShippingBlock.data('deliveryMethod');
    var dealerPickupMethodID = dealerShippingBlock.data('pickupMethod');
    var factoryShippingMethodBlock = $('.shipping-method-block');
    var factoryShippingAddressBlock = $('.view-address-block');
    var dealerShippingOptions = $('.dealer-shipping-options');
    var shippingContent = $('.shipping-content');
    var nextPaymentButton = $('.submit-shipping');
    // Verify if we need to hide shipping item
    var hideShippingItem = dealerShippingBlock.data('hideShippingItem');
    var shippingLineItem = $('.order-total-summary').find('.shipping-item');
    if (hideShippingItem) {
        shippingLineItem.addClass('hidden');
    } else {
        shippingLineItem.removeClass('hidden');
    }
    // If we have dealer delivery selected we need to hide factory shipping methods
    if (dealerAbleToDeliver && dealerCurrentShippingMethod === dealerDeliveryMethodID) {
        factoryShippingMethodBlock.hide();
        factoryShippingAddressBlock.hide();
    } else {
        factoryShippingMethodBlock.show();
    }
    // If we have pickup method selected hide factory shipping
    if (dealerCurrentShippingMethod === dealerPickupMethodID) {
        shippingContent.hide();
    } else {
        shippingContent.show();
    }

    // If we selected factory shipping hide any dealer shipping options
    if (dealerCurrentShippingMethod === '') {
        dealerShippingOptions.addClass('hidden');
    }

    // If we have no dealer shipping options and no factory shipping we need to disable button
    if (dealerShippingOptions.length === 0 && !factoryShippingEnabled) {
        shippingContent.hide();
        nextPaymentButton.attr('disabled', 'disabled');
    } else {
        nextPaymentButton.removeAttr('disabled');
        if (dealerCurrentShippingMethod !== dealerPickupMethodID) {
            shippingContent.show();
        }
    }
    // clear existing error on label
    $('label').removeClass('text-danger');

    // Verify Zip codes
    verifyDealerAndShippingZipCode();
    // Verify Shipping Summary elements
    shippingSummaryInit();
}

/**
 * Change shipping address on changing shipping method
 */
function changeShippingAddress() {
    var currentShippingMethod = $('#dealerShippingMethod').val();
    var dealerShippingBlock = $('.dealer-shipping-block');
    var dealerPickupMethodID = dealerShippingBlock.data('pickupMethod');
    var shippingForm = $('.shipping-form');
    var shippingFormAddressSelector = shippingForm.find('select[name=shipmentSelector]');
    var address = {
        firstName: '',
        lastName: '',
        address1: '',
        address2: '',
        city: '',
        postalCode: '',
        stateCode: '',
        countryCode: '',
        phone: ''
    };
    address = dealerShippingBlock.data('currentShippingAddress');

    // If we have a dealer pickup shipping method we need to enter selected pickup address
    // Otherwise we need to enter preferred customer address if it exists
    if (currentShippingMethod === dealerPickupMethodID) {
        var pickupAddressString = $('input[name=dealer-pickup]:checked').val();
        var pickupAddress;
        try {
            pickupAddress = JSON.parse(pickupAddressString);
        } catch (e) {
            window.console.log(e);
        }
        if (pickupAddress) {
            address = {
                firstName: dealerShippingBlock.data('deliveryPickupFirstname'),
                lastName: dealerShippingBlock.data('deliveryPickupLastname'),
                address1: pickupAddress.dealerAddress.address1,
                address2: pickupAddress.dealerAddress.address2 || '',
                city: pickupAddress.dealerAddress.city,
                postalCode: pickupAddress.dealerAddress.postalCode,
                stateCode: pickupAddress.dealerAddress.state,
                countryCode: pickupAddress.dealerAddress.countryCode,
                phone: pickupAddress.dealerAddress.phone.replace(/[() -]/ig, '')
            };
        }
    } else if (address.firstName === '' && shippingFormAddressSelector.find('option.customer-address-option').length > 0) {
        var preferredAddressOption = shippingFormAddressSelector.find('option.customer-address-option:eq(0)');
        address = {
            firstName: preferredAddressOption.data('firstName'),
            lastName: preferredAddressOption.data('lastName'),
            address1: preferredAddressOption.data('address1'),
            address2: preferredAddressOption.data('address2') || '',
            city: preferredAddressOption.data('city'),
            postalCode: preferredAddressOption.data('postalCode'),
            stateCode: preferredAddressOption.data('stateCode'),
            countryCode: preferredAddressOption.data('countryCode'),
            phone: preferredAddressOption.data('phone')
        };
    }
    // Change address
    shippingForm.find('input[name$=_firstName]').val(address.firstName);
    shippingForm.find('input[name$=_lastName]').val(address.lastName);
    shippingForm.find('input[name$=_address1]').val(address.address1);
    shippingForm.find('input[name$=_address2]').val(address.address2);
    shippingForm.find('input[name$=_city]').val(address.city);
    shippingForm.find('input[name$=_postalCode]').val(address.postalCode);
    shippingForm.find('select[name$=_stateCode], input[name$=_stateCode]').val(address.stateCode);
    shippingForm.find('select[name$=_country]').val(address.countryCode);
    shippingForm.find('input[name$=_phone]').val(address.phone);
}

/**
 * Show Dialog Window
 * @param {stirng} elementId - element ID
 * @param {string} htmlContent - HTML content
 * @param {string} title - title
 */
function showDialog(elementId, htmlContent, title) {
    if ($('.modal').length !== 0) {
        $('.modal').remove();
    }
    var htmlString = '<!-- Modal -->'
        + '<div class="modal fade" id="' + elementId + '" role="dialog" aria-labelledby="modal-title" data-la-initdispnone="true">'
        + '<div class="modal-dialog" role="document">'
        + '<!-- Modal content-->'
        + '<div class="modal-content">'
        + '<div class="modal-header">'
        + title
        + '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'
        + '<span aria-hidden="true"></span>'
        + '</button>'
        + '</div>'
        + '<div class="modal-body">' + htmlContent + '</div>'
        + '</div>'
        + '</div>'
        + '</div>';
    $('#main').append(htmlString);
    $('#' + elementId).modal({ backdrop: 'static', keyboard: false });
}

/**
 * Replace CARB products
 */
function replaceCarb() {
    $('#carbReplace').on('submit', function (e) {
        e.preventDefault();
        var url = $(this).attr('action');
        var zipCode = $('#dealerZipCode').length > 0 ? $.trim($('#dealerZipCode').val()) : null;
        var $shippingForm = $('.shipping-form');
        var countryCode = $shippingForm.find('#shippingCountry').val();

        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: { zipCode: zipCode, countryCode: countryCode }
        })
        .done(function (data) {
            if (data.success) {
                var dealerShippingBlock = $('.dealer-shipping-block');
                // If we don't have a dealer fulfillement
                if (dealerShippingBlock.length === 0) {
                    // We need to pass all shipping form to save it
                    var shippingFormData = $shippingForm.serialize();
                    var shippingContactFormData = $('form.shipping-contact-form').serialize();
                    shippingFormData += '&' + shippingContactFormData;
                    $.ajax({
                        url: $shippingForm.attr('action'),
                        type: 'post',
                        data: shippingFormData,
                        success: function () {
                            $.spinner().stop();
                            window.location.reload(true);
                        },
                        error: function () {
                            $.spinner().stop();
                        }
                    });
                } else {
                    $.spinner().stop();
                    window.location.reload(true);
                }
            } else {
                $('#carbContent').find('.error-msg').html(data.msg);
            }
        })
        .fail(function () {
            $.spinner().stop();
        });
        return false;
    });
}

/**
 * Verify CARB compliance
 * @param {function} callback - callback function
 */
function verifyCarb(callback) {
    $.spinner().start();
    var url = $('.shipping-form').data('carbUrl');
    $.ajax({
        url: url,
        type: 'get',
        dataType: 'html'
    })
    .done(function (data) {
        $.spinner().stop();
        try {
            var jsonResponse = JSON.parse(data);
            if (!jsonResponse.showDialog) {
                if (typeof callback !== 'undefined') {
                    callback();
                }
                return;
            }
        } catch (e) {
            window.console.log(e);
        }
        if (data) {
            var htmlData = $(data);
            showDialog('carbCompliance', data, htmlData.find('#dialogTitle').html());
            replaceCarb();
        }
    })
    .fail(function () {
        $.spinner().stop();
    });
}

/**
 * Carb Compliance
 * @param {function} callback - callback function
 */
function carbCompliance(callback) {
    // Verify that CARB compliance is enabled
    var dealerShippingBlock = $('.dealer-shipping-block');
    // If we have dealer fulfillment enabled
    if (dealerShippingBlock.length === 0) {
        return;
    }
    var carbEnabled = dealerShippingBlock.data('carbEnabled');
    var carbComplianceCheck = dealerShippingBlock.data('carbCompliance');
    if (carbEnabled === true && carbComplianceCheck === true) {
        verifyCarb(callback);
    } else if (typeof callback !== 'undefined') {
        callback();
    }
}

module.exports = {
    methods: {
        shippingSummaryInit: shippingSummaryInit,
        verifyCarb: verifyCarb
    },
    switchDealerShippingOption: function () {
        $('body').on('click', '.dealer-shipping-option', function (e) {
            e.preventDefault();
            if (!$(this).hasClass('selected')) {
                var methodId = $(this).data('methodId');
                // Set dealer shipping method
                $('#dealerShippingMethod').val(methodId);
                // Change address if needed
                changeShippingAddress();
                // Initiate Dealer UI
                initDealerUI();
                // Set shipping new method
                selectShippingMethod(methodId);
                $('.dealer-shipping-option').removeClass('selected');
                $(this).addClass('selected');

                if (methodId !== '') {
                    var dealerShippingBlock = $('.dealer-shipping-block');
                    var dealerDeliveryMethod = dealerShippingBlock.data('deliveryMethod');
                    var dealerPickupMethod = dealerShippingBlock.data('pickupMethod');
                    var currentMethodId = (methodId === dealerDeliveryMethod) ? dealerPickupMethod : dealerDeliveryMethod;

                    $('.dealer-shipping-options.' + methodId).removeClass('hidden');
                    $('.dealer-shipping-options.' + currentMethodId).addClass('hidden');
                }
            }
        });
    },
    showMoreLessOptions: function () {
        $('body').on('click', '.show-more-less', function (e) {
            e.preventDefault();
            var showMoreTxt = $(this).data('moreTxt');
            var showLessTxt = $(this).data('lessTxt');
            var invisibleDiv = $(this).prev('div.invisible-options');
            if (invisibleDiv.hasClass('hidden')) {
                invisibleDiv.removeClass('hidden');
                $(this).text(showLessTxt);
            } else {
                invisibleDiv.addClass('hidden');
                $(this).text(showMoreTxt);
            }
        });
    },
    dealerLookup: function () {
        $('body').on('click', '.submit-dealer-lookup', function (e) {
            e.preventDefault();
            var dealerShippingBlock = $('.dealer-shipping-block');
            var lookupUrl = dealerShippingBlock.data('dealerLookupUrl');
            var zipCodeInput = $('#dealerZipCode');
            var deliveryZipCodeInput = $('#shippingZipCode');
            var errorMsg = $('.dealer-zip-code-error');
            var zipCode = $.trim(zipCodeInput.val());
            if (zipCode !== '') {
                // verify that we doesn't have pattern error
                if (zipCodeInput.hasClass('is-invalid') && !zipCodeInput.hasClass('has-error')) {
                    return;
                }
                // Remove previously error from zip validation
                zipCodeInput.removeClass('is-invalid');
                zipCodeInput.closest('.form-group').find('label').removeClass('text-danger');
                errorMsg.hide();
                deliveryZipCodeInput.removeClass('has-error');

                var $shippingForm = $('.shipping-form');
                var countryCode = $shippingForm.find('#shippingCountry').val();
                $.spinner().start();
                $.ajax({
                    url: lookupUrl,
                    type: 'post',
                    dataType: 'html',
                    data: { zipCode: zipCode, countryCode: countryCode }
                })
                .done(function (data) {
                    var dataContent = $(data);
                    if (dataContent.find('.dealer-shipping-block')) {
                        dealerShippingBlock.replaceWith(data);
                        // CARB check
                        carbCompliance();
                        initDealerUI();
                        clientSideValidation.invalid();
                        changeShippingAddress();
                        var dealerShippingMethodElement = $('#dealerShippingMethod');
                        var factoryShippingMethodElements = $('.shipping-method-list').find('[name$="_shippingMethodID"]');
                        var methodId = '';
                        if (dealerShippingMethodElement.length > 0) {
                            methodId = dealerShippingMethodElement.val();
                        } else if (factoryShippingMethodElements.length > 0) {
                            methodId = factoryShippingMethodElements.val();
                        }
                        // Set shipping new method
                        selectShippingMethod(methodId);
                    }
                    $.spinner().stop();
                })
                .fail(function () {
                    $.spinner().stop();
                });
            } else {
                zipCodeInput.siblings('.invalid-feedback').html(zipCodeInput.data('missing-error'));
                zipCodeInput.addClass('is-invalid');
                zipCodeInput.closest('.form-group').find('label').addClass('text-danger');
            }
        });
    },
    init: function () {
        // verify that DF is enabled
        if ($('.dealer-shipping-block').length === 0) {
            return;
        }
        initDealerUI();
        changeShippingAddress();
        // Verify zip code on change of the fields
        $('body').on('change', '#shippingZipCode', function () {
            verifyDealerAndShippingZipCode();
        });
        $('body').on('click', 'a[data-method-id="dealer-pickup"]', function () {
            var zipCodeInput = $('#dealerZipCode');
            var deliveryZipCodeInput = $('#shippingZipCode');
            var errorMsg = $('.dealer-zip-code-error');
            // Remove previously error from zip validation
            zipCodeInput.removeClass('is-invalid');
            zipCodeInput.removeClass('has-error');
            zipCodeInput.closest('.form-group').find('label').removeClass('text-danger');
            errorMsg.hide();
            deliveryZipCodeInput.removeClass('has-error');
        });
        $('body').on('change', 'input[name=dealer-pickup]', function () {
            changeShippingAddress();
        });
        // custom selected state for options
        updateInputState();
        // CARB compliance check
        carbCompliance();

        $('body').on('click', '.modal-feature-toggle .show', function () {
            var tile = $(this).closest('.tile-body');
            $('.modal-feature-toggle .show').hide();
            $('.modal-feature-toggle .hide').show();
            tile.find('.tile-attributes').show();
        });

        $('body').on('click', '.modal-feature-toggle .hide', function () {
            var tile = $(this).closest('.tile-body');
            $('.modal-feature-toggle .show').show();
            $('.modal-feature-toggle .hide').hide();
            tile.find('.tile-attributes').hide();
        });
    },
    sendShippingData: function () {
        $('body').on('checkout:serializeShipping', function (e, data) {
            var dealerShippingBlock = $('.dealer-shipping-block');
            if (dealerShippingBlock.length > 0) {
                var dealerMethodInput = $('#dealerShippingMethod');
                var dealerMethodId = $.trim(dealerMethodInput.val());
                if (dealerMethodId !== '') {
                    var formData = data.data;
                    var shippingMethodPattern = new RegExp(dealerMethodInput.attr('name') + '[^&]*&', 'gi');
                    if (formData.match(shippingMethodPattern)) {
                        formData = formData.replace(shippingMethodPattern, dealerMethodInput.serialize() + '&');
                    } else {
                        formData += '&' + dealerMethodInput.serialize();
                    }
                    var dealerDeliveryMethodID = dealerShippingBlock.data('deliveryMethod');
                    var dealerPickupMethodID = dealerShippingBlock.data('pickupMethod');
                    if (dealerMethodId === dealerPickupMethodID) {
                        formData += '&' + $('input[name=dealer-pickup]:checked').serialize();
                    } else if (dealerMethodId === dealerDeliveryMethodID) {
                        formData += '&' + $('input[name=dealer-delivery]:checked').serialize();
                    }
                    data.callback(formData);
                }
            }
        });
    },
    skipAVSCheck: function () {
        var skip = false;
        var dealerShippingBlock = $('.dealer-shipping-block');
        if (dealerShippingBlock.length > 0) {
            var dealerCurrentShippingMethod = $('#dealerShippingMethod').val();
            var dealerPickupMethodID = dealerShippingBlock.data('pickupMethod');
            skip = dealerCurrentShippingMethod === dealerPickupMethodID;
        }
        return skip;
    },
    updateShippingSummary: function () {
        $('body').on('checkout:updateCheckoutView', function (e, data) {
            if ('dealerInfo' in data.order && data.order.dealerInfo) {
                var addressDealerName = $('.address-summary').find('.dealerName');
                var dealerInfoName = $('.shipping-dealer-info-block').find('.dealer-info-name');
                var dealerInfoPhone = $('.shipping-dealer-info-block').find('.dealer-info-phone');
                addressDealerName.text(data.order.dealerInfo.dealerAddress.companyName);
                dealerInfoName.text(data.order.dealerInfo.dealerAddress.companyName);
                dealerInfoPhone.text(data.order.dealerInfo.dealerAddress.phone);
            }
            var checkoutStage = $('#checkout-main').data('checkoutStage');
            if (checkoutStage === 'shipping') {
                initDealerUI();
            }
        });
    }
};
