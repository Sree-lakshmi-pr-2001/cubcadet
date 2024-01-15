'use strict';

var search = require('base/search/search');
var utils = require('lyonscg/util/utils');

/**
 * handle compare state on newly loaded grid tiles
 *
 */
function handleCompareCheckboxes() {
    // disable checkboxes if compare bar is full
    if ($('.compare input[type=checkbox]:not(:checked):first()').attr('disabled')) {
        $('.compare input[type=checkbox]:not(:checked)').attr('disabled', true);
    }
}

/**
 * Update sort option URLs from Ajax response
 *
 * @param {string} response - Ajax response HTML code
 * @return {undefined}
 */
function updateSortOptions(response) {
    var $tempDom = $('<div>').append($(response));
    var sortOptions = $tempDom.find('.grid-footer').data('sort-options').options;
    sortOptions.forEach(function (option) {
        $('option.' + option.id).val(option.url);
    });
}

/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 * @param {string} pid - product id of product added to cart
 */
function handlePostCartAdd(response, pid) {
    $('.minicart').trigger('count:update', response);
    var messageType = response.error ? 'alert-danger' : 'alert-success';
    // show add to cart toast
    var productName;
    var pidStr = typeof pid === 'string' ? pid : pid.toString();

    if (pidStr.indexOf('{') < 0) {
        var matchPid = response.cart.items.filter(function (value) {
            var match;
            if (value.id === pidStr) {
                match = value;
            }
            return match;
        });
        productName = matchPid[0].productName;
    } else {
        productName = '';
    }

    if ($('.add-to-cart-messages').length === 0) {
        $('body').append(
            '<div class="add-to-cart-messages"></div>'
        );
    }
    $('.add-to-cart-messages').append(
        '<div class="alert ' + messageType + ' add-to-basket-alert text-center shadow-block" role="alert">'
        + '<div class="atc-success-icon"></div>'
        + '<h4>' + response.message + '</h4>'
        + '<span>' + productName + '</span>'
        + '</div>'
    );

    setTimeout(function () {
        $('.add-to-basket-alert').remove();
    }, 5000);
}

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
function handleRefinements($results) {
    $('.refinement.active').each(function () {
        $(this).removeClass('active');

        $results
            .find('.' + $(this)[0].className.replace(/ /g, '.'))
            .addClass('active');
    });

    updateDom($results, '.refinements');
}

/**
 * Parse Ajax results and updated select DOM elements
 *
 * @param {string} response - Ajax response HTML code
 * @return {undefined}
 */
function parseResults(response) {
    var $results = $(response);
    var specialHandlers = {
        '.refinements': handleRefinements
    };

    // Update DOM elements that do not require special handling
    [
        '.grid-header',
        '.header-bar',
        '.header.page-title',
        '.product-grid',
        '.show-more',
        '.filter-bar',
        '.dynosite-search'
    ].forEach(function (selector) {
        updateDom($results, selector);
    });

    Object.keys(specialHandlers).forEach(function (selector) {
        specialHandlers[selector]($results);
    });
}

/**
 * Add Dynosite Param to URL
 * @param {string} url - URL string
 * @returns {string} - final url
 */
function addDynositeParamToURL(url) {
    var finalUrl = url;
    var $searchResults = $('.search-results');
    var isDynosite = $searchResults.data('dynosite');
    if (isDynosite) {
        var modelNumber = $searchResults.data('dynosite-model');
        finalUrl = utils.appendParamToURL(finalUrl, 'fitsOnModel', modelNumber);
    }
    return finalUrl;
}

