'use strict';

var orgMa = require('org_ma/config/slickConfigs');

var exportOrgMa = $.extend({}, orgMa, {
    promotionsCarousel: {
        infinite: false,
        speed: 300,
        slidesToShow: 1,
        slidesToScroll: 1,
        variableWidth: true,
        swipeToSlide: true,
        dots: true,
        arrows: false,
        appendDots: $('.see-promotions-controls .slide-dots')
    },
    newsCarousel: {
        infinite: false,
        speed: 300,
        slidesToShow: 1,
        slidesToScroll: 1,
        variableWidth: true,
        swipeToSlide: true,
        dots: true,
        arrows: false
    },
    stickyCarousel: {
        infinite: false,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 1,
        variableWidth: true,
        dots: false,
        arrows: true
    }
});

module.exports = exportOrgMa;
