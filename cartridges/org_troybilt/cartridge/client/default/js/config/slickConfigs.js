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
        pauseOnDotsHover: true,
        pauseOnHover: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        dots: true,
        arrows: true,
        appendDots: $('.hero-slider-controls .slide-dots'),
        prevArrow: $('.hero-slider-controls .slide-prev'),
        nextArrow: $('.hero-slider-controls .slide-next')
    },

    landingGallery: {
        autoplay: false,
        autoplaySpeed: 5000,
        fade: true,
        easing: 'swing',
        infinite: true,
        speed: 800,
        pauseOnDotsHover: true,
        pauseOnHover: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        dots: true,
        arrows: true,
        appendDots: $('.landing-gallery-slider-controls .slide-dots'),
        prevArrow: $('.landing-gallery-slider-controls .slide-prev'),
        nextArrow: $('.landing-gallery-slider-controls .slide-next')
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
        arrows: true,
        vertical: true,
        slidesToShow: 6,
        slidesToScroll: 1,
        asNavFor: '.pdp-carousel',
        dots: false,
        centerMode: false,
        focusOnSelect: true,
        responsive: [
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 5,
                    vertical: false
                }
            }
        ]
    },

    productTiles: {
        infinite: true,
        autoplay: true,
        autoplaySpeed: 5000,
        speed: 300,
        slidesToShow: 4,
        slidesToScroll: 4,
        slide: '.grid-tile',
        dots: true,
        arrows: true,
        appendDots: $('.product-tile-slider-controls .slide-dots'),
        prevArrow: $('.product-tile-slider-controls .slide-prev'),
        nextArrow: $('.product-tile-slider-controls .slide-next'),
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
                    slidesToShow: 2,
                    slidesToScroll: 2
                }
            }
        ]
    },

    contentAssetCarousel: {
        infinite: true,
        speed: 300,
        autoplay: true,
        autoplaySpeed: 5000,
        slidesToShow: 2,
        slidesToScroll: 2,
        swipeToSlide: true,
        dots: true,
        arrows: true,
        appendDots: $('.content-slider-controls .slide-dots'),
        prevArrow: $('.content-slider-controls .slide-prev'),
        nextArrow: $('.content-slider-controls .slide-next'),
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

    pdpFeatures: {
        infinite: true,
        speed: 300,
        autoplay: true,
        autoplaySpeed: 5000,
        slidesToShow: 3,
        slidesToScroll: 3,
        swipeToSlide: true,
        dots: true,
        arrows: true,
        appendDots: $('.pdp-feature-slider-controls .slide-dots'),
        prevArrow: $('.pdp-feature-slider-controls .slide-prev'),
        nextArrow: $('.pdp-feature-slider-controls .slide-next'),
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
        slidesToShow: 4,
        slidesToScroll: 1,
        swipeToSlide: true,
        dots: true,
        arrows: true,
        appendDots: $('.blog-tile-slider-controls .slide-dots'),
        prevArrow: $('.blog-tile-slider-controls .slide-prev'),
        nextArrow: $('.blog-tile-slider-controls .slide-next'),
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

module.exports = exportLyonsmfra;
