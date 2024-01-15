'use strict';

var lyonsmfra = require('lyonscg/components/carousels');
var slickConfigs = require('../config/slickConfigs');
var utils = require('lyonscg/util/utils');
var imagesloaded = require('imagesloaded');

/**
 * Watches for CQuotient injected product tiles and then inits the carousel
 * @param {string} selector the selector to check
 * @param {string} fn the callback
 */
var einsteinObserver = function einsteinObserver(selector, fn) {
    // Watching for Desired Element Availability
    var listeners = [];
    var doc = window.document;
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    var observer;

    /**
     * check the elements
     */
    var check = function check() {
        // Check the DOM for elements matching a stored selector
        for (var i = 0, len = listeners.length, listener, elements; i < len; i++) {
            listener = listeners[i];
            // Query for elements matching the specified selector
            elements = doc.querySelectorAll(listener.selector);
            for (var j = 0, jLen = elements.length, element; j < jLen; j++) {
                element = elements[j];
                // Make sure the callback isn't invoked with the
                // same element more than once
                if (!element.ready) {
                    element.ready = true;
                    // Invoke the callback with the element
                    listener.fn.call(element, element);
                }
            }
        }
    };

    /**
     * check the elements
     * @param {string} selector the selector to check
     * @param {string} fn the callback
     */
    function ready() {
    // Store the selector and callback to be monitored
        listeners.push({
            selector: selector,
            fn: fn
        });
        if (!observer) {
        // Watch for changes in the document
            observer = new MutationObserver(check);
            observer.observe(doc.documentElement, {
                childList: true,
                subtree: true
            });
        }
    // Check if the element is currently in the DOM
        check();
    }

    // start observing
    ready(selector, fn);
};

/**
 * POST commands to YouTube or Vimeo API
 * @param {string} player - Player selector
 * @param {string} command - Command to player
 */
var postMessageToPlayer = function (player, command) {
    if (player == null || command == null) return;
    player.contentWindow.postMessage(JSON.stringify(command), '*');
};

/**
 * Play or Pause video when the slide is changing
 * @param {string} slick - Slick slide selector
 * @param {string} control -  Video host
 */
var playPauseVideo = function (slick, control) {
    var currentSlide = slick.find('.slick-current');
    var slideType = currentSlide.attr('class').split(' ')[1];
    var player = currentSlide.find('iframe').get(0);
    var startTime = currentSlide.data('video-start');

    if (slideType === 'vimeo') {
        switch (control) {
            case 'play':
                if ((startTime != null && startTime > 0) && !currentSlide.hasClass('started')) {
                    currentSlide.addClass('started');
                    postMessageToPlayer(player, {
                        method: 'setCurrentTime',
                        value: startTime
                    });
                }
                postMessageToPlayer(player, {
                    method: 'play',
                    value: 1
                });
                break;
            case 'pause':
                postMessageToPlayer(player, {
                    method: 'pause',
                    value: 1
                });
                break;
            default:
                break;
        }
    } else if (slideType === 'youtube') {
        switch (control) {
            case 'play':
                postMessageToPlayer(player, {
                    event: 'command',
                    func: 'playVideo'
                });
                break;
            case 'pause':
                postMessageToPlayer(player, {
                    event: 'command',
                    func: 'pauseVideo'
                });
                break;
            default:
                break;
        }
    } else if (slideType === 'video') {
        var video = currentSlide.children('video').get(0);
        if (video != null) {
            if (control === 'play') {
                video.play();
            } else {
                video.pause();
            }
        }
    }
};

/**
 * Initialize video controls for slick slider videos
 * @param {string} slideWrapper - Slick slider to target
 */
var videoControlsInit = function (slideWrapper) {
    // Initialize
    slideWrapper.on('init', function (slick) {
        var slickCurrent = $(slick.currentTarget);
        playPauseVideo(slickCurrent, 'play');
    });
    slideWrapper.on('click', function (slick) {
        var slickCurrent = $(slick.currentTarget);
        if ($(this).find('.video-wrapper').hasClass('slick-current')) {
            if (!($(this).find('.video-wrapper.slick-current').hasClass('paused'))) {
                $(this).find('.video-wrapper.slick-current').addClass('paused');
                playPauseVideo(slickCurrent, 'pause');
            } else {
                if ($(this).find('.video-wrapper.slick-current').hasClass('paused')) {
                    $(this).find('.video-wrapper.slick-current').removeClass('paused');
                }
                playPauseVideo(slickCurrent, 'play');
            }
        }
    });
    slideWrapper.on('beforeChange', function (event, slick) {
        var slickBefore = $(slick.$slider);
        playPauseVideo(slickBefore, 'pause');
        if ($(this).find('.video-wrapper').hasClass('slick-current') && !($(this).find('.video-wrapper.slick-current').hasClass('paused'))) {
            $(this).find('.video-wrapper.slick-current').addClass('paused');
        }
    });
    slideWrapper.on('afterChange', function (event, slick) {
        var slickAfter = $(slick.$slider);
        playPauseVideo(slickAfter, 'play');
        if ($(this).find('.video-wrapper').hasClass('slick-current') && $(this).find('.video-wrapper.slick-current').hasClass('paused')) {
            $(this).find('.video-wrapper.slick-current').removeClass('paused');
        }
    });
};

