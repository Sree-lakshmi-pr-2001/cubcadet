'use strict';

var offsetTrigger = 300;
var scrollSpeed = 4000; // in px per sec
var hideBelow = 0; // min breakpoint in px
var hideAbove = Infinity; // max breakpoint in px (default is Infinity, a.k.a. no maximum)
var $backToTopButton = $('.back-to-top');

var backtotop = {
    isVisible: true,
    isScrolling: false,

    init: function () {
        /**
        * initialize back to top button and event handlers.
        **/

        // When the user scrolls down N px from the top of the document, show the button
        window.onscroll = function () {
            backtotop.testPosition();
        };

        // When the user clicks on the button, scroll back to the top of the document
        $backToTopButton.on('click', function () {
            backtotop.scroll();
        });

        // Initially hide the button on page load, before we test to sees if it should show.
        backtotop.hide();

        // Go ahead and see if we're already scrolled down far enough
        // to display the button after page loads.
        backtotop.testPosition();
    },
    show: function () {
        if (backtotop.isScrolling) {
            return;
        }
        if (!backtotop.isVisible) {
            $backToTopButton.fadeIn('fast').removeClass('active');
            backtotop.isVisible = true;
        }
    },
    hide: function () {
        if (backtotop.isScrolling) {
            return;
        }
        if (backtotop.isVisible) {
            $backToTopButton.fadeOut('fast');
            backtotop.isVisible = false;
        }
    },
    testPosition: function () {
        if (backtotop.isScrolling) {
            return;
        }
        var width = $(window).innerWidth();
        if (width >= hideBelow && width < hideAbove && ($(window).scrollTop() > offsetTrigger)) {
            backtotop.show();
        } else {
            backtotop.hide();
        }
    },
    reset: function () {
        $backToTopButton.removeClass('active');
        $backToTopButton.removeAttr('style');
        backtotop.hide();
        backtotop.isVisible = false;
        backtotop.isScrolling = false;
    },
    scroll: function () {
        if (backtotop.isScrolling) {
            return;
        }
        backtotop.show(); // just in case
        $backToTopButton.addClass('active');
        $backToTopButton.blur();
        backtotop.isScrolling = true;
        var distanceToTop = $backToTopButton.offset().top;
        var animationDuration = distanceToTop / (scrollSpeed / 1000);
        $('html, body')
            .stop(true, true)
            .animate({ scrollTop: 0 }, animationDuration, function () {
                backtotop.isScrolling = false;
                backtotop.reset();
                backtotop.testPosition();
            }
        );
    }
};

module.exports = function () {
    backtotop.init();
};
