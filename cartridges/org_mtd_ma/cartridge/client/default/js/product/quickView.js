'use strict';

var base = require('./base');
var quickView = require('lyonscg/product/quickView');
var carousels = require('../components/carousels');

/**
 * Generates the modal window on the first call.
 * @param {Object} textData - text translated data
 *
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
            $('#quickViewModal .modal-body').find('.product-full-detail-btn').attr('href', productUrl);
            $('#quickViewModal .full-pdp-link').attr('href', productUrl);
            $('#quickViewModal .size-chart').attr('href', productUrl);
            $('[data-toggle="popover"]').popover({
                trigger: 'manual'
            });
            $('[data-toggle="popover"]').on('click', function () {
                $(this).popover('toggle');
            });
            $('[data-toggle="popover"]').keyup(function (e) {
                var code = e.key;
                if (code === 'Enter') e.preventDefault();
                if (code === ' ' || code === 'Enter' || code === ',' || code === ';') {
                    $(this).popover('toggle');
                }
            });
            $('#quickViewModal').modal('show');

            // init the specific spinner only
            var qvSpinner = $('#quickViewModal').find('.Magic360');
            if (qvSpinner) {
                qvSpinner.each(function () {
                    var spinId = this.getAttribute('id');
                    window.Magic360.start(spinId);
                });
            }
            $.spinner().stop();
        },
        complete: function () {
            var dialog = $('#quickViewModal');
            var addToCartGlobal = $('.add-to-cart-global', dialog);
            if ($('.global-availability', dialog).hasClass('global-product-set')) {
                $('.modal-footer').addClass('quickview-set-footer');
            }
            // using does not equal for cases if value is "none or null"

            if ($('.product-availability').length > 0) {
                var enable = $('.product-availability').toArray().every(function (item) {
                    return $(item).data('available') && $(item).data('price-available') && $(item).data('ready-to-order') && $(item).data('buyable') !== false && $(item).data('request-demo') !== true;
                });

                addToCartGlobal.attr('disabled', !enable);
            }
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
        var modalExists = $('body').find('#quickViewModal');
        if (modalExists.length > 0) {
            $('#quickViewModal').focus();
        } else {
            focusModal();
        }
    }, 10);
}

function initRatingsAndReviewsObserver() {
    var target = document.querySelector('.product-grid');

    if (!target) {
        return;
    }

    // Add an observer that checks if the component .ratings has changed and if so print in the console.log a message
    var callback = function (mutationsList) {
        for (var mutation of mutationsList) {
            if (!mutation.target || !mutation.target.classList.contains('js-bv-ratings') || mutation.type !== 'childList' || !mutation.addedNodes.length) {
                return;
            }

            var addedNode = mutation.addedNodes[0];
            var bvNumReviews = addedNode.querySelector(".bv_numReviews_component_container .bv_text");
            var bvNumReviewsMeta = addedNode.querySelector(".bv_numReviews_component_container meta");
            var bvAverageRating = addedNode.querySelector(".bv_averageRating_component_container meta");
            var shouldRemoveRatingComponent = false;

            if (bvNumReviews && bvNumReviews.textContent) {
                var reviewsCount = parseInt(bvNumReviews.textContent.replace(/[^0-9]/g, ''), 10);
                shouldRemoveRatingComponent = !reviewsCount;
            } else if (bvNumReviewsMeta && bvNumReviewsMeta.getAttribute("content")) {
                var reviewsCount = parseInt(bvNumReviewsMeta.getAttribute("content"), 10);
                shouldRemoveRatingComponent = !reviewsCount;
            } else if (bvAverageRating && bvAverageRating.getAttribute("content")) {
                var averageRating = parseFloat(bvAverageRating.getAttribute("content"));
                shouldRemoveRatingComponent = !averageRating;
            }

            if (shouldRemoveRatingComponent) {
                addedNode.remove();
            }
        }
    }

    var observer = new MutationObserver(callback);
    var config = { childList: true, subtree: true };
    observer.observe(target, config);
}

var exportQuickView = $.extend({}, quickView, {
    quickViewCarouselInit: function () {
        $('body').on('shown.bs.modal', '#quickViewModal', function () {
            carousels.pdpCarousel();
        });
    },
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
    availability: base.availability,
    addToCart: base.addToCart,
    initRatingsAndReviewsObserver: initRatingsAndReviewsObserver,
    updateAddToCart: function () {
        $('body').on('product:updateAddToCart', function (e, response) {
            // update local add to cart (for sets)

            $('button.add-to-cart', response.$productContainer).attr('disabled',
                (!response.product.readyToOrder || !response.product.priceAvailability || !response.product.available || response.isBuyable === false || response.requestDemo === true));

            // update global add to cart (single products, bundles)
            var dialog = $(response.$productContainer)
                .closest('.quick-view-dialog');
            var addToCartGlobal = $('.add-to-cart-global', dialog);
            if (!$('.global-availability', dialog).hasClass('global-product-set')) {
                addToCartGlobal.attr('disabled',
                    !$('.global-availability', dialog).data('ready-to-order')
                    || !$('.global-availability', dialog).data('available')
                    || !$('.global-availability', dialog).data('price-available')
                    || $('.global-availability', dialog).data('buyable') === false
                    || $('.global-availability', dialog).data('request-demo') === true
                );
            } else {
                // using does not equal for cases if value is "none or null"
                var enable = $('.global-availability').toArray().every(function (item) {
                    return $(item).data('available') && $(item).data('price-available') && $(item).data('ready-to-order') && $(item).data('buyable') !== false && $(item).data('request-demo') !== true;
                });
                addToCartGlobal.attr('disabled', !enable);
            }
        });
    }
});

module.exports = exportQuickView;
