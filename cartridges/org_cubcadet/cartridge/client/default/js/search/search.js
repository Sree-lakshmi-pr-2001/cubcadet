'use strict';

var search = require('plugin_blog/search/search');

/**
 * Retrieves the relevant pid value
 * @param {jquery} $el - DOM container for a given add to cart button
 * @return {string} - value to be used when adding product to cart
 */
function getPidValue($el) {
    var pid;

    if ($($el).find('#productSetList').length) {
        pid = $($el).find('#productSetList .product-id').text();
    } else {
        pid = $($el).closest('.grid-tile').data('pid');
    }

    return pid;
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
        productName = (matchPid && matchPid.length > 0) ? matchPid[0].productName : '';
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
        if (response.error) {
            $.spinner().stop();
        } else {
            window.location.reload();
        }
    }, 5000);
}

var exportSearch = $.extend({}, search, {
    addToCart: function () {
        $(document).on('click', 'button.add-to-cart-tile', function () {
            var addToCartUrl = $(this).data('add-to-cart-url');
            var pid = $(this).data('pid');
            var pidsObj;
            var setPids;

            $('body').trigger('product:beforeAddToCart', this);

            var productTile = $(this).closest('.product-tile');
            var $products = $(productTile).find('#productSetList .product-id');
            if ($products.length > 0) {
                setPids = [];

                $products.each(function () {
                    setPids.push({
                        pid: $(this).text(),
                        qty: 1
                    });
                });
                pidsObj = JSON.stringify(setPids);
            }

            pid = getPidValue($(productTile));

            var form = {
                pid: pid,
                pidsObj: pidsObj,
                quantity: 1
            };

            var dealerArea = $(this).closest('.dealer-tile-area');
            if (dealerArea.length > 0) {
                var availableShippingMethod = dealerArea.attr('data-available-shipping-method');
                if (availableShippingMethod && availableShippingMethod.length > 0) {
                    form.dealerShippingMethod = availableShippingMethod;
                }
                var area = dealerArea.attr('data-area');
                if (area && area.length > 0) {
                    form.area = area;
                }
            }

            $.spinner().start();
            $(this).trigger('updateAddToCartFormData', form);
            if (addToCartUrl) {
                $.ajax({
                    url: addToCartUrl,
                    method: 'POST',
                    data: form,
                    success: function (data) {
                        if (data && data.needUpdateDeliveryZipCode) {
                            $('#deliveryZipcodeChangeModal').modal();
                            $.spinner().stop();
                            if ($('#deliveryZipcodeChangeModal').length === 0) {
                                window.console.log('Zipcode change modal was not found on the page');
                            }
                        } else if (data.isExistExtendedWarranty) {
                            $('body').trigger('product:showExtendWarranty', data);
                            $('body').trigger('product:afterAddToCart', data);
                        } else {
                            var resPid = form.pidsObj ? form.pidsObj : form.pid;
                            handlePostCartAdd(data, resPid);
                            $('body').trigger('product:afterAddToCart', data);
                        }
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            }
        });
    },

    modalOpen: function () {
        if (window.matchMedia('(max-width: 767px)').matches) {
            $('#deliveryZipcodeChangeModal').on('shown.bs.modal', function () {
                $('body').css('position', 'fixed');
            });
        }

        if (window.matchMedia('(max-width: 767px)').matches) {
            $('#dealerSelectorModal').on('shown.bs.modal', function () {
                $('body').css('position', 'fixed');
            });
        }
    },

    modalClose: function () {
        if (window.matchMedia('(max-width: 767px)').matches) {
            $('#deliveryZipcodeChangeModal').on('hide.bs.modal', function () {
                $('body').css('position', '');
            });
        }

        if (window.matchMedia('(max-width: 767px)').matches) {
            $('#dealerSelectorModal').on('hide.bs.modal', function () {
                $('body').css('position', '');
            });
        }
    }
});

module.exports = exportSearch;
