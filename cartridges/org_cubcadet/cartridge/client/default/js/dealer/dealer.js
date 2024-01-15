/* global google */
'use strict';
var baseDealer = require('int_mtdservices/dealer/dealer');

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
    } else if (dealerCurrentShippingMethod === dealerPickupMethodID) { // Dealer Pickup
        factoryDeliveryHeader.addClass('hidden');
        dealerDeliveryHeader.addClass('hidden');
        factoryDeliveryTitle.addClass('hidden');
        dealerDeliveryTitle.addClass('hidden');
        addressFirstName.addClass('hidden');
        addressLastName.addClass('hidden');
        shippingMethodBlock.addClass('hidden');

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

    var dealerCurrentShippingMethod = $('#dealerShippingMethod').val();
    var dealerDeliveryMethodID = dealerShippingBlock.data('deliveryMethod');
    var dealerPickupMethodID = dealerShippingBlock.data('pickupMethod');
    var factoryShippingMethodBlock = $('.shipping-method-block');
    var factoryShippingAddressBlock = $('.view-address-block');
    var dealerShippingOptions = $('.dealer-shipping-options');
    var shippingContent = $('.shipping-content');

    // Verify if we need to hide shipping item
    var hideShippingItem = dealerShippingBlock.data('hideShippingItem');
    var shippingLineItem = $('.order-total-summary').find('.shipping-item');
    if (hideShippingItem) {
        shippingLineItem.addClass('hidden');
    } else {
        shippingLineItem.removeClass('hidden');
    }
    // If we have dealer delivery selected we need to hide factory shipping methods
    if (dealerCurrentShippingMethod === dealerDeliveryMethodID) {
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

    // clear existing error on label
    $('label').removeClass('text-danger');

    // Verify Shipping Summary elements
    shippingSummaryInit();
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
        baseDealer.methods.verifyCarb(callback);
    } else if (typeof callback !== 'undefined') {
        callback();
    }
}

var exportDealer = $.extend({}, baseDealer, {
    methods: {
        shippingSummaryInit: shippingSummaryInit,
        verifyCarb: baseDealer.methods.verifyCarb
    },
    init: function () {
        // verify that DF is enabled
        if ($('.dealer-shipping-block').length === 0) {
            return;
        }
        initDealerUI();

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
});

module.exports = exportDealer;
