'use strict';

var lyonsmfra = require('lyonscg/config/slickConfigs');

var exportLyonsmfra = $.extend({}, lyonsmfra, {
    hero: {
        autoplay: true,
        autoplaySpeed: 5000,
        fade: true,
        easing: 'swing',
        infinite: true,
        speed: 800,
        dots: true,
        pauseOnDotsHover: true,
        pauseOnHover: true,
        arrows: false,
        slidesToShow: 1,
        slidesToScroll: 1,
        adaptiveHeight: true,
        adaptiveHeightSpeed: 500,
        responsive: true
    },
    pdp: {
        infinite: true,
        draggable: false,
        swipe: false,
        speed: 400,
        dots: true,
        arrows: true,
        slidesToShow: 1,
        slidesToScroll: 1
    },

    pdpNav: {
        vertical: false,
        arrows: true,
        slidesToShow: 3,
        slidesToScroll: 1,
        asNavFor: '.pdp-carousel',
        dots: false,
        centerMode: false,
        focusOnSelect: true
    },

    productTiles: {
        infinite: true,
        accessibility: false,
        autoplay: true,
        autoplaySpeed: 5000,
        speed: 300,
        dots: false,
        arrows: true,
        slidesToShow: 4,
        slidesToScroll: 1,
        slide: '.grid-tile',
        responsive: [
            {
                breakpoint: 991,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 3
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    dots: true,
                    arrows: false
                }
            }
        ]
    },

    pdpFeatures: {
        infinite: true,
        speed: 300,
        autoplay: true,
        autoplaySpeed: 5000,
        dots: true,
        arrows: false,
        slidesToShow: 3,
        slidesToScroll: 3,
        swipeToSlide: true,
        responsive: [
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2
                }
            },
            {
                breakpoint: 544,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    },

    gallery: {
        infinite: false, // true will create an infinite number of duplicates of each video embeded slide
        speed: 300,
        dots: true,
        arrows: false,
        autoplay: false,
        fade: true
    },

    blogTiles: {
        infinite: true,
        speed: 300,
        slidesToShow: 3,
        slidesToScroll: 1,
        swipeToSlide: true,
        dots: true,
        arrows: true,
        appendDots: $('.blog-posts-slider-controls .slide-dots'),
        prevArrow: $('.blog-posts-slider-controls .slide-prev'),
        nextArrow: $('.blog-posts-slider-controls .slide-next'),
        responsive: [
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    },

    relatedBlogTiles: {
        infinite: true,
        speed: 300,
        slidesToShow: 2,
        slidesToScroll: 1,
        swipeToSlide: true,
        dots: false,
        arrows: false,
        appendDots: $('.blog-tile-slider-controls .slide-dots'),
        prevArrow: $('.blog-tile-slider-controls .slide-prev'),
        nextArrow: $('.blog-tile-slider-controls .slide-next'),
        responsive: [
            {
                breakpoint: 991,
                settings: {
                    slidesToShow: 2,
                    dots: true,
                    slidesToScroll: 3
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                    dots: true,
                    slidesToScroll: 2
                }
            },
            {
                breakpoint: 544,
                settings: {
                    slidesToShow: 1,
                    dots: true,
                    slidesToScroll: 1
                }
            }
        ]
    }
});

module.exports = exportLyonsmfra;
