'use strict';

var debounce = require('lodash/debounce');
var endpoint = $('.suggestions-wrapper').data('url');
var minChars = 3;


/**
 * Retrieves Suggestions element relative to scope
 *
 * @param {Object} scope - Search input field DOM element
 * @return {JQuery} - .suggestions-wrapper element
 */
function getSuggestionsWrapper(scope) {
    return $(scope).siblings('.suggestions-wrapper');
}

/**
 * Determines whether DOM element is inside the .search-mobile class
 *
 * @param {Object} scope - DOM element, usually the input.search-field element
 * @return {boolean} - Whether DOM element is inside  div.search-mobile
 */
function isMobileSearch(scope) {
    return !!$(scope).closest('.search-mobile').length;
}

/**
 * Remove modal classes needed for mobile suggestions
 *
 */
function clearModals() {
    $('body').removeClass('modal-open');
    $('.suggestions').removeClass('modal');
}

/**
 * Apply modal classes needed for mobile suggestions
 *
 * @param {Object} scope - Search input field DOM element
 */
function applyModals(scope) {
    if (isMobileSearch(scope)) {
        $('body').addClass('modal-open');
        getSuggestionsWrapper(scope).find('.suggestions').addClass('modal');
    }
}

/**
 * Tear down Suggestions panel
 */
function tearDownSuggestions() {
    $('input.search-field').val('');
    clearModals();
    $('.search-mobile .suggestions').unbind('scroll');
    $('.suggestions-wrapper').empty();
}

/**
 * Toggle search field icon from search to close and vice-versa
 *
 * @param {string} action - Action to toggle to
 */
function toggleSuggestionsIcon(action) {
    var mobileSearchIcon = '.search-mobile span.';
    var iconhidden = 'd-none';
    var iconSearchClose = 'd-block';
    var iconSearch = 'search-icon';
    var activeClass = 'active';

    if (action === 'close') {
        $(mobileSearchIcon + iconhidden).removeClass(iconhidden).addClass(iconSearchClose);
        if (!$(mobileSearchIcon + iconSearch).hasClass(activeClass)) {
            $(mobileSearchIcon + iconSearch).addClass(activeClass);
        }
    } else {
        $(mobileSearchIcon + iconSearchClose).removeClass(iconSearchClose).addClass(iconhidden);
        $(mobileSearchIcon + iconSearch + '.' + activeClass).removeClass(activeClass);
    }
}

/**
 * Determines whether the "More Content Below" icon should be displayed
 *
 * @param {Object} scope - DOM element, usually the input.search-field element
 */
function handleMoreContentBelowIcon(scope) {
    if (($(scope).scrollTop() + $(scope).innerHeight()) >= $(scope)[0].scrollHeight) {
        $('.more-below').fadeOut();
    } else {
        $('.more-below').fadeIn();
    }
}

/**
 * Positions Suggestions panel on page
 *
 * @param {Object} scope - DOM element, usually the input.search-field element
 */
function positionSuggestions(scope) {
    var outerHeight;
    var $scope;
    var $suggestions;
    var top;
    var $searchMobileElement;
    var parentElementPadding;

    if (isMobileSearch(scope)) {
        $scope = $(scope);
        top = $scope.offset().top;
        outerHeight = $scope.outerHeight();
        $searchMobileElement = $('.search-mobile');
        parentElementPadding = parseInt($searchMobileElement.css('paddingBottom').replace(/[^0-9]/g, ''), 10);
        $suggestions = getSuggestionsWrapper(scope).find('.suggestions');
        $suggestions.css('top', top + outerHeight + parentElementPadding);

        // Unfortunately, we have to bind this dynamically, as the live scroll event was not
        // properly detecting dynamic suggestions element's scroll event
        $suggestions.scroll(function () {
            handleMoreContentBelowIcon(this);
        });
    }
}

/**
 * Process Ajax response for SearchServices-GetSuggestions
 *
 * @param {Object|string} response - Empty object literal if null response or string with rendered
 *                                   suggestions template contents
 */
function processResponse(response) {
    var $suggestionsWrapper = getSuggestionsWrapper(this).empty();

    if (!(typeof (response) === 'object')) {
        $suggestionsWrapper.append(response).show();
        positionSuggestions(this);

        if (isMobileSearch(this)) {
            toggleSuggestionsIcon('close');
            applyModals(this);
        }
    } else {
        $suggestionsWrapper.hide();
    }
}

/**
 * Retrieve suggestions
 *
 * @param {Object} scope - Search field DOM element
 */
function getSuggestions(scope) {
    if ($(scope).val().length >= minChars) {
        $.ajax({
            context: scope,
            url: endpoint + encodeURIComponent($(scope).val()),
            method: 'GET',
            success: processResponse
        }).done(function (response) {
            if (!(typeof (response) === 'object')) {
                /**
                * Need to add this function after the ajax suggestions are loaded otherwise it's always false
                */
                handleMoreContentBelowIcon($('.suggestions')[0]);
            }
        });
    } else {
        toggleSuggestionsIcon('search');
        clearModals();
        getSuggestionsWrapper(scope).empty();
    }
}

module.exports = function () {
    $('input.search-field').each(function () {
        /**
         * Use debounce to avoid making an Ajax call on every single key press by waiting a few
         * hundred milliseconds before making the request. Without debounce, the user sees the
         * browser blink with every key press.
         */
        var debounceSuggestions = debounce(getSuggestions, 300);

        $(this).on('keyup click', function (e) {
            debounceSuggestions(this, e);
        });
    });

    $('body').on('click', function (e) {
        if (!$('.suggestions').has(e.target).length && !$(e.target).hasClass('search-field')) {
            $('.suggestions').hide();

            if ($(this).hasClass('modal-open') && !$('.modal').hasClass('show')) {
                clearModals();
            }
        }
    });

    $('body').on('click touchend', '.search-mobile span.d-block', function () {
        $('.suggestions').hide();
        toggleSuggestionsIcon('search');
        tearDownSuggestions();
    });

    $('body').on('click touchend', '.site-search .search-icon', function () {
        var $searchForm = $(this).parent('form');
        $searchForm.submit();
    });

    $('.search-button').on('click', function () {
        var $searchEl = $(this).parent('.search');
        var searchInput = $searchEl.find('input');

        if ($searchEl.hasClass('close-search')) {
            $searchEl.removeClass('close-search');
        } else {
            $searchEl.addClass('close-search');
            searchInput.focus();
        }
    });
};
