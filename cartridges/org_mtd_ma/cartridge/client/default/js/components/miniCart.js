'use strict';

var cart = require('../cart/cart');

/**
 * Closes the minicart, removes 'show' class, and optionally removes
 * jQuery events attached to the body
 */
function closeMiniCart() {
    $('.minicart .popover').empty();
    $('.minicart .popover').removeClass('show');
    $('body').off('keydown.escape.minicart');
}

var closeMiniCartOnEscapeKey = function (e) {
    if (e.key === 'Escape') {
        e.preventDefault();
        closeMiniCart();
    }
};

module.exports = function () {
    cart();

    $('.minicart').on('count:update', function (event, count) {
        if (count && $.isNumeric(count.quantityTotal)) {
            $('.minicart .minicart-quantity').text(count.quantityTotal);
        }
    });

    $('.minicart').on('mouseenter focusin touchstart', function () {
        if ($('.search:visible').length === 0 || $('.navbar-toggler').css('display') !== 'none') {
            return;
        }
        var url = $('.minicart').data('action-url');
        var count = parseInt($('.minicart .minicart-quantity').text(), 10);

        if (count !== 0 && $('.minicart .popover.show').length === 0) {
            $('.minicart .popover').addClass('show');
            $('.minicart .popover').spinner().start();
            $('body').off('keydown.escape.minicart').on('keydown.escape.minicart', closeMiniCartOnEscapeKey);
            $.get(url, function (data) {
                $('.minicart .popover').empty();
                $('.minicart .popover').append(data);
                $.spinner().stop();
            });
        }
    });
    $('body').on('touchstart click', function (e) {
        if ($('.minicart').has(e.target).length <= 0) {
            closeMiniCart();
        }
    });
    $('.minicart').on('mouseleave focusout', function (event) {
        if ((event.type === 'focusout' && $('.minicart').has(event.target).length > 0)
            || (event.type === 'mouseleave' && $(event.target).is('.minicart .quantity'))
            || $('body').hasClass('modal-open')) {
            event.stopPropagation();
            return;
        }
        closeMiniCart();
    });
    $('body').on('change', '.minicart .quantity', function () {
        if ($(this).parents('.bonus-product-line-item').length && $('.cart-page').length) {
            location.reload();
        }
    });
};
