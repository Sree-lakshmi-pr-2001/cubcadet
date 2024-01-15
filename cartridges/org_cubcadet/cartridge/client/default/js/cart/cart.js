'use strict';

var lyonsBase = require('lyonscg/product/base');
var base = require('../product/base');
var financeApplication = require('int_financing_app/financing/application');

$('body').on('product:beforeAttributeSelect', function () {
    // Unslick the existing images to prepare them for direct js manipulation
    base.carouselUnslick();
});

$('body').on('product:afterAttributeSelect', function () {
    base.carouselInit();
});

$('body').on('shown.bs.modal', '#editProductModal, #quickViewModal, #chooseBonusProductModal', function () {
    base.carouselInit();
});

/**
 * appends params to a url
 * @param {string} url - Original url
 * @param {Object} params - Parameters to append
 * @returns {string} result url with appended parameters
 */
function appendToUrl(url, params) {
    var newUrl = url;
    newUrl += (newUrl.indexOf('?') !== -1 ? '&' : '?') + Object.keys(params).map(function (key) {
        return key + '=' + encodeURIComponent(params[key]);
    }).join('&');

    return newUrl;
}

/**
 * Checks whether the basket is valid. if invalid displays error message and disables
 * checkout button
 * @param {Object} data - AJAX response from the server
 */
function validateBasket(data) {
    if (data.valid.error) {
        if (data.valid.message) {
            var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
                'fade show" role="alert">' +
                '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                '<span aria-hidden="true">&times;</span>' +
                '</button>' + data.valid.message + '</div>';

            $('.cart-error').append(errorHtml);
        } else {
            $('.cart').empty().append('<div class="row"> ' +
                '<div class="col-12 text-center"> ' +
                '<h1>' + data.resources.emptyCartMsg + '</h1> ' +
                '</div> ' +
                '</div>'
            );
            $('.number-of-items').empty().append(data.resources.numberOfItems);
            $('.minicart-quantity').empty().append(data.numItems);
            $('.minicart .popover').empty();
            $('.minicart .popover').removeClass('show');
        }

        $('.checkout-btn').addClass('disabled');
    } else {
        $('.checkout-btn').removeClass('disabled');
    }
}

/**
 * re-renders the order totals and the number of items in the cart
 * @param {Object} data - AJAX response from the server
 * @param {Object} isMiniCart - jQuery object of element if in miniCart
 */
function updateCartTotals(data, isMiniCart) {
    $('.number-of-items').empty().append(data.resources.numberOfItems);
    $('.shipping-cost').empty().append(data.totals.totalShippingCost);
    if (data.totals.totalTax === '-') {
        $('#cartSalesTaxLabel').empty().append(data.resources.notCalculatedTaxesLabel);
    } else {
        $('#cartSalesTaxLabel').empty().append(data.resources.calculatedTaxesLabel);
    }
    $('.tax-total').empty().append(data.totals.totalTax);
    $('.grand-total').empty().append(data.totals.grandTotal);
    $('.sub-total-value').empty().append(data.totals.subTotal);
    $('.estimated-total .sub-total').empty().append(data.totals.subTotal);
    $('.minicart-quantity').empty().append(data.numItems);

    if (data.totals.orderLevelDiscountTotal.value > 0) {
        $('.order-discount').removeClass('hide-order-discount');
        $('.order-discount-total').empty()
            .append('- ' + data.totals.orderLevelDiscountTotal.formatted);
    } else {
        $('.order-discount').addClass('hide-order-discount');
    }

    if (data.totals.shippingLevelDiscountTotal.value > 0) {
        $('.shipping-discount').removeClass('hide-shipping-discount');
        $('.shipping-discount-total').empty().append('- ' +
            data.totals.shippingLevelDiscountTotal.formatted);
    } else {
        $('.shipping-discount').addClass('hide-shipping-discount');
    }
    data.items.forEach(function (item) {
        $('.item-' + item.UUID).empty().append(item.renderedPromotions);
        if (isMiniCart !== undefined && isMiniCart.length > 0) {
            $('.item-total-' + item.UUID).empty().append(item.miniCartRenderedPrice);
        } else {
            $('.item-total-' + item.UUID).empty().append(item.priceTotal.renderedPrice);
        }
    });
    // Update finance estimation if block exists
    financeApplication.methods.updateEstimationBlock();
}

