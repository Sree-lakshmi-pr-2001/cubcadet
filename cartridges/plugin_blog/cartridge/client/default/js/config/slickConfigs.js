'use strict';
var baseConfigs = require('lyonscg/config/slickConfigs');
/**
 * Reusable Blog slick carousel configurations
 * @example - $('.product-carousel').slick(slickConfigs.pdp)
 */
module.exports = $.extend({}, baseConfigs, {
    blogTiles: {
        infinite: true,
        speed: 300,
        dots: false,
        arrows: true,
        slidesToShow: 4,
        slidesToScroll: 1,
        swipeToSlide: true,
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
    },
    categorySubFolderTiles: {
        infinite: true,
        speed: 300,
        dots: false,
        arrows: true,
        slidesToShow: 8,
        slidesToScroll: 1,
        swipeToSlide: true,
        responsive: [
            {
                breakpoint: 991,
                settings: {
                    slidesToShow: 6,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 4,
                    slidesToScroll: 1
                }
            }
        ]
    },
    productRelatedContent: {
        infinite: true,
        speed: 300,
        dots: false,
        arrows: true,
        slidesToShow: 4,
        slidesToScroll: 1,
        swipeToSlide: true,
        responsive: [
            {
                breakpoint: 991,
                settings: {
                    slidesToShow: 6,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 4,
                    slidesToScroll: 1
                }
            }
        ]
    }
});
