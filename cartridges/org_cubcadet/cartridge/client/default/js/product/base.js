'use strict';

var base = require('org_ma/product/base');

/**
 * Retrieves the relevant pid value
 * @param {jquery} $el - DOM container for a given add to cart button
 * @return {string} - value to be used when adding product to cart
 */
function getPidValue($el) {
    var pid;

    if ($('#quickViewModal').hasClass('show') && !$('.product-set').length) {
        pid = $($el).closest('.modal-content').find('.product-quickview').data('pid');
    } else if ($('.product-set-detail').length || $('.product-set').length) {
        pid = $($el).closest('.product-detail').find('.product-id').text();
    } else {
        pid = $('.product-detail:not(".bundle-item")').data('pid');
    }

    return pid;
}

/**
 * Retrieve contextual quantity selector
 * @param {jquery} $el - DOM container for the relevant quantity
 * @return {jquery} - quantity selector DOM container
 */
function getQuantitySelector($el) {
    return $el && $('.set-items').length
        ? $($el).closest('.product-detail').find('.quantity-select')
        : $('.quantity-select');
}

/**
 * Retrieves the value associated with the Quantity pull-down menu
 * @param {jquery} $el - DOM container for the relevant quantity
 * @return {string} - value found in the quantity input
 */
function getQuantitySelected($el) {
    return getQuantitySelector($el).val();
}

/**
 * Retrieves url to use when adding a product to the cart
 *
 * @return {string} - The provided URL to use when adding a product to the cart
 */
function getAddToCartUrl() {
    return $('.add-to-cart-url').val();
}

/**
 * Parses the html for a modal window
 * @param {string} html - representing the body and footer of the modal window
 *
 * @return {Object} - Object with properties body and footer.
 */
function parseHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));

    var body = $html.find('.choice-of-bonus-product');
    var footer = $html.find('.modal-footer').children();

    return { body: body, footer: footer };
}

/**
 * Retrieves url to use when adding a product to the cart
 *
 * @param {Object} data - data object used to fill in dynamic portions of the html
 */