/**
 * re-renders the shipping method list in dropdown
 * @param {Object} data - AJAX response from the server
 */
function updateShippingMethods(data) {
    var shippingMethodSelect = $('#shippingMethods');
    if (data.shipments.length === 0) {
        return;
    }
    var shipment = data.shipments[0];
    var shippingOptions = '';
    var defaultShippingMethodIndex = 0;
    for (var i = 0, l = shipment.shippingMethods.length; i < l; i++) {
        var shippingMethod = shipment.shippingMethods[i];
        var shippingMethodName = shippingMethod.displayName + ' (' + shippingMethod.estimatedArrivalTime + ')';
        var shippingMethodId = shippingMethod.ID;
        shippingOptions += '<option data-shipping-id="' + shippingMethodId + '">' + shippingMethodName + '</option>';
        if (shippingMethod.default) {
            defaultShippingMethodIndex = i;
        }
    }
    shippingMethodSelect.html(shippingOptions);
    shippingMethodSelect.find('option:eq(' + defaultShippingMethodIndex + ')').prop('selected', true);
    shippingMethodSelect.change();
}

/**
 * re-renders the order totals and the number of items in the cart
 * @param {Object} message - Error message to display
 */
function createErrorNotification(message) {
    var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
        'fade show" role="alert">' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' + message + '</div>';

    $('.cart-error').append(errorHtml);
}

/**
 * re-renders the approaching discount messages
 * @param {Object} approachingDiscounts - updated approaching discounts for the cart
 */
function updateApproachingDiscounts(approachingDiscounts) {
    var html = '';
    $('.approaching-discounts').empty();
    if (approachingDiscounts.length > 0) {
        approachingDiscounts.forEach(function (item) {
            html += '<div class="single-approaching-discount text-center">'
                + item.discountMsg + '</div>';
        });
    }
    $('.approaching-discounts').append(html);
}

/**
 * Updates the availability of a product line item
 * @param {Object} data - AJAX response from the server
 * @param {string} uuid - The uuid of the product line item to update
 */
function updateAvailability(data, uuid) {
    var lineItem;
    var messages = '';

    for (var i = 0; i < data.items.length; i++) {
        if (data.items[i].UUID === uuid) {
            lineItem = data.items[i];
            break;
        }
    }

    $('.availability-' + lineItem.UUID).empty();

    if ('mtdAvailability' in lineItem && lineItem.mtdAvailability) {
        if (lineItem.mtdAvailability.messages) {
            lineItem.mtdAvailability.messages.forEach(function (message) {
                messages += '<p class="line-item-attributes">' + message + '</p>';
            });
        }
    } else if (lineItem.availability) {
        if (lineItem.availability.messages) {
            lineItem.availability.messages.forEach(function (message) {
                messages += '<p class="line-item-attributes">' + message + '</p>';
            });
        }

        if (lineItem.availability.inStockDate) {
            messages += '<p class="line-item-attributes line-item-instock-date hidden">'
                + lineItem.availability.inStockDate
                + '</p>';
        }
    }

    $('.availability-' + lineItem.UUID).html(messages);
}

/**
 * Updates details of a product line item
 * @param {Object} data - AJAX response from the server
 * @param {string} uuid - The uuid of the product line item to update
 */
function updateProductDetails(data, uuid) {
    var lineItem = data.cartModel.items.find(function (item) {
        return item.UUID === uuid;
    });

    if (lineItem.variationAttributes) {
        var colorAttr = lineItem.variationAttributes.find(function (attr) {
            return attr.attributeId === 'color';
        });

        if (colorAttr) {
            var colorSelector = '.Color-' + uuid;
            var newColor = 'Color: ' + colorAttr.displayValue;
            $(colorSelector).text(newColor);
        }

        var sizeAttr = lineItem.variationAttributes.find(function (attr) {
            return attr.attributeId === 'size';
        });

        if (sizeAttr) {
            var sizeSelector = '.Size-' + uuid;
            var newSize = 'Size: ' + sizeAttr.displayValue;
            $(sizeSelector).text(newSize);
        }

        var imageSelector = '.card.product-info.uuid-' + uuid + ' .item-image > img';
        $(imageSelector).attr('src', lineItem.images['line-item'][0].url);
        $(imageSelector).attr('alt', lineItem.images['line-item'][0].alt);
        $(imageSelector).attr('title', lineItem.images['line-item'][0].title);
    }

    var qtySelector = '.quantity[data-uuid="' + uuid + '"]';
    $(qtySelector).val(lineItem.quantity);
    $(qtySelector).data('pid', data.newProductId);

    $('.remove-product[data-uuid="' + uuid + '"]').data('pid', data.newProductId);

    var priceSelector = '.line-item-price-' + uuid + ' .sales .value';
    $(priceSelector).text(lineItem.price.sales.formatted);
    $(priceSelector).attr('content', lineItem.price.sales.decimalPrice);

    if (lineItem.price.list) {
        var listPriceSelector = '.line-item-price-' + uuid + ' .list .value';
        $(listPriceSelector).text(lineItem.price.list.formatted);
        $(listPriceSelector).attr('content', lineItem.price.list.decimalPrice);
    }
}

