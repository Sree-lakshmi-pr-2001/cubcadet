'use strict';

var addressHelpers = require('base/checkout/address');
var shippingHelpers = require('org_troybilt/checkout/shipping');
var billingHelpers = require('org_ma/checkout/billing');
var dealerHelpers = require('int_mtdservices/dealer/dealer');
var summaryHelpers = require('org_ma/checkout/summary');
var formHelpers = require('org_ma/checkout/formErrors');
var prop65Helpers = require('int_prop65/prop65');
var avsHelpers = require('org_ma/avs/avs');
var utils = require('lyonscg/util/utils');
var financeApplication = require('int_financing_app/financing/application');

/**
 * Update line item prop65 message
 *
 * @param {Object} orderData order Object
 */
function updateLineItemProp65(orderData) {
    if ((typeof orderData === 'undefined')) {
        return;
    }
    var productSummary = $('.product-summary-block');
    for (var i = 0, l = orderData.items.items.length; i < l; i++) {
        var item = orderData.items.items[i];
        var prop65Msg = productSummary.find('.product-line-item[data-product-line-item="' + item.UUID + '"] .item-prop65-msg');
        if (item.prop65Warning) {
            prop65Msg.removeClass('d-none invisible');
        } else {
            prop65Msg.addClass('d-none invisible');
        }
    }
}

/**
 * Update line item prop65 message
 *
 * @param {Object} orderData order Object
 */
function updateDeliveryDetails(orderData) {
    if ((typeof orderData === 'undefined')) {
        return;
    }

    var orderDealerInfo = orderData.dealerInfo;
    var orderDealerEl = $('.order-dealer-delivery-details');
    var dealerSummary = $('.dealer-summary-block');
    var dealerHeader = dealerSummary.find('.review-header');
    var dealerShippingMethodID = orderData.shipping[0].selectedShippingMethod.ID;
    var dealerHeaderText = dealerHeader.attr('data-' + dealerShippingMethodID);
    var dealerAddress = dealerSummary.find('.dealer-address');

    if (orderDealerInfo) {
        var orderDealerAddress = orderDealerInfo.dealerAddress;
        var dealerAddressHtml = '<strong>' + orderDealerAddress.companyName + '</strong><br/>'
            + orderDealerAddress.address1 + '<br/>'
            + orderDealerAddress.city + ', ' + orderDealerAddress.state
            + orderDealerAddress.postalCode + '<br/>'
            + orderDealerAddress.phone;

        dealerHeader.html(dealerHeaderText);
        dealerAddress.html(dealerAddressHtml);
    }

    if (dealerShippingMethodID) {
        $('.order-review-products').addClass('col-md-8');

        if (orderDealerEl.hasClass('d-none invisible')) {
            orderDealerEl.removeClass('d-none invisible');
        }

        if (dealerShippingMethodID === 'dealer-delivery') {
            $('.dealer-delivery').removeClass('hidden');
            $('.dealer-pickup').addClass('hidden');
        } else if (dealerShippingMethodID === 'dealer-pickup') {
            $('.dealer-pickup').removeClass('hidden');
            $('.dealer-delivery').addClass('hidden');
        } else {
            $('.dealer-pickup').addClass('hidden');
            $('.dealer-delivery').addClass('hidden');
        }
    }
}

/**
 * Create the jQuery Checkout Plugin.
 *
 * This jQuery plugin will be registered on the dom element in checkout.isml with the
 * id of "checkout-main".
 *
 * The checkout plugin will handle the different state the user interface is in as the user
 * progresses through the varying forms such as shipping and payment.
 *
 * Billing info and payment info are used a bit synonymously in this code.
 *
 */