function chooseBonusProducts(data) {
    $('.modal-body').spinner().start();

    if ($('#chooseBonusProductModal').length !== 0) {
        $('#chooseBonusProductModal').remove();
    }
    var bonusUrl;
    if (data.bonusChoiceRuleBased) {
        bonusUrl = data.showProductsUrlRuleBased;
    } else {
        bonusUrl = data.showProductsUrlListBased;
    }

    var htmlString = '<!-- Modal -->'
        + '<div class="modal fade" id="chooseBonusProductModal" role="dialog" aria-labelledby="modal-title" data-la-initdispnone="true">'
        + '<div class="modal-dialog choose-bonus-product-dialog" role="document"'
        + 'data-total-qty="' + data.maxBonusItems + '"'
        + 'data-UUID="' + data.uuid + '"'
        + 'data-pliUUID="' + data.pliUUID + '"'
        + 'data-addToCartUrl="' + data.addToCartUrl + '"'
        + 'data-pageStart="0"'
        + 'data-pageSize="' + data.pageSize + '"'
        + 'data-moreURL="' + data.showProductsUrlRuleBased + '"'
        + 'data-bonusChoiceRuleBased="' + data.bonusChoiceRuleBased + '">'
        + '<!-- Modal content-->'
        + '<div class="modal-content">'
        + '<div class="modal-header">'
        + '    <span class="">' + data.labels.selectprods + '</span>'
        + '    <button type="button" class="close pull-right" data-dismiss="modal">&times;</button>'
        + '</div>'
        + '<div class="modal-body"></div>'
        + '<div class="modal-footer"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    $('#main').append(htmlString);
    $('.modal-body').spinner().start();

    $.ajax({
        url: bonusUrl,
        method: 'GET',
        dataType: 'html',
        success: function (html) {
            var parsedHtml = parseHtml(html);
            $('#chooseBonusProductModal .modal-body').empty();
            $('#chooseBonusProductModal .modal-body').html(parsedHtml.body);
            $('#chooseBonusProductModal .modal-footer').html(parsedHtml.footer);
            $('#chooseBonusProductModal').modal('show');
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

    if (response.newBonusDiscountLineItem
        && Object.keys(response.newBonusDiscountLineItem).length !== 0) {
        chooseBonusProducts(response.newBonusDiscountLineItem);
        $.spinner().stop();
    } else {
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
            + '<span><h4>' + response.message + '</h4>'
            + ' ' + productName + ' <i class="forSR">Added to Cart</i></span>'
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
}

/**
 * Retrieves the bundle product item ID's for the Controller to replace bundle master product
 * items with their selected variants
 *
 * @return {string[]} - List of selected bundle product item ID's
 */
function getChildProducts() {
    var childProducts = [];
    $('.bundle-item').each(function () {
        childProducts.push({
            pid: $(this).find('.product-id').text(),
            quantity: parseInt($(this).find('label.quantity').data('quantity'), 10)
        });
    });

    return childProducts.length ? JSON.stringify(childProducts) : [];
}

/**
 * Retrieve product options
 *
 * @param {jQuery} $productContainer - DOM element for current product
 * @return {string} - Product options and their selected values
 */
function getOptions($productContainer) {
    var options = $productContainer
        .find('.product-option')
        .map(function () {
            var $elOption = $(this).find('.options-select');
            var urlValue = $elOption.val();
            var selectedValueId = $elOption.find('option[value="' + urlValue + '"]')
                .data('value-id');
            return {
                optionId: $(this).data('option-id'),
                selectedValueId: selectedValueId
            };
        }).toArray();

    return JSON.stringify(options);
}

/**
 * Enable add all to cart button
 */
function enableAddAllItemsToCart() {
    // using does not equal for cases if value is "none or null"
    var enable = $('.product-availability').toArray().every(function (item) {
        return $(item).data('available') && $(item).data('price-available') && $(item).data('ready-to-order') && $(item).data('buyable') !== false && $(item).data('request-demo') !== true;
    });

    $('button.add-to-cart-global').attr('disabled', !enable);
}

var exportBase = $.extend(true, {}, base, {
    addToCart: function () {
        $(document).on(
            'click',
            'button.add-to-cart, button.add-to-cart-global',
            function () {
                var addToCartUrl;
                var pid;
                var pidsObj;
                var setPids;

                $('body').trigger('product:beforeAddToCart', this);

                if (
                    $('.set-items').length &&
                    $(this).hasClass('add-to-cart-global')
                ) {
                    setPids = [];

                    $('.product-detail').each(function () {
                        if (!$(this).hasClass('product-set-detail')) {
                            var quantity = $(this).find('.quantity-select').val();
                            if (!quantity || quantity === '') {
                                quantity = 1;
                            }
                            setPids.push({
                                pid: $(this)
                                    .find('.product-id')
                                    .text(),
                                qty: quantity,
                                options: getOptions($(this))
                            });
                        }
                    });
                    pidsObj = JSON.stringify(setPids);
                }

                pid = getPidValue($(this));

                var $productContainer = $(this).closest('.product-detail');
                if (!$productContainer.length) {
                    $productContainer = $(this)
                        .closest('.quick-view-dialog')
                        .find('.product-detail');
                }

                addToCartUrl = getAddToCartUrl();

                var form = {
                    pid: pid,
                    pidsObj: pidsObj,
                    childProducts: getChildProducts(),
                    quantity: getQuantitySelected($(this))
                };

                if (!$('.bundle-item').length) {
                    form.options = getOptions($productContainer);
                }

                var dealerArea = $(this).closest('.where-to-buy--pdp');
                if (dealerArea.length > 0) {
                    var availableShippingMethod = dealerArea.attr('data-available-shipping-method');
                    if (availableShippingMethod && availableShippingMethod.length > 0) {
                        form.dealerShippingMethod = availableShippingMethod;
                    }
                }

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
                                // $.spinner().stop();
                            }
                        },
                        error: function () {
                            $.spinner().stop();
                        }
                    });
                }
            }
        );

        $('body').on('product:updateAddToCart', function (e, response) {
            // update local add to cart (for sets)
            $('button.add-to-cart', response.$productContainer).attr('disabled',
                (!response.product.readyToOrder || !response.product.available || response.product.isBuyable === false || !response.product.priceAvailability || response.product.requestDemo === true));

            enableAddAllItemsToCart();
        });
        enableAddAllItemsToCart();

        $(document).on('click', 'button[data-button-event="findDealerEvent"]', function (e) {
            e.preventDefault();
            $.spinner().start();
            var link = $(this).attr('data-find-dealer-url');
            window.location.href = link;
        });
    }
});

module.exports = exportBase;
