'use strict';
var quickView = require('base/product/quickView');
var base = require('./base');

/**
 * Generates the modal window on the first call.
 * @param {Object} textData - text translated data
 */
function getModalHtmlElement(textData) {
    if ($('#quickViewModal').length !== 0) {
        $('#quickViewModal').remove();
    }
    var htmlString = '<!-- Modal -->'
        + '<div class="modal fade" id="quickViewModal" tabindex="-1" role="dialog" aria-labelledby="modal-title" data-la-initdispnone="true">'
        + '<div class="modal-dialog quick-view-dialog" role="document">'
        + '<!-- Modal content-->'
        + '<div class="modal-content">'
        + '<div class="modal-header">'
        + '    <a class="full-pdp-link" href="">' + textData.fullDetail + '</a>'
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
 * @typedef {Object} QuickViewHtml
 * @property {string} body - Main Quick View body
 * @property {string} footer - Quick View footer content
 */

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
 * sets focus on modal after it loads.
 */
function focusModal() {
    setTimeout(function () {
        var modalExists = $('body').find('#quickViewModal');
        if (modalExists.length > 0) {
            $('#quickViewModal').focus();
        } else {
            focusModal();
        }
    }, 10);
}

/**
 * replaces the content in the modal window on for the selected product variation.
 * @param {string} productUrl - url to be used for going to the product details page
 * @param {string} selectedValueUrl - url to be used to retrieve a new product model
 */
function fillModalElement(productUrl, selectedValueUrl) {
    $('.modal-body').spinner().start();
    $.ajax({
        url: selectedValueUrl,
        method: 'GET',
        dataType: 'html',
        success: function (html) {
            var parsedHtml = parseHtml(html);

            $('#quickViewModal .modal-body').empty();
            $('#quickViewModal .modal-body').html(parsedHtml.body);
            $('#quickViewModal .modal-footer').html(parsedHtml.footer);
            $('#quickViewModal .full-pdp-link').attr('href', productUrl);
            $('#quickViewModal .size-chart').attr('href', productUrl);
            $('#quickViewModal').modal('show');
            var dialog = $('#quickViewModal');
            var addToCartGlobal = $('.add-to-cart-global', dialog);
            if ($('.global-availability', dialog).hasClass('global-product-set')) {
                var enable = $('.product-availability').toArray().every(function (item) {
                    return $(item).data('available') && $(item).data('ready-to-order');
                });
                addToCartGlobal.attr('disabled', !enable);
            }
            $.spinner().stop();
            focusModal();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

var exportQuickView = $.extend({}, quickView, {
    addToCart: base.addToCart,
    showQuickview: function () {
        $('body').on('click', '.quickview', function (e) {
            e.preventDefault();
            var selectedValueUrl = $(this).closest('a.quickview').attr('href');
            var productUrl = selectedValueUrl.replace('Product-ShowQuickView', 'Product-Show');
            $(e.target).trigger('quickview:show');
            var textData = {
                fullDetail: $(this).attr('data-full-detail-txt')
            };
            getModalHtmlElement(textData);
            fillModalElement(productUrl, selectedValueUrl);
            focusModal();
        });
    },
    updateAddToCart: function () {
        $('body').on('product:updateAddToCart', function (e, response) {
            // update local add to cart (for sets)
            $('button.add-to-cart', response.$productContainer).attr('disabled',
                (!response.product.readyToOrder || !response.product.available || !response.product.priceAvailability));

            // update global add to cart (single products, bundles)
            var dialog = $(response.$productContainer)
                .closest('.quick-view-dialog');
            var addToCartGlobal = $('.add-to-cart-global', dialog);
            if (!$('.global-availability', dialog).hasClass('global-product-set')) {
                addToCartGlobal.attr('disabled',
                    !$('.global-availability', dialog).data('ready-to-order')
                    || !$('.global-availability', dialog).data('available')
                    || !$('.global-availability', dialog).data('price-available')
                );
            } else {
                var enable = $('.product-availability').toArray().every(function (item) {
                    return $(item).data('available') && $(item).data('ready-to-order');
                });
                addToCartGlobal.attr('disabled', !enable);
            }
        });
    }
});

module.exports = exportQuickView;
