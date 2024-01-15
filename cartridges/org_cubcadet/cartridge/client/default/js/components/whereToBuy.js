'use strict';

var lyonscgUtils = require('lyonscg/util/utils');

/**
 * Initialize Where to Buy events
 */
function initEvents() {
    /**
     * Select the option on the PDP
     */
    $('body').on('click', '.where-to-buy--pdp .where-to-buy__option', function () {
        var $option = $(this);
        if ($option.hasClass('selected')) return;
        if ($option.hasClass('disabled')) return;
        $('.where-to-buy__options .where-to-buy__option').removeClass('selected');
        $option.addClass('selected');
        var selectedShippingMethod = $option.attr('data-shipping-method');
        $option.closest('.where-to-buy--pdp').attr('data-available-shipping-method', selectedShippingMethod);
        var relatedAvailabilityItem = $('.where-to-buy__availability__item').filter('[data-for-shipping-method="' + selectedShippingMethod + '"]');
        if (relatedAvailabilityItem.length) {
            $('.where-to-buy__availability__item').removeClass('selected');
            relatedAvailabilityItem.addClass('selected');
        }
    });

    /**
     * Select the option on the Cart page
     */
    $('body').on('click', '.where-to-buy--cart-page .where-to-buy__option', function () {
        var $option = $(this);
        if ($option.hasClass('selected')) return;
        if ($option.hasClass('disabled')) return;
        var setShippingMethodUrl = $option.data('set-shipping-method-url');
        var productId = $option.closest('.where-to-buy').data('product-id');
        var finalUrl = lyonscgUtils.appendParamToURL(setShippingMethodUrl, 'productId', productId);
        $option.parent().spinner().start();
        $.ajax({
            url: finalUrl,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                if (data && data.success) {
                    $('body').trigger('cart:changeDeliveryOption', data.basket);
                    $('.where-to-buy[data-product-id=' + productId + ']').replaceWith(data.cartProductDeliveryHTML);
                    window.location.reload();
                }
            }
        }).always(function () {
            $option.parent().spinner().stop();
        });
    });
}

/**
 * Initialize Where to Buy functionality
 */
function init() {
    initEvents();
}

module.exports = init;
