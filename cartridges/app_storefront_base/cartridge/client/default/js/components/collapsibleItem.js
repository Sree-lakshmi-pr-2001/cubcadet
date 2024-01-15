'use strict';
module.exports = function () {
    var sizes = ['xs', 'sm', 'md', 'lg', 'xl'];

    sizes.forEach(function (size) {
        var selector = '.collapsible-' + size + ' .title, .collapsible-' + size + '>.card-header';
        $('body').on('click keydown', selector, function (e) {
            // only do custom handling if event was not a click or the TAB key
            if (e.which !== 9) {
                e.preventDefault();
                // for a click, ENTER key, or SPACE key, toggle the open/closed state
                if (e.type === 'click' || e.which === 13 || e.which === 32) {
                    var thisContainer = $(this).parents('.collapsible-' + size);
                    var thisLabel = $(this).find('.refinement-name');
                    thisContainer.toggleClass('active');
                    // change aria-expanded attribute
                    if (thisContainer.hasClass('active')) {
                        thisLabel.attr('aria-expanded', 'true');
                    } else {
                        thisLabel.attr('aria-expanded', 'false');
                    }
                }
            }
        });
    });
};
