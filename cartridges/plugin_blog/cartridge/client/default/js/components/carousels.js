'use strict';
var baseCarousel = require('lyonscg/components/carousels');
var slickConfigs = require('../config/slickConfigs');

module.exports = $.extend({}, baseCarousel, {
    blogCarousels: function () {
        $('.blog-tile-caro').slick(slickConfigs.blogTiles);
    },
    categorySubFolder: function () {
        $('.category-subfolder-tile-caro').slick(slickConfigs.categorySubFolderTiles);
    },
    productRelatedContent: function () {
        $('.product-related-content-tile-caro').slick(slickConfigs.productRelatedContent);
    }
});
