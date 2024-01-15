'use strict';

var search = require('org/search/search');

/**
 * This function retrieves another page of content to display in the content search grid
 * @param {JQuery} $element - the jquery element that has the click event attached
 * @param {JQuery} $target - the jquery element that will receive the response
 * @return {undefined}
 */
function getContent($element, $target) {
    var showMoreUrl = $element.data('url');
    $.spinner().start();
    $.ajax({
        url: showMoreUrl,
        method: 'GET',
        success: function (response) {
            $target.append(response);
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 * @param {string} pid - product id of product added to cart
 */
function handlePostCartAdd(response, pid) {
    $('.minicart').trigger('count:update', response);
    var messageType = response.error ? 'alert-danger' : 'alert-success';
    // show add to cart toast
    var productName;
    var pidStr = typeof pid === 'string' ? pid : pid.toString();

    if (pidStr.indexOf('{') < 0) {
        var matchPid = response.cart.items.filter(function (value) {
            var match;
            if (value.id === pidStr) {
                match = value;
            }
            return match;
        });
        productName = matchPid[0].productName;
    } else {
        productName = '';
    }

    if ($('.add-to-cart-messages').length === 0) {
        $('body').append(
            '<div class="add-to-cart-messages"></div>'
        );
    }
    $('.add-to-cart-messages').append(
        '<div class="alert ' + messageType + ' add-to-basket-alert text-center shadow-block" role="alert">'
        + '<div class="atc-success-icon"></div>'
        + '<h4>' + response.message + '</h4>'
        + '<span>' + productName + '</span>'
        + '</div>'
    );

    setTimeout(function () {
        $('.add-to-basket-alert').remove();
    }, 5000);
}

var exportSearch = $.extend({}, search, {
    addToCart: function () {
        $(document).on('click', 'button.add-to-cart-tile', function () {
            var addToCartUrl = $(this).data('add-to-cart-url');
            var pid = $(this).data('pid');

            $('body').trigger('product:beforeAddToCart', this);

            var form = {
                pid: pid,
                quantity: 1
            };

            $(this).trigger('updateAddToCartFormData', form);
            if (addToCartUrl) {
                $.ajax({
                    url: addToCartUrl,
                    method: 'POST',
                    data: form,
                    success: function (data) {
                        var resPid = form.pidsObj ? form.pidsObj : form.pid;
                        handlePostCartAdd(data, resPid);
                        $('body').trigger('product:afterAddToCart', data);
                        if (window.location.href.indexOf('/cart') > 0) {
                            $('.back-to-top').click();
                            location.reload();
                        }
                        $.spinner().stop();
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            }
        });
    },

    showContentTab: function () {
        // Display content results from the search
        $('.container').on('click', '.content-search', function () {
            if ($('#content-search-results').children().length < 1) {
                getContent($(this), $('#content-search-results'));
            }
        });

        // Display the next page of content results from the search
        $('.container').on('click', '.show-more-content button', function () {
            getContent($(this), $('#content-search-results .content-grid > .row:first-child'));
            $('.show-more-content').remove();
        });
    }
});

module.exports = exportSearch;