/**
 * Generates the modal window on the first call.
 *
 */
function getModalHtmlElement() {
    if ($('#editProductModal').length !== 0) {
        $('#editProductModal').remove();
    }
    var htmlString = '<!-- Modal -->'
        + '<div class="modal fade" id="editProductModal" role="dialog" aria-labelledby="modal-title" data-la-initdispnone="true">'
        + '<div class="modal-dialog quick-view-dialog" role="document">'
        + '<!-- Modal content-->'
        + '<div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modalHeading">'
        + '<div class="modal-header">'
        + '    <button type="button" class="close pull-right" data-dismiss="modal">'
        + '        &times;'
        + '    </button>'
        + '</div>'
        + '<div class="modal-body"></div>'
        + '<div class="modal-footer"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    $('#main').append(htmlString);
}

/**
 * Parses the html for a modal window
 * @param {string} html - representing the body and footer of the modal window
 *
 * @return {Object} - Object with properties body and footer.
 */
function parseHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));

    var body = $html.find('.product-quickview');
    var footer = $html.find('.modal-footer').children();

    return { body: body, footer: footer };
}

/**
 * replaces the content in the modal window for product variation to be edited.
 * @param {string} editProductUrl - url to be used to retrieve a new product model
 */
function fillModalElement(editProductUrl) {
    $('.modal-body').spinner().start();
    $.ajax({
        url: editProductUrl,
        method: 'GET',
        dataType: 'html',
        success: function (html) {
            var parsedHtml = parseHtml(html);

            $('#editProductModal .modal-body').empty();
            $('#editProductModal .modal-body').html(parsedHtml.body);
            $('#editProductModal .modal-footer').html(parsedHtml.footer);
            $('#editProductModal').modal('show');
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

/**
 * replace content of modal
 * @param {string} actionUrl - url to be used to remove product
 * @param {string} productID - pid
 * @param {string} productName - product name
 * @param {string} uuid - uuid
 * @param {string} gtmData - GTM data
 * @param {string} qty - item quantity
 */
function confirmDelete(actionUrl, productID, productName, uuid, gtmData, qty, removeCheckoutProduct) {
    var $deleteConfirmBtn = $('.cart-delete-confirmation-btn');
    var $productToRemoveSpan = $('.product-to-remove');

    $deleteConfirmBtn.data('pid', productID);
    $deleteConfirmBtn.data('action', actionUrl);
    $deleteConfirmBtn.data('uuid', uuid);
    $deleteConfirmBtn.attr('data-gtmdata', gtmData);
    $deleteConfirmBtn.attr('data-qty', qty);
    $deleteConfirmBtn.data('removecheckoutproduct', removeCheckoutProduct);

    $productToRemoveSpan.empty().append(productName);
}

module.exports = function () {
    $('body').on('click', '.remove-product', function (e) {
        e.preventDefault();

        var actionUrl = $(this).data('action');
        var productID = $(this).data('pid');
        var productName = $(this).data('name');
        var uuid = $(this).data('uuid');
        var gtmData = $(this).attr('data-gtmdata');
        var qty = $(this).attr('data-qty');
        var removeCheckoutProduct = $(this).data('removecheckoutproduct');
        confirmDelete(actionUrl, productID, productName, uuid, gtmData, qty, removeCheckoutProduct);
    });

    $('body').on('afterRemoveFromCart', function (e, data) {
        e.preventDefault();
        confirmDelete(data.actionUrl, data.productID, data.productName, data.uuid, data.removecheckoutproduct);
    });

    $('body').on('click', '.cart-delete-confirmation-btn', function (e) {
        e.preventDefault();

        var productID = $(this).data('pid');
        var url = $(this).data('action');
        var uuid = $(this).data('uuid');
        var removingCARBProFromCheckout = $(this).data('removecheckoutproduct');
        var urlParams = {
            pid: productID,
            uuid: uuid
        };

        url = appendToUrl(url, urlParams);

        $('body > .modal-backdrop').remove();

        $.spinner().start();
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                var cartShowUrl = data.cartShowUrl;
                if (data.basket.items.length === 0) {
                    if(!(removingCARBProFromCheckout == true)){
                        $('.cart').empty().append('<div class="row"> ' +
                            '<div class="col-12 text-center"> ' +
                            '<h1>' + data.basket.resources.emptyCartMsg + '</h1> ' +
                            '</div> ' +
                            '</div>'
                        );
                        $('.number-of-items').empty().append(data.basket.resources.numberOfItems);
                        $('.minicart-quantity').empty().append(data.basket.numItems);
                        $('.minicart .popover').empty();
                        $('.minicart .popover').removeClass('show');
                        $('body').removeClass('modal-open');
                        $('html').removeClass('veiled');
                    } else {
                        location.replace(cartShowUrl);
                    }
                } else {
                    if (data.toBeDeletedUUIDs && data.toBeDeletedUUIDs.length > 0) {
                        for (var i = 0; i < data.toBeDeletedUUIDs.length; i++) {
                            $('.uuid-' + data.toBeDeletedUUIDs[i]).remove();
                        }
                    }

                    // handle if last line item
                    var isLast = $('.uuid-' + uuid).hasClass('last');
                    var hasSibs = $('.uuid-' + uuid).siblings('.product-info');
                    if (isLast && hasSibs) {
                        $('.uuid-' + uuid).prev().addClass('last');
                    }

                    $('.uuid-' + uuid).remove();
                    if (!data.basket.hasBonusProduct) {
                        $('.bonus-product').remove();
                    }
                    $('.coupons-and-promos').empty().append(data.basket.totals.discountsHtml);
                    updateCartTotals(data.basket);
                    updateApproachingDiscounts(data.basket.approachingDiscounts);
                    updateShippingMethods(data.basket);
                    $('body').trigger('setShippingMethodSelection', data.basket);
                    validateBasket(data.basket);
                }

                // reload page after removing product
                window.location.reload();
                $.spinner().stop();
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                    $.spinner().stop();
                }
            }
        });
    });

    $('.shippingMethods').change(function () {
        var url = $(this).attr('data-actionUrl');
        var urlParams = {
            methodID: $(this).find(':selected').attr('data-shipping-id')
        };
        // url = appendToUrl(url, urlParams);

        $('.totals').spinner().start();
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: urlParams,
            success: function (data) {
                if (data.error) {
                    window.location.href = data.redirectUrl;
                } else {
                    $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
                    updateCartTotals(data);
                    updateApproachingDiscounts(data.approachingDiscounts);
                    validateBasket(data);
                }
                $.spinner().stop();
            },
            error: function (err) {
                if (err.redirectUrl) {
                    window.location.href = err.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                    $.spinner().stop();
                }
            }
        });
    });

    $('.promo-code-form').submit(function (e) {
        e.preventDefault();
        $.spinner().start();
        var inputLabel = $('.promo-code-form').find('label');
        $('.coupon-missing-error').hide();
        $('.coupon-error-message').empty();
        if (!$('.coupon-code-field').val()) {
            $('.promo-code-form .form-control').addClass('is-invalid');
            $('.coupon-missing-error').show();
            inputLabel.addClass('text-danger');
            $.spinner().stop();
            return false;
        }
        var $form = $('.promo-code-form');
        $('.promo-code-form .form-control').removeClass('is-invalid');
        inputLabel.removeClass('text-danger');
        $('.coupon-error-message').empty();

        $.ajax({
            url: $form.attr('action'),
            type: 'GET',
            dataType: 'json',
            data: $form.serialize(),
            success: function (data) {
                if (data.error) {
                    $('.promo-code-form .form-control').addClass('is-invalid');
                    inputLabel.addClass('text-danger');
                    $('.coupon-error-message').empty().append(data.errorMessage);
                } else {
                    $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
                    updateCartTotals(data);
                    updateShippingMethods(data);
                    updateApproachingDiscounts(data.approachingDiscounts);
                    validateBasket(data);
                }
                $('.coupon-code-field').val('');
                $.spinner().stop();
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.errorMessage);
                    $.spinner().stop();
                }
            }
        });
        return false;
    });

    $('body').on('click', '.remove-coupon', function (e) {
        e.preventDefault();

        var couponCode = $(this).data('code');
        var uuid = $(this).data('uuid');
        var $deleteConfirmBtn = $('.delete-coupon-confirmation-btn');
        var $productToRemoveSpan = $('.coupon-to-remove');

        $deleteConfirmBtn.data('uuid', uuid);
        $deleteConfirmBtn.data('code', couponCode);

        $productToRemoveSpan.empty().append(couponCode);
    });

    $('body').on('click', '.delete-coupon-confirmation-btn', function (e) {
        e.preventDefault();

        var url = $(this).data('action');
        var uuid = $(this).data('uuid');
        var couponCode = $(this).data('code');
        var urlParams = {
            code: couponCode,
            uuid: uuid
        };

        url = appendToUrl(url, urlParams);

        $('body > .modal-backdrop').remove();

        $.spinner().start();
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                $('.coupon-uuid-' + uuid).remove();
                updateCartTotals(data);
                updateShippingMethods(data);
                updateApproachingDiscounts(data.approachingDiscounts);
                validateBasket(data);
                $.spinner().stop();
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                    $.spinner().stop();
                }
            }
        });
    });
    $('body').on('click', '.cart-page .bonus-product-button', function () {
        $.spinner().start();
        $.ajax({
            url: $(this).data('url'),
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                lyonsBase.methods.editBonusProducts(data);
                $.spinner().stop();
            },
            error: function () {
                $.spinner().stop();
            }
        });
    });
    $('body').on('click', '.cart-page .product-edit .edit, .cart-page .bundle-edit .edit', function (e) {
        e.preventDefault();

        var editProductUrl = $(this).attr('href');
        getModalHtmlElement();
        fillModalElement(editProductUrl);
        lyonsBase.availability(); // init availability update
    });

    $('body').on('product:updateAddToCart', function (e, response) {
        // update global add to cart (single products, bundles)
        var dialog = $(response.$productContainer)
            .closest('.quick-view-dialog');

        $('.update-cart-product-global', dialog).attr('disabled',
            !$('.global-availability', dialog).data('ready-to-order')
            || !$('.global-availability', dialog).data('available')
        );
    });

    $('body').on('product:updateAvailability', function (e, response) {
        // bundle individual products
        $('.product-availability', response.$productContainer)
            .data('ready-to-order', response.product.readyToOrder)
            .data('available', response.product.available)
            .find('.availability-msg')
            .empty()
            .html(response.message);


        var dialog = $(response.$productContainer)
            .closest('.quick-view-dialog');

        if ($('.product-availability', dialog).length) {
            // bundle all products
            var allAvailable = $('.product-availability', dialog).toArray()
                .every(function (item) { return $(item).data('available'); });

            var allReady = $('.product-availability', dialog).toArray()
                .every(function (item) { return $(item).data('ready-to-order'); });

            $('.global-availability', dialog)
                .data('ready-to-order', allReady)
                .data('available', allAvailable);

            $('.global-availability .availability-msg', dialog).empty()
                .html(allReady ? response.message : response.resources.info_selectforstock);
        } else {
            // single product
            $('.global-availability', dialog)
                .data('ready-to-order', response.product.readyToOrder)
                .data('available', response.product.available)
                .find('.availability-msg')
                .empty()
                .html(response.message);
        }
    });

    $('body').on('product:afterAttributeSelect', function (e, response) {
        if ($('.modal.show .product-quickview .bundle-items').length) {
            $('.modal.show').find(response.container).data('pid', response.data.product.id);
            $('.modal.show').find(response.container).find('.product-id').text(response.data.product.id);
        } else {
            $('.modal.show .product-quickview').data('pid', response.data.product.id);
        }
    });

    $('body').on('change', '.quantity-select', function () {
        var selectedQuantity = $(this).val();
        $('.modal.show .update-cart-url').data('selected-quantity', selectedQuantity);
    });

    $('body').on('click', '.update-cart-product-global', function (e) {
        e.preventDefault();

        var updateProductUrl = $(this).closest('.cart-and-ipay').find('.update-cart-url').val();
        var selectedQuantity = $(this).closest('.cart-and-ipay').find('.update-cart-url').data('selected-quantity');
        var uuid = $(this).closest('.cart-and-ipay').find('.update-cart-url').data('uuid');

        var form = {
            uuid: uuid,
            pid: lyonsBase.getPidValue($(this)),
            quantity: selectedQuantity
        };

        $(this).parents('.card').spinner().start();
        if (updateProductUrl) {
            $.ajax({
                url: updateProductUrl,
                type: 'post',
                context: this,
                data: form,
                dataType: 'json',
                success: function (data) {
                    $('#editProductModal').remove();
                    $('.modal-backdrop').remove();
                    $('body').removeClass('modal-open');

                    $('.coupons-and-promos').empty().append(data.cartModel.totals.discountsHtml);
                    updateCartTotals(data.cartModel);
                    updateShippingMethods(data.cartModel);
                    updateApproachingDiscounts(data.cartModel.approachingDiscounts);
                    updateAvailability(data.cartModel, uuid);
                    updateProductDetails(data, uuid);

                    if (data.uuidToBeDeleted) {
                        $('.uuid-' + data.uuidToBeDeleted).remove();
                    }

                    validateBasket(data.cartModel);

                    $.spinner().stop();
                },
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    } else {
                        createErrorNotification(err.responseJSON.errorMessage);
                        $.spinner().stop();
                    }
                }
            });
        }
    });


    base.selectAttribute();
    base.colorAttribute();
    base.removeBonusProduct();
    base.selectBonusProduct();
    lyonsBase.enableBonusProductSelection();
    lyonsBase.showMoreBonusProducts();
    base.addBonusProductsToCart();
};

