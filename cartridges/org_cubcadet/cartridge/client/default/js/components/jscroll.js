'use strict';

var debounce = require('lodash/debounce');

/**
 * Initialize jscroll functionality
 */
function jscroll() {
    $('.scroll-pane').jScrollPane();
}

module.exports = {
    init: function () {
        jscroll();
    },

    refreshJscroll: function () {
        var debounceJscroll = debounce(jscroll, 100);

        $(window).on('resize', function () {
            debounceJscroll(window);
        });
    }
};
