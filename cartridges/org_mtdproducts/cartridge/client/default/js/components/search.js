'use strict';
var baseSearch = {};

/**
 * search function to load more article content.
 */
baseSearch.showMoreContent = function () {
    // Show more products
    $('.container').on('click', '.content-show-more button', function (e) {
        e.stopPropagation();
        var showMoreUrl = $(this).data('url');

        e.preventDefault();

        $.spinner().start();
        $(this).trigger('search:showMore', e);
        $.ajax({
            url: showMoreUrl,
            data: { selectedUrl: showMoreUrl },
            method: 'GET',
            success: function (response) {
                $('.content-grid-footer').replaceWith(response);
                $.spinner().stop();
            },
            error: function () {
                $.spinner().stop();
            }
        });
    });
};

module.exports = baseSearch;