var exportSearch = $.extend({}, search, {
    addToCart: function () {
        $(document).on('click', 'button.add-to-cart-tile', function () {
            var addToCartUrl = $(this).data('add-to-cart-url');
            var pid = $(this).data('pid');

            $('body').trigger('product:beforeAddToCart', this);

            var form = {
                pid: pid,
                quantity: 1
            };

            $(this).trigger('updateAddToCartFormData', form);
            if (addToCartUrl) {
                $.ajax({
                    url: addToCartUrl,
                    method: 'POST',
                    data: form,
                    success: function (data) {
                        var resPid = form.pidsObj ? form.pidsObj : form.pid;
                        handlePostCartAdd(data, resPid);
                        $('body').trigger('product:afterAddToCart', data);
                        $.spinner().stop();
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            }
        });
    },

    sort: function () {
        // Handle sort order menu selection
        $('.container').on('change', '[name=sort-order]', function (e) {
            e.preventDefault();

            $.spinner().start();
            $(this).trigger('search:sort', this.value);
            var url = addDynositeParamToURL(this.value);
            $.ajax({
                url: url,
                data: { selectedUrl: url },
                method: 'GET',
                success: function (response) {
                    $('.product-grid').empty().html(response);
                    // handle compare checkboxes
                    handleCompareCheckboxes();
                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },

    dynoTextSearch: function () {
        // Handle text search
        $('.container').on('submit', 'form[name=dynositeSearch]', function (e) {
            e.preventDefault();

            $.spinner().start();
            var url = $(this).attr('action');
            var data = $(this).serialize();
            $.ajax({
                url: url,
                data: data,
                method: 'GET',
                success: function (response) {
                    parseResults(response);
                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },

    showMore: function () {
        // Show more products
        $('.container').on('click', '.show-more button', function (e) {
            e.stopPropagation();
            var showMoreUrl = addDynositeParamToURL($(this).data('url'));

            e.preventDefault();

            $.spinner().start();
            $(this).trigger('search:showMore', e);
            $.ajax({
                url: showMoreUrl,
                data: { selectedUrl: showMoreUrl },
                method: 'GET',
                success: function (response) {
                    $('.grid-footer').replaceWith(response);
                    updateSortOptions(response);
                    // handle compare checkboxes
                    handleCompareCheckboxes();
                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },
    resize: function () {
        // Close refinement bar and hide modal background if user resizes browser to desktop
        $(window).resize(function () {
            if (utils.mediaBreakpointUp('md')) {
                $('.refinement-bar, .modal-background').hide();
            }
        });
    },
    closeRefinments: function () {
        // Refinements close buttons
        $('.container').on('click', '.refinement-bar button.close, .refinement-bar span.apply, .modal-background', function () {
            $('.refinement-bar, .modal-background').hide();
        });
    },
    applyFilter: function () {
        // Handle refinement value selection and reset click
        $('.container').on(
            'click',
            '.refinements li a, .refinement-bar a.reset, .filter-value a, .swatch-filter a',
            function (e) {
                e.preventDefault();
                e.stopPropagation();

                $.spinner().start();
                $(this).trigger('search:filter', e);
                var url = addDynositeParamToURL(e.currentTarget.href);
                $.ajax({
                    url: url,
                    data: {
                        page: $('.grid-footer').data('page-number'),
                        selectedUrl: url
                    },
                    method: 'GET',
                    success: function (response) {
                        parseResults(response);
                        $.spinner().stop();
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            });
    },
    selectProduct: function () {
        // Click on product tile
        $(document).on('click', '.product-tile a:not(".quickview")', function (e) {
            e.preventDefault();
            var a = $(this);
            if (a.hasClass('swatch') || a.hasClass('quickview')) return true;
            // get current page refinement values
            var wl = window.location;

            var qsParams = (wl.search.length > 1) ? utils.getQueryStringParams(wl.search.substr(1)) : {};
            var hashParams = (wl.hash.length > 1) ? utils.getQueryStringParams(wl.hash.substr(1)) : {};

            // merge hash params with querystring params
            var params = $.extend(hashParams, qsParams);
            var historyParams = $.extend({}, params);

            // get the index of the selected item and save as start parameter
            var index = a.closest('[data-index]').data('index');

            params.start = index;
            // if there's a scroll parameter from a previous return to PLP, remove it
            if (params.scroll) {
                delete params.scroll;
            }

            // set the hash and allow normal action to continue
            a[0].hash = $.param(params);

            // use parameter scroll instead of start for history url
            historyParams.scroll = index;

            // create url for history
            var domain = window.location.href.split('?')[0];
            var historyUrl = domain + '?' + $.param(historyParams);

            // window.location.hash = $.param(params);
            history.pushState(null, null, historyUrl);
            window.location.href = a.attr('href');

            return true;
        });
    },
    initScroll: function () {
        // Auto scroll to the element if parameter "scroll" exists
        var wl = window.location;
        var qsParams = (wl.search.length > 1) ? utils.getQueryStringParams(wl.search.substr(1)) : {};
        if (qsParams.scroll) {
            var productTile = $('[data-index=' + qsParams.scroll + ']');
            if (productTile.length) {
                $([document.documentElement, document.body]).animate({
                    scrollTop: productTile.offset().top
                }, 2000);
            }
        }
    }
});

module.exports = exportSearch;
