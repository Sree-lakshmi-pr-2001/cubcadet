'use strict';

var lyonsmfra = require('lyonscg/components/carousels');
var slickConfigs = require('../config/slickConfigs');

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

var exportLyonsmfra = $.extend({}, lyonsmfra, {
    productTileCarousels: function () {
        $('.product-tile-caro').not('.slick-initialized').slick(slickConfigs.productTiles);

        // check PI recommendations content
        einsteinObserver('.product-tile-caro', function () {
            setTimeout(function () {
                exportLyonsmfra.productTileCarousels();
            }, 1000);
        });
    }
});

module.exports = exportLyonsmfra;
