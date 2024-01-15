'use strict';
var slickConfigs = require('../config/slickConfigs');

/**
 * Init globally reusable carousels
 */

module.exports = {
    equalHeight: function () {
        $(window).on('load', function () {
            $('body').find('.slick-initialized.slick-slider').each(function () {
                var height = '';

                $(this).find('.slick-slide').each(function () {
                    height = height > $(this).outerHeight() ? height : $(this).outerHeight();
                }).css('height', height + 'px');
            });
        });
    },
    heroCarousels: function () {
        $('.hero-caro').not('.slick-initialized').slick(slickConfigs.hero);
    },
    productTileCarousels: function () {
        $('.product-tile-caro').not('.slick-initialized').slick(slickConfigs.productTiles);
    }
};