(function ($) {
    $.fn.checkout = function () { // eslint-disable-line
        var plugin = this;

        //
        // Collect form data from user input
        //
        var formData = {
            // Shipping Address
            shipping: {},

            // Billing Address
            billing: {},

            // Payment
            payment: {},

            // Gift Codes
            giftCode: {}
        };

        //
        // The different states/stages of checkout
        //
        var checkoutStages = [
            'shipping',
            'payment',
            'placeOrder',
            'submitted'
        ];

        /**
         * Updates the URL to determine stage
         * @param {number} currentStage - The current stage the user is currently on in the checkout
         */
        function updateUrl(currentStage) {
            history.pushState(
                checkoutStages[currentStage],
                document.title,
                location.pathname
                + '?stage='
                + checkoutStages[currentStage]
                + '#'
                + checkoutStages[currentStage]
            );
        }

        //
        // Local member methods of the Checkout plugin
        //
        var members = {

            // initialize the currentStage variable for the first time
            currentStage: 0,

            /**
             * Set or update the checkout stage (AKA the shipping, billing, payment, etc... steps)
             * @returns {Object} a promise
             */
            updateStage: function () {
                var stage = checkoutStages[members.currentStage];
                var defer = $.Deferred(); // eslint-disable-line

                if (stage === 'shipping') {
                    //
                    // Clear Previous Errors
                    //
                    formHelpers.clearPreviousErrors('.shipping-form');

                    //
                    // Submit the Shipping Address Form
                    //
                    var isMultiShip = $('#checkout-main').hasClass('multi-ship');
                    var formSelector = isMultiShip ?
                            '.multi-shipping .active form' : '.single-shipping .shipping-form';
                    var form = $(formSelector);

                    if (isMultiShip && form.length === 0) {
                        // in case the multi ship form is already submitted
                        var url = $('#checkout-main').attr('data-checkout-get-url');
                        $.ajax({
                            url: url,
                            method: 'GET',
                            success: function (data) {
                                if (!data.error) {
                                    $('body').trigger('checkout:updateCheckoutView',
                                        { order: data.order, customer: data.customer });

                                    defer.resolve();
                                } else if ($('.shipping-error .alert-danger').length < 1) {
                                    var errorMsg = data.message;
                                    var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
                                        'fade show" role="alert">' +
                                        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                                        '<span aria-hidden="true">&times;</span>' +
                                        '</button>' + errorMsg + '</div>';
                                    $('.shipping-error').append(errorHtml);
                                    defer.reject();
                                }
                            },
                            error: function () {
                                // Server error submitting form
                                defer.reject();
                            }
                        });
                    } else {
                        /**
                         * Submit Single Shipment
                         */
                        function submitSingleShipment() { // eslint-disable-line no-inner-declarations
                            var shippingFormData = form.serialize();
                            var shippingContactFormData = $('form.shipping-contact-form').serialize();
                            shippingFormData += '&' + shippingContactFormData;

                            // check email confirmation here
                            var shippingEmail = $('#email').val();
                            var shippingEmailConfirm = $('#email-confirm').val();
                            if (shippingEmail.toLowerCase() !== shippingEmailConfirm.toLowerCase()) {
                                var $errorField = $('#email-confirm').parents('.form-group').find('.invalid-feedback');
                                $('#email-confirm').addClass('is-invalid');
                                var $label = $("label[for='" + $('#email-confirm').attr('id') + "']");
                                $label.addClass('text-danger');
                                var fieldName = $label.length ? ('(' + $label.first().text().trim() + ') ') : '';
                                var validationMessage = $('#email-confirm').data('email-not-same');

                                $errorField.html('<strong> Format Error: </strong>' + fieldName + validationMessage);
                                return;
                            }

                            $('body').trigger('checkout:serializeShipping', {
                                form: form,
                                data: shippingFormData,
                                callback: function (data) {
                                    shippingFormData = data;
                                }
                            });

                            $.ajax({
                                url: form.attr('action'),
                                type: 'post',
                                data: shippingFormData,
                                success: function (data) {
                                    shippingHelpers.methods.shippingFormResponse(defer, data);
                                    updateLineItemProp65(data.order);
                                    updateDeliveryDetails(data.order);

                                    // Update finance estimation and plans if blocks exist
                                    financeApplication.methods.updateBillingStep();

                                    var fakeCheckoutSteps = $('.fake-checkout-steps').find('.checkout-step-number');

                                    if (fakeCheckoutSteps.hasClass('filled')) {
                                        fakeCheckoutSteps.removeClass('filled');
                                    }

                                    $('#dwfrm_shipping.shipping-form').addClass('ishippingform-filled');
                                },
                                error: function (err) {
                                    if (err.responseJSON.redirectUrl) {
                                        window.location.href = err.responseJSON.redirectUrl;
                                    }
                                    // Server error submitting form
                                    defer.reject(err.responseJSON);
                                }
                            });
                        }
                        avsHelpers.verifyAddress(function () {
                            // do not proceed with delivery zip code mismatch error
                            if ($('#shippingZipCode').hasClass('has-error') && $('.dealer-shipping-option.selected').length) {
                                return;
                            }

                            // Carb Compliance
                            var shippingState = $.trim($('#shippingState').val());
                            if (shippingState === 'CA') {
                                dealerHelpers.methods.verifyCarb(submitSingleShipment);
                            } else {
                                submitSingleShipment();
                            }
                        });
                    }
                    return defer;
                } else if (stage === 'payment') {
                    //
                    // Submit the Billing Address Form
                    //

                    formHelpers.clearPreviousErrors('.payment-form');

                    var paymentForm = $('#dwfrm_billing').serialize();

                    $('body').trigger('checkout:serializeBilling', {
                        form: $('#dwfrm_billing'),
                        data: paymentForm,
                        callback: function (data) { paymentForm = data; }
                    });

                    if ($('.data-checkout-stage').data('customer-type') === 'registered') {
                        // if payment method is credit card
                        if ($('.payment-information').data('payment-method-id') === 'CREDIT_CARD') {
                            if (!($('.payment-information').data('is-new-payment'))) {
                                var cvvCode = $('.saved-payment-instrument.' +
                                    'selected-payment .saved-payment-security-code').val();

                                if (cvvCode === '') {
                                    $('.saved-payment-instrument.' +
                                        'selected-payment ' +
                                        '.form-control').addClass('is-invalid');
                                    defer.reject();
                                    return defer;
                                }

                                var $savedPaymentInstrument = $('.saved-payment-instrument' +
                                    '.selected-payment'
                                );

                                paymentForm += '&storedPaymentUUID=' +
                                    $savedPaymentInstrument.data('uuid');

                                paymentForm += '&securityCode=' + cvvCode;
                            }
                        }
                    }

                    $.ajax({
                        url: $('#dwfrm_billing').attr('action'),
                        method: 'POST',
                        data: paymentForm,
                        success: function (data) {
                            // look for field validation errors
                            if (data.error) {
                                if (data.fieldErrors.length) {
                                    data.fieldErrors.forEach(function (error) {
                                        if (Object.keys(error).length) {
                                            formHelpers.loadFormErrors('.payment-form', error);
                                        }
                                    });
                                }

                                if (data.serverErrors.length) {
                                    data.serverErrors.forEach(function (error) {
                                        $('.error-message').show();
                                        $('.error-message-text').text(error);
                                    });
                                }

                                if (data.cartError) {
                                    window.location.href = data.redirectUrl;
                                }

                                defer.reject();
                            } else {
                                //
                                // Populate the Address Summary
                                //
                                $('body').trigger('checkout:updateCheckoutView',
                                    { order: data.order, customer: data.customer });

                                if (data.renderedPaymentInstruments) {
                                    $('.stored-payments').empty().html(
                                        data.renderedPaymentInstruments
                                    );
                                }

                                if (data.customer.registeredUser
                                    && data.customer.customerPaymentInstruments.length
                                ) {
                                    $('.cancel-new-payment').removeClass('checkout-hidden');
                                }

                                // Show Dialog
                                if ('prop65' in data && data.prop65.show) {
                                    prop65Helpers.showMessage(data.prop65);
                                }

                                updateLineItemProp65(data.order);
                                updateDeliveryDetails(data.order);

                                var fakeCheckoutSteps = $('.fake-checkout-steps').find('.order-review .checkout-step-number');

                                if (fakeCheckoutSteps.hasClass('filled')) {
                                    fakeCheckoutSteps.removeClass('filled');
                                }

                                var paymentSummaryCheckoutStep = $('.payment-summary').find('.checkout-step-number');

                                if (!paymentSummaryCheckoutStep.hasClass('filled')) {
                                    paymentSummaryCheckoutStep.addClass('filled');
                                }

                                if ($('.order-total-summary').find('.order-product-summary').length > 0) {
                                    $('.order-product-summary').appendTo('.order-review-products');
                                    $('.order-review-products').find('.item-image.col-6').removeClass('col-6').addClass('col-4');
                                    $('.order-review-products').find('.product-line-item-details.col-6').removeClass('col-6').addClass('col-8');
                                    $('.order-review-products').find('.line-item-price-info.col-5').removeClass('col-5').addClass('col-3');
                                    $('.order-review-products').find('.qty-card-quantity-label.col-5').removeClass('col-5').addClass('col-3');
                                    $('.order-review-products').find('.line-item-pricing-info.col-5').removeClass('col-5').addClass('col-3');
                                }

                                defer.resolve(data);
                            }
                        },
                        error: function (err) {
                            if (err.responseJSON.redirectUrl) {
                                window.location.href = err.responseJSON.redirectUrl;
                            }
                        }
                    });

                    return defer;
                } else if (stage === 'placeOrder') {
                    var placeOrderData = '';
                    var placeOrderBtn = $('.place-order');
                    placeOrderBtn.attr('disabled', 'disabled');
                    if ($('.data-checkout-stage').data('customer-type') === 'registered') {
                        // if payment method is credit card
                        if ($('.payment-information').data('payment-method-id') === 'CREDIT_CARD') {
                            if (!($('.payment-information').data('is-new-payment'))) {
                                var $savedCC = $('.saved-payment-instrument' +
                                    '.selected-payment'
                                );

                                placeOrderData += '&storedPaymentUUID=' +
                                    $savedCC.data('uuid');
                            }
                        }
                    }

                    $.ajax({
                        url: $('.place-order').data('action'),
                        method: 'POST',
                        data: placeOrderData,
                        success: function (data) {
                            placeOrderBtn.removeAttr('disabled');
                            if (data.error) {
                                if (data.cartError) {
                                    window.location.href = data.redirectUrl;
                                    defer.reject();
                                } else {
                                    // go to appropriate stage and display error message
                                    defer.reject(data);
                                }
                            } else {
                                var continueUrl = data.continueUrl;
                                var urlParams = {
                                    ID: data.orderID,
                                    token: data.orderToken
                                };

                                continueUrl += (continueUrl.indexOf('?') !== -1 ? '&' : '?') +
                                    Object.keys(urlParams).map(function (key) {
                                        return key + '=' + encodeURIComponent(urlParams[key]);
                                    }).join('&');

                                window.location.href = continueUrl;

                                defer.resolve(data);
                            }
                        },
                        error: function () {
                            placeOrderBtn.removeAttr('disabled');
                        }
                    });

                    return defer;
                }
                var p = $('<div>').promise(); // eslint-disable-line
                setTimeout(function () {
                    p.done(); // eslint-disable-line
                }, 500);
                return p; // eslint-disable-line
            },

            /**
             * Initialize the checkout stage.
             *
             * TODO: update this to allow stage to be set from server?
             */
            initialize: function () {
                // set the initial state of checkout
                members.currentStage = checkoutStages
                    .indexOf($('.data-checkout-stage').data('checkout-stage'));
                $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);

                //
                // Handle Payment option selection
                //
                $('input[name$="paymentMethod"]', plugin).on('change', function () {
                    $('.credit-card-form').toggle($(this).val() === 'CREDIT_CARD');
                });

                //
                // Handle Next State button click
                //
                $(plugin).on('click', '.next-step-button button', function (e) {
                    e.preventDefault();
                    // Validate all fields before submit
                    $('input:visible, select:visible').trigger('invalid');
                    var visibleInvalidInputs = $('input.is-invalid:visible, select.is-invalid:visible');
                    if (visibleInvalidInputs.length > 0) {
                        // scroll to any exposed errors
                        utils.scrollBrowser(visibleInvalidInputs.first().offset().top - 30);
                    } else {
                        members.nextStage();
                    }
                });

                //
                // Handle Edit buttons on shipping and payment summary cards
                //
                $('.shipping-summary .edit-button', plugin).on('click', function () {
                    if (!$('#checkout-main').hasClass('multi-ship')) {
                        $('body').trigger('shipping:selectSingleShipping');
                    }

                    members.gotoStage('shipping');
                    prop65Helpers.hideMessage();

                    var fakeCheckoutSteps = $('.fake-checkout-steps').find('.checkout-step-number');
                    if (fakeCheckoutSteps.hasClass('filled')) {
                        fakeCheckoutSteps.removeClass('filled');
                    }

                    var fakeCheckoutReview = $('.fake-checkout-steps').find('.order-review');
                    if (fakeCheckoutReview.hasClass('d-none')) {
                        fakeCheckoutReview.removeClass('d-none');
                    }

                    if ($('.order-review-products').find('.order-product-summary').length > 0) {
                        $('.order-review-products').removeClass('col-md-8');
                        $('.order-product-summary').appendTo('.order-total-summary');
                        $('.order-product-summary').find('.item-image.col-4').removeClass('col-4').addClass('col-6');
                        $('.order-product-summary').find('.product-line-item-details.col-8').removeClass('col-8').addClass('col-6');
                        $('.order-product-summary').find('.line-item-price-info.col-3').removeClass('col-3').addClass('col-5');
                        $('.order-product-summary').find('.qty-card-quantity-label.col-3').removeClass('col-3').addClass('col-5');
                        $('.order-product-summary').find('.line-item-pricing-info.col-3').removeClass('col-3').addClass('col-5');
                    }

                    $('#dwfrm_shipping.shipping-form').removeClass('ishippingform-filled');
                });

                $('.payment-summary .edit-button', plugin).on('click', function () {
                    members.gotoStage('payment');
                    prop65Helpers.hideMessage();

                    var fakeCheckoutSteps = $('.fake-checkout-steps').find('.order-review .checkout-step-number');
                    if (fakeCheckoutSteps.hasClass('filled')) {
                        fakeCheckoutSteps.removeClass('filled');
                    }

                    var paymentSummaryCheckoutStep = $('.payment-summary').find('.checkout-step-number');
                    if (!paymentSummaryCheckoutStep.hasClass('filled')) {
                        paymentSummaryCheckoutStep.addClass('filled');
                    }

                    if ($('.order-review-products').find('.order-product-summary').length > 0) {
                        $('.order-review-products').removeClass('col-md-8');
                        $('.order-product-summary').appendTo('.order-total-summary');
                        $('.order-product-summary').find('.item-image.col-4').removeClass('col-4').addClass('col-6');
                        $('.order-product-summary').find('.product-line-item-details.col-8').removeClass('col-8').addClass('col-6');
                        $('.order-product-summary').find('.line-item-price-info.col-3').removeClass('col-3').addClass('col-5');
                        $('.order-product-summary').find('.qty-card-quantity-label.col-3').removeClass('col-3').addClass('col-5');
                        $('.order-product-summary').find('.line-item-pricing-info.col-3').removeClass('col-3').addClass('col-5');
                    }
                });

                //
                // remember stage (e.g. shipping)
                //
                updateUrl(members.currentStage);

                //
                // Listen for foward/back button press and move to correct checkout-stage
                //
                $(window).on('popstate', function (e) {
                    //
                    // Back button when event state less than current state in ordered
                    // checkoutStages array.
                    //
                    if (e.state === null ||
                         checkoutStages.indexOf(e.state) < members.currentStage) {
                        members.handlePrevStage(false);
                    } else if (checkoutStages.indexOf(e.state) > members.currentStage) {
                        // Forward button  pressed
                        members.handleNextStage(false);
                    }
                });

                //
                // Set the form data
                //
                plugin.data('formData', formData);

                //
                // Handle Summary Place Order button
                //
                $('.order-total-summary .place-order').on('click', function () {
                    $('.checkout-button .place-order').trigger('click');
                });

                // Verify Prop65 on the last step via direct refresh
                var prop65UrlInput = $('#prop65VerifyUrl');
                if (checkoutStages[members.currentStage] === 'placeOrder' && prop65UrlInput.length > 0) {
                    $.ajax({
                        url: prop65UrlInput.val(),
                        type: 'get',
                        dataType: 'json',
                        success: function (data) {
                            if (data.show) {
                                prop65Helpers.showMessage(data);
                            }
                        },
                        error: function () {
                        }
                    });
                }
            },

            /**
             * The next checkout state step updates the css for showing correct buttons etc...
             */
            nextStage: function () {
                var promise = members.updateStage();

                promise.done(function () {
                    // Update UI with new stage
                    members.handleNextStage(true);
                });

                promise.fail(function (data) {
                    // show errors
                    if (data) {
                        if (data.errorStage) {
                            members.gotoStage(data.errorStage.stage);

                            if (data.errorStage.step === 'billingAddress') {
                                var $billingAddressSameAsShipping = $(
                                    'input[name$="_shippingAddressUseAsBillingAddress"]'
                                );
                                if ($billingAddressSameAsShipping.is(':checked')) {
                                    $billingAddressSameAsShipping.prop('checked', false);
                                }
                            }
                        }

                        if (data.errorMessage) {
                            $('.error-message').show();
                            $('.error-message-text').html(data.errorMessage);

                            // scroll to any exposed errors
                            utils.scrollBrowser($('.error-message').first().offset().top - 30);
                        }
                    }
                });
            },

            /**
             * The next checkout state step updates the css for showing correct buttons etc...
             *
             * @param {boolean} bPushState - boolean when true pushes state using the history api.
             */
            handleNextStage: function (bPushState) {
                if (members.currentStage < checkoutStages.length - 1) {
                    // move stage forward
                    members.currentStage++;

                    //
                    // show new stage in url (e.g.payment)
                    //
                    if (bPushState) {
                        updateUrl(members.currentStage);
                    }
                }

                // Set the next stage on the DOM
                $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);
            },

            /**
             * Previous State
             */
            handlePrevStage: function () {
                if (members.currentStage > 0) {
                    // move state back
                    members.currentStage--;
                    updateUrl(members.currentStage);
                }

                $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);
            },

            /**
             * Use window history to go to a checkout stage
             * @param {string} stageName - the checkout state to goto
             */
            gotoStage: function (stageName) {
                members.currentStage = checkoutStages.indexOf(stageName);
                updateUrl(members.currentStage);
                $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);
            }
        };

        //
        // Initialize the checkout
        //
        members.initialize();

        return this;
    };
}(jQuery));


var exports = {
    initialize: function () {
        $('#checkout-main').checkout();
        $('#accountNumber').val('');
    },

    updateCheckoutView: function () {
        $('body').on('checkout:updateCheckoutView', function (e, data) {
            shippingHelpers.methods.updateMultiShipInformation(data.order);
            summaryHelpers.updateTotals(data.order);
            data.order.shipping.forEach(function (shipping) {
                shippingHelpers.methods.updateShippingInformation(
                    shipping,
                    data.order,
                    data.customer,
                    data.options
                );
            });
            billingHelpers.methods.updateBillingInformation(
                data.order,
                data.customer,
                data.options
            );
            billingHelpers.methods.updatePaymentInformation(data.order, data.options);
            summaryHelpers.updateOrderProductSummaryInformation(data.order, data.options);
        });
    }
};

[billingHelpers, shippingHelpers, addressHelpers, dealerHelpers].forEach(function (library) {
    Object.keys(library).forEach(function (item) {
        if (typeof library[item] === 'object') {
            exports[item] = $.extend({}, exports[item], library[item]);
        } else {
            exports[item] = library[item];
        }
    });
});

module.exports = exports;
