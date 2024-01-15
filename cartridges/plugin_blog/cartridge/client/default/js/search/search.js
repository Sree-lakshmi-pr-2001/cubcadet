'use strict';
var baseSearch = require('org_ma/search/search');

/**
 * Update DOM elements with Ajax results
 *
 * @param {Object} $results - jQuery DOM element
 * @param {string} selector - DOM element to look up in the $results
 * @return {undefined}
 */
function updateDom($results, selector) {
    var $updates = $results.find(selector);
    $(selector).empty().html($updates.html());
}
/**
 * Keep refinement panes expanded/collapsed after Ajax refresh
 *
 * @param {Object} $results - jQuery DOM element
 * @return {undefined}
 */
function handleContentRefinements($results) {
    $('.content-refinement').each(function () {
        $(this).removeClass('active');
        $results
            .find('.' + $(this)[0].className.replace(/ /g, '.'))
            .addClass('active');
    });

    updateDom($results, '.content-refinements');
}

/**
 * Parse Ajax results and updated select DOM elements for Content
 *
 * @param {string} response - Ajax response HTML code
 * @return {undefined}
 */
function parseContentResults(response) {
    var $results = $(response);
    var specialHandlers = {
        '.content-refinements': handleContentRefinements
    };

    // Update DOM elements that do not require special handling
    [
        '.content-grid-header',
        '.content-header-bar',
        '.header.page-title',
        '.content-grid',
        '.content-show-more',
        '.content-filter-bar'
    ].forEach(function (selector) {
        updateDom($results, selector);
    });

    Object.keys(specialHandlers).forEach(function (selector) {
        specialHandlers[selector]($results);
    });
}
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
baseSearch.applyContentFilter = function () {
    // Handle refinement value selection and reset click
    $('.container').on(
        'click',
        '.content-refinements li >, .content-refinement-bar .reset, .filter-value button, .swatch-filter >',
        function (e) {
            e.preventDefault();
            e.stopPropagation();
            var url = $(e.currentTarget).data('href') || e.currentTarget.href;
            $.spinner().start();
            $(this).trigger('search:filter', e);
            $.ajax({
                url: url,
                data: {
                    page: $('.content-grid-footer').data('page-number'),
                    selectedUrl: e.currentTarget.href
                },
                method: 'GET',
                success: function (response) {
                    parseContentResults(response);
                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
};

baseSearch.contentFilter = function () {
    // Display refinements bar when Menu icon clicked
    $('.container').on('click', 'button.content-filter-results', function () {
        $('.content-refinement-bar, .modal-background').show();
    });
};
baseSearch.closeContentRefinments = function () {
    // Refinements close button
    $('.container').on('click', '.content-refinement-bar button.close, .modal-background', function () {
        $('.content-refinement-bar, .modal-background').hide();
    });
};

module.exports = baseSearch;
