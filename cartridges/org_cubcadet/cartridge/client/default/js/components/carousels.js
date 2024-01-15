'use strict';

var orgMa = require('org_ma/components/carousels');
var slickConfigs = require('../config/slickConfigs');

var exportOrgMa = $.extend({}, orgMa, {
    promotionsCarousel: function () {
        var promotionsCarousel = $('.see-promotions-cards');
        if (promotionsCarousel.length) {
            promotionsCarousel.not('.slick-initialized').slick(slickConfigs.promotionsCarousel);
        }
    },
    newsCarousel: function () {
        var newsCarousel = $('.news-item-cards');
        if (newsCarousel.length) {
            newsCarousel.not('.slick-initialized').slick(slickConfigs.newsCarousel);
        }
    },
    stickyCarousel: function () {
        var stickyCarousel = $('.nav-links');
        if (stickyCarousel.length) {
            stickyCarousel.not('.slick-initialized').slick(slickConfigs.stickyCarousel);
        }
    }
});

module.exports = exportOrgMa;
