'use strict';

/**
 * Generates the modal window on the first call.
 *
 */

/* global $ */

/**
 * getModalHtmlElement
 * @param {fPM-KO Medallia Digitalunction} callback - callback function
 */
function getModalHtmlElement(ZTRInCart) {
    if ($('#exdedWarantyModal').length !== 0) {
        $('#exdedWarantyModal').remove();
    }
    window.ZTRInCart = ZTRInCart ? ZTRInCart : null;
    var htmlString = '<!-- Modal -->'
        + '<div class="modal fade" id="exdedWarantyModal" tabindex="-1" role="dialog" aria-labelledby="modal-title" data-la-initdispnone="true">'
        + '<div class="modal-dialog quick-view-dialog" role="document">'
        + '<!-- Modal content-->'
        + '<div class="modal-content">'
        + '<div class="modal-header">'
        + '    <a class="full-pdp-link" href="">View Full Details</a>'
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
 * Parse HTML code in Ajax response
 *
 * @param {string} html - Rendered HTML from quickview template
 * @return {QuickViewHtml} - QuickView content components
 */
function parseHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));

    var body = $html.find('.product-quickview');
    var footer = $html.find('.modal-footer').children();

    return { body: body, footer: footer };
}

/**
 * replaces the content in the modal window on for the selected product variation.
 * @param {string} productUrl - url to be used for going to the product details page
 * @param {string} selectedValueUrl - url to be used to retrieve a new product model
 */
function fillModalElement(productUrl, selectedValueUrl) {
    $.ajax({
        url: selectedValueUrl,
        method: 'GET',
        dataType: 'html',
        success: function (html) {
            var parsedHtml = parseHtml(html);

            $('#exdedWarantyModal .modal-body').empty();
            $('#exdedWarantyModal .modal-body').html(parsedHtml.body);
            $('#exdedWarantyModal .modal-footer').html(parsedHtml.footer);
            $('#exdedWarantyModal .full-pdp-link').attr('href', productUrl);
            $('#exdedWarantyModal .size-chart').attr('href', productUrl);
            $('#exdedWarantyModal').modal('show');
            $.spinner().stop();
            $('.modal-content').focus();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

/**
 * sets focus on modal after it loads.
 */
function focusModal() {
    setTimeout(function () {
        var modalExists = $('body').find('#exdedWarantyModal');
        if (modalExists.length > 0) {
            $('#exdedWarantyModal').focus();
        } else {
            focusModal();
        }
    }, 10);
}

/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 * @param {string} pid - product id of product added to cart
 * @param {boolean} needLocationReload - need or not reload window location after product added to cart
 */
function handlePostCartAdd(response, pid, redirectUrl) {
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
        productName = matchPid && matchPid[0] && matchPid[0].productName ? matchPid[0].productName : '';
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
        window.location.href = redirectUrl;
    }, 5000);
}

module.exports = function () {
    $('body').on('product:showExtendWarranty', function (event, eventData) {
        $('.minicart').trigger('count:update', eventData);

        var selectedValueUrl = eventData.urls.warranty;
        var productUrl = selectedValueUrl.replace('Product-ShowExtendedWarranty', 'Product-Show');

        getModalHtmlElement(eventData.ZTRInCart ? eventData.ZTRInCart : '' );
        fillModalElement(productUrl, selectedValueUrl);
        focusModal();
    });

    $(document).on('click', 'button.add-to-cart-tile', function () {
        $('#exdedWarantyModal').modal('hide');
    });

    $(document).on('click', 'button.add-to-cart-warranty', function () {
        $.spinner().start();
        var addToCartUrl = $(this).data('add-to-cart-url');
        var pid = $(this).data('pid');
        var quantity = $(this).data('quantity') || 1;
        var parentPid = $(this).data('parent-pid');
        var parentProductName = $(this).data('parent-product-name');
        var redirectUrl = $(this).data('redirect-url');

        $('body').trigger('product:beforeAddToCart', this);

        var form = {
            pid: pid,
            quantity: quantity,
            warrantyParentPid: parentPid,
            warrantyParentProductName: parentProductName
        };

        $(this).trigger('updateAddToCartFormData', form);
        if (addToCartUrl) {
            $.ajax({
                url: addToCartUrl,
                method: 'POST',
                data: form,
                success: function (data) {
                    var resPid = form.pidsObj ? form.pidsObj : form.pid;
                    handlePostCartAdd(data, resPid, redirectUrl);
                    $('body').trigger('product:afterAddToCart', data);
                    $('#exdedWarantyModal').modal('hide');
                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        }
    });

    $('body').on('extendWarranty:updateQuantity', function (e, data) {
        var $buttonElem = data.element.closest('.card.product-info').find('button.add-to-cart-warranty');
        if ($buttonElem.length > 0) {
            $buttonElem.attr('data-quantity', data.quantity);
        }
    });

    $('body').on('click', 'input[type="checkbox"].registration-continue', function () {
        var $nextBtn = $('button.product-registration');
        var $selectValue = $('.warrantyPurchasedFrom').val();

        if($(this).is(':checked') && $selectValue !== 'None') {
            $nextBtn.prop('disabled', false);
        } else if ($(this).is(':not(:checked)')) {
            $nextBtn.prop('disabled', true);
        }

    });

    $('body').on('change', 'select.warrantyPurchasedFrom', function () {
        var $nextBtn = $('button.product-registration');
        var $checkboxValue = $('input[type="checkbox"].registration-continue');
        var $selectValue = $('.warrantyPurchasedFrom').val();

        if($selectValue !== 'None' && $checkboxValue.is(':checked')) {
            $nextBtn.prop('disabled', false);
        } else {
            $nextBtn.prop('disabled', true);
        }

    });

    $(document).on('click', 'dt.question', function () {
        if($(this).hasClass('active-tab')) {
            $(this).removeClass('active-tab');
            $(this).next('dd').removeClass('active-tab');
        } else {
            $('.show-tab').find('dd, dt').removeClass('active-tab');
            $(this).addClass('active-tab');
            $(this).next('dd').addClass('active-tab');
        }
    })
};