/**
 * sets qty on qty selectors in cart
 * @param {Object} element - object
 */
function submitQty(element) {
    var preSelectQty = element.data('pre-select-qty');
    var quantity = element.val();
    var productID = element.data('pid');
    var url = element.data('action');
    var uuid = element.data('uuid');
    var isMiniCart = element.parents('.minicart');

    var urlParams = {
        pid: productID,
        quantity: quantity,
        uuid: uuid
    };
    url = appendToUrl(url, urlParams);

    element.parents('.card').spinner().start();

    $.ajax({
        url: url,
        type: 'get',
        context: this,
        dataType: 'json',
        success: function (data) {
            $('.quantity[data-uuid="' + uuid + '"]').val(quantity);
            $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
            $('body').trigger('extendWarranty:updateQuantity', { element: element, quantity: quantity });
            updateCartTotals(data, isMiniCart);
            updateShippingMethods(data);
            updateApproachingDiscounts(data.approachingDiscounts);
            updateAvailability(data, uuid);
            validateBasket(data);
            element.data('pre-select-qty', quantity);
            $.spinner().stop();
            if (element.parents('.product-info').hasClass('bonus-product-line-item') && $('.cart-page').length) {
                location.reload();
            }
        },
        error: function (err) {
            if (err.responseJSON.redirectUrl) {
                window.location.href = err.responseJSON.redirectUrl;
            } else {
                createErrorNotification(err.responseJSON.errorMessage);
                element.val(parseInt(preSelectQty, 10));
                $.spinner().stop();
            }
        }
    });
}

$('body').on('keyup', '.quantity-form > .quantity', function (event) {
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if (keycode === '13' || keycode === 13) {
        submitQty($(this));
    }
});

$('body').on('change', '.quantity-form > .quantity', function () {
    submitQty($(this));
});

$('body').on('cart:changeDeliveryOption', function (e, data) {
    updateCartTotals(data);
    updateApproachingDiscounts(data.approachingDiscounts);
    validateBasket(data);
});

$('.minicart-total a.minicart-link').on('click', function() {
    $('.minicart-total a.minicart-link').css('pointer-events','none');
    setTimeout(function () {
        $('.minicart-total a.minicart-link').css('pointer-events','auto');
    }, 2000);
});