var exportLyonsmfra = $.extend({}, lyonsmfra, {
    pdpCarousel: function () {
        var has360 = $('.pdp-carousel').find('.Magic360').length > 0;
        if (has360) {
            slickConfigs.pdp.swipe = false;
        } else {
            slickConfigs.pdp.swipe = true;
        }

        var productImageLength = $('.pdp-carousel-nav').find('.slide-link').length < 3;
        if (!productImageLength) {
            slickConfigs.pdpNav.slidesToShow = 3;
        } else {
            $('.pdp-carousel-nav').css({ 'max-width': '380px' });
            slickConfigs.pdpNav.slidesToShow = 2;
        }
        $('.pdp-carousel').not('.slick-initialized').slick(slickConfigs.pdp);
        $('.pdp-carousel-nav').not('.slick-initialized').each(function () {
            imagesloaded($(this)).on('done', function (carousel) {
                var slider = $(carousel.elements);
                var productID = slider.attr('data-product-id');
                var defaultConfig = slickConfigs.pdpNav.asNavFor;

                // Add unique class to prevent multiple nav sliders from effecting each other -  ex. Set PDPs
                slickConfigs.pdpNav.asNavFor = slickConfigs.pdpNav.asNavFor + '.' + productID;
                slider.slick(slickConfigs.pdpNav);

                // Reverts config to default to prevent chaining previous product ID
                slickConfigs.pdpNav.asNavFor = defaultConfig;

                $(window).trigger('resize');
            });
        });
    },
    cadetBlogCarousels: function () {
        var blogCarousel = $('.blog-tile-caro');
        utils.smartResize(function () {
            if (utils.mediaBreakpointDown('md')) {
                blogCarousel.not('.slick-initialized').each(function (idx) {
                    var $slider = $(this);
                    var sliderID = 'blogSlider' + idx;

                    $slider.attr('id', sliderID);
                    imagesloaded($slider).on('done', function () {
                        $slider.slick(slickConfigs.blogTiles);
                    });
                });
            } else {
                // insurance to prevent double init
                $('.blog-tile-caro.slick-initialized').slick('unslick');
            }
        });
    },

    relatedBlogCarousels: function () {
        $('.related-blog-tile-caro').not('.slick-initialized').slick(slickConfigs.relatedBlogTiles);
    },

    productTileCarousels: function () {
        var $productTileCaro = $('.product-tile-caro');
        $productTileCaro.not('.slick-initialized').slick(slickConfigs.productTiles);
        imagesloaded($productTileCaro).on('done', function () {
            $(window).resize();
        });

        $productTileCaro.find('.product-tile').each(function () {
            $(this).find('.link').attr('tabindex', '-1');
        });

        // check PI recommendations content
        einsteinObserver('.product-tile-caro', function () {
            setTimeout(function () {
                exportLyonsmfra.productTileCarousels();
            }, 1000);
        });

        utils.smartResize(function () {
            exportLyonsmfra.synchTileHeight();
        });
    },
    pdpFeaturesCarousels: function () {
        $('.pdp-feature-card-carousel').not('.slick-initialized').slick(slickConfigs.pdpFeatures);
    },
    galleryCarousels: function () {
        $('.gallery-caro').not('.slick-initialized').slick(slickConfigs.gallery);
        var slideWrapper = $('.gallery-caro');
        videoControlsInit(slideWrapper);
    },
    heroCarousels: function () {
        $('.hero-caro').not('.slick-initialized').each(function (idx) {
            var sliderID = 'slider' + idx;
            this.id = sliderID;
            $(this).on('init', function () {
                if ($(this).find('.slick-dots li:not(.pause)').length === 1) {
                    $(this).find('.slick-dots').hide();
                }
            }).slick(slickConfigs.hero);
        });

        // FUTURE release?: position dots over slide and change their color
        // .on('beforeChange', function (event, slick, currentSlide, nextSlide) {
        //     // change color of dots based on text-block background
        //     var nextSlideContent = $(this).find('[data-slick-index="' + nextSlide + '"').find('.text-block');
        //     var innerDiv = nextSlideContent.find(':first-child');
        //     var dots = $(this).find('.slick-dots');
        //     if (nextSlideContent.hasClass('bg-dark') || nextSlideContent.hasClass('bg-primary')
        //         || innerDiv.hasClass('bg-dark') || innerDiv.hasClass('bg-primary')) {
        //         dots.addClass('dark');
        //     } else {
        //         dots.removeClass('dark');
        //     }
        // });

        exportLyonsmfra.insertPlayButton($('.hero-caro.slick-initialized'));

        if (utils.mediaBreakpointDown('md')) {
            $('.hero-caro.slick-initialized').find('.text-block').removeAttr('style');
        } else {
            utils.syncHeights($(this).find('.hero-caro .text-block'));
        }
        exportLyonsmfra.synchTileHeight();

        utils.smartResize(function () {
            if (utils.mediaBreakpointDown('md')) {
                $(this).find('.hero-caro.slick-initialized').find('.text-block').removeAttr('style');
            } else {
                utils.syncHeights($(this).find('.hero-caro .text-block'));
            }
            exportLyonsmfra.synchTileHeight();
        });
    },
    synchTileHeight: function synchTileHeight() {
        $('body').find('.slick-initialized.slick-slider').each(function () {
            var height = '';

            $(this).find('.slick-slide').each(function () {
                var originalHeight = $(this).css('height'); // set height to inline value
                $(this).css('height', ''); // clear inline height
                height = height > ($(this).outerHeight() || originalHeight) ? height : $(this).outerHeight();
            }).css('height', height + 'px');
        });
    },
    insertPlayButton: function insertPlayButton(slider) {
        if (!slider) {
            return;
        }
        slider.find('.slick-dots li:last-of-type').after(
            '<li class="pause"><div tabindex="0" class="pause-button"></div></li>'
        );

        $('body').on('mouseover focus', '.pause-button', function () {
            slider.slick('slickPause');
        }).on('mouseout blur', '.pause-button', function () {
            slider.slick('slickPlay');
        });
    }
});

module.exports = exportLyonsmfra;
