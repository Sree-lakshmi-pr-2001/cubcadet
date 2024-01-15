'use strict';

/**
 * Init device specific functions
 */

var iphone = !!navigator.platform && /iPhone/.test(navigator.platform);
var msie = !!navigator.userAgent.match(/Trident/g) || !!navigator.userAgent.match(/MSIE/g);

module.exports = {
    /**
     * scripted fix for iOS native auto zoom;
     */
    preventZoom: function () {
        if (iphone) {
            $('head').find('meta[name="viewport"]').attr('content', 'width=device-width, initial-scale=1.0, user-scalable=0');
        }
    },

    /**
     * Target IE to prevent the IE Phone Link;
     */
    disableIEPhoneNumber: function () {
        if (msie) {
            if ($('a[href^=tel]').length > 0) {
                $('a[href^=tel]').addClass('disablePhoneLink').on('click', function (e) {
                    e.preventDefault();
                });
            }
        }
    }
};
