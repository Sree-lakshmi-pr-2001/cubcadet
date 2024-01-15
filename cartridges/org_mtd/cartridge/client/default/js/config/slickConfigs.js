'use strict';

var lyonsmfra = require('lyonscg/config/slickConfigs');

var exportLyonsmfra = $.extend({}, lyonsmfra, {
    productTiles: {
        infinite: true,
        speed: 300,
        dots: true,
        arrows: true,
        slidesToShow: 4,
        slidesToScroll: 1,
        slide: '.grid-tile',
        responsive: [
            {
                breakpoint: 991,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1
                }
            }
        ]
    }
});

module.exports = exportLyonsmfra;
