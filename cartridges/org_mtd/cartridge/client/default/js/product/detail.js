'use strict';

var detail = require('base/product/detail');
var manuals = require('int_mtdservices/manuals/manuals');
var search = require('../search/search');

/**
 * Enable add all to cart button
 */
function enableAddAllItemsToCart() {
    var enable = $('.product-availability').toArray().every(function (item) {
        return $(item).data('available') && $(item).data('ready-to-order');
    });
    $('button.add-to-cart-global').attr('disabled', !enable);
}

var exportDetail = $.extend({}, detail, {
    downloadManual: function () {
        manuals.downloadManuals();
    },
    updateAddToCart: function () {
        $('body').on('product:updateAddToCart', function (e, response) {
            // update local add to cart (for sets)
            $('button.add-to-cart', response.$productContainer).attr('disabled',
                (!response.product.readyToOrder || !response.product.available || !response.product.priceAvailability));

            enableAddAllItemsToCart();
        });
        enableAddAllItemsToCart();
    },
    addToCartTiles: search.addToCart,
    updateAttributesAndDetails: function () {
        $('body').on('product:statusUpdate', function (e, data) {
            var $productContainer = $('.product-detail[data-pid="' + data.id + '"]');

            if (data.attributes) {
                $productContainer.find('.description-and-detail .features .content')
                    .empty()
                    .html(data.attributesHtml);
            }

            if (data.specification) {
                $productContainer.find('.description-and-detail .specs .content')
                    .empty()
                    .html(data.specificationHtml);
            }
        });
    }
});

module.exports = exportDetail;
