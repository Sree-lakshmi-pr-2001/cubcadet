'use strict';

var base = require('./base');
var detail = require('lyonscg/product/detail');
var manuals = require('org_ma/manuals/manuals');
var search = require('../search/search');

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

var exportDetail = $.extend({}, detail, {
    downloadManual: function () {
        manuals.downloadManuals();
    },
    availability: base.availability,
    addToCart: base.addToCart,
    addToCartTiles: search.addToCart,
    updateAddToCart: function () {
        $('body').on('product:updateAddToCart', function (e, response) {
            // update local add to cart (for sets)
            $('button.add-to-cart', response.$productContainer).attr('disabled',
                (!response.product.readyToOrder || !response.product.available || !response.product.priceAvailability || response.product.isBuyable === false));

            enableAddAllItemsToCart();
        });
        enableAddAllItemsToCart();
    },
    pdpSpecsCollapse: base.pdpSpecsCollapse,
    updateAttribute: function () {
        base.carouselInit();

        $('body').on('product:afterAttributeSelect', function (e, response) {
            if ($('.product-detail>.bundle-items').length) {
                response.container.data('pid', response.data.product.id);
                response.container.find('.product-id').text(response.data.product.id);
            } else if ($('.product-set-detail').eq(0)) {
                response.container.data('pid', response.data.product.id);
                response.container.find('.product-id').text(response.data.product.id);
            } else {
                $('.product-id').text(response.data.product.id);
                $('.product-detail:not(".bundle-item")').data('pid', response.data.product.id);
            }
        });
    }
});

module.exports = exportDetail;
