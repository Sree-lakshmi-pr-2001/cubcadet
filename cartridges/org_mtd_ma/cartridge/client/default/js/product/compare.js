'use strict';

var utils = require('lyonscg/util/utils');

var $compareBar = $('.compare-bar-wrapper');
var productsForComparison = [];
var $backToTopBtn = $('.back-to-top');

var lastKnownUrl = location.href;


/**
 * @typedef ProductComparisonList
 * @type Object
 * @property {string} pid - ID for product to compare
 * @property {string} imgSrc - Image URL for selected product
 */

/**
 * Compiles the HTML for a single slot
 *
 * @param {ProductComparisonList} product - Selected product to compare
 * @param {number} idx - Slot number (zero-based)
 * @return {string} - HTML for a single slot
 */
function compileSlot(product, idx) {
    var pid = product.pid;
    var name = 'pid' + idx;
    var removeText = $('.compare-bar').data('remove-text');

    return '' +
        '<div class="col-6 col-lg-3 selected-product">' +
            '<div class="slot" data-pid="' + pid + '">' +
                '<picture>' +
                    '<source media="(min-width: 768px)" srcset="' + product.imgSrcDesktop + '" />' +
                    '<source media="(max-width: 767px)" srcset="' + product.imgSrcMobile + '" />' +
                    '<img src="' + product.imgSrcMobile + '" />' +
                '</picture>' +
                '<div class="product-info">' +
                    '<span class="name">' + product.name + '</span>' +
                    '<span class="extended-name">' + product.extendedName + '</span>' +
                    '<div class="close">' +
                        removeText +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<input type="hidden" name="' + name + '" value="' + pid + '" />' +
        '</div>\n';
}

/**
 * Draw and render the Compare Bar product slots
 *
 * @param {ProductComparisonList []} productsToCompare - List of ID's of the products to compare
 */
function redrawCompareSlots(productsToCompare) {
    var html = productsToCompare.map(function (product, idx) {
        return compileSlot(product, idx);
    }).join('');
    var isDesktop = $('.menu-toggleable-left').css('position') !== 'fixed';
    var maxSlots = isDesktop ? 'max-slots' : 'max-mobile-slots';
    var maxNumber = parseInt($('.compare-bar').data(maxSlots), 10);

    // Render empty slots
    if (productsToCompare.length < maxNumber) {
        var numAvailableSlots = maxNumber - productsToCompare.length;

        for (var i = 0; i < numAvailableSlots; i++) {
            if (i === 0 && productsToCompare.length < 2) {
                html += '<div class="col-6 col-lg-3 selected-product"><div class="slot">' +
                    '<div class="min-products-msg">' + $('.compare-bar').data('min-products-msg') +
                    '</div></div></div>';
            } else {
                html += '<div class="col-6 col-lg-3 selected-product"><div class="slot"></div></div>';
            }
        }
    }

    $('.compare-bar .product-slots').empty().append(html);
}

/**
 * Enables/disables the Compare button, depending on whether at least two products have been
 * selected for comparison
 *
 * @param {number} numProducts - Number of products selected for comparison
 */
function setCompareNumber(numProducts) {
    var isDesktop = $('.menu-toggleable-left').css('position') !== 'fixed';
    var maxSlots = isDesktop ? 'max-slots' : 'max-mobile-slots';
    var maxNumber = parseInt($('.compare-bar').data(maxSlots), 10);

    if (numProducts > 0) {
        $('.selected-products').text('(' + numProducts + '/' + maxNumber + ')');
    } else {
        $('.selected-products').text('');
    }
    if (numProducts < 2) {
        $('button.compare').attr('disabled', true);
    } else {
        $('button.compare').removeAttr('disabled');
    }
}

/**
 * Returns a copy of a list of products to compare
 *
 * @param {ProductComparisonList []} productsToCompare - List of ID's of the products to compare
 * @return {ProductComparisonList []} List of ID's of the products to compare
 */
function copyProducts(productsToCompare) {
    return productsToCompare.map(function (product) {
        var proxy = {};

        Object.keys(product).forEach(function (key) {
            proxy[key] = product[key];
        });

        return proxy;
    });
}

/**
 * Handles the selection of a product for comparison
 *
 * @param {ProductComparisonList []} products - List of ID's of the products to compare
 * @param {string} pid - ID for product to compare
 * @param {string} imgSrcDesktop - Desktop preset Image URL for selected product
 * @param {string} imgSrcMobile - Mobile preset Image URL for selected product
 * @param {string} name - Product name for selected product
 * @param {string} extendedName - Extended name for selected product
 * @return {ProductComparisonList []} List of ID's of the products to compare
 */
function selectProduct(products, pid, imgSrcDesktop, imgSrcMobile, name, extendedName) {
    var productsToCompare = copyProducts(products) || [];
    var isDesktop = $('.menu-toggleable-left').css('position') !== 'fixed';
    var maxSlots = isDesktop ? 'max-slots' : 'max-mobile-slots';
    var maxNumber = parseInt($('.compare-bar').data(maxSlots), 10);

    if (productsToCompare.length < maxNumber) {
        productsToCompare.push({
            pid: pid,
            imgSrcDesktop: imgSrcDesktop,
            imgSrcMobile: imgSrcMobile,
            name: name,
            extendedName: extendedName
        });

        if (productsToCompare.length === maxNumber) {
            $('input[type=checkbox]:not(:checked)').attr('disabled', true);
        }

        redrawCompareSlots(productsToCompare);
        setCompareNumber(productsToCompare.length);
        $compareBar.show();
        // Using class for the important tag - prevent BTT from showing if manually scrolled up and down
        $backToTopBtn.addClass('d-none');
    }

    return productsToCompare;
}

/**
 * Handles the deselection of a product
 *
 * @param {ProductComparisonList []} products - List of ID's of the products to compare
 * @param {string} pid - ID for product to compare
 * @return {ProductComparisonList []} List of ID's of the products to compare
 */
function deselectProduct(products, pid) {
    var productsToCompare = copyProducts(products) || [];

    productsToCompare = productsToCompare.filter(function (product) {
        return product.pid !== pid;
    });

    if (productsToCompare.length === 0) {
        $compareBar.hide();
        $backToTopBtn.removeClass('d-none');
    }

    $('input#' + pid).prop('checked', false);
    $('input[type=checkbox]:not(:checked)').removeAttr('disabled');

    redrawCompareSlots(productsToCompare);
    setCompareNumber(productsToCompare.length);
    return productsToCompare;
}

/**
 * Clears the Compare Bar and hides it
 * @return {undefined}
 */
function clearCompareBar() {
    productsForComparison.forEach(function (product) {
        $(this).trigger('compare:deselected', { pid: product.pid });
    });

    productsForComparison = [];
    $('.compare input').prop('checked', false);
    $('.compare input[type=checkbox]:not(:checked)').removeAttr('disabled');
    $compareBar.hide();
    $backToTopBtn.removeClass('d-none');
}

/**
 * Update form action url to not have query string
 * @returns {undefined}
 */
function updateSubmitUrl() {
    var form = $('.compare-products-form');
    var targetUrl = form.attr('action');
    var urlParts = targetUrl.split('?');
    if (urlParts[1]) {
        urlParts[1].split('&').forEach(function (keyValue) {
            var splittedValues = keyValue.split('=');
            var key = decodeURIComponent(splittedValues[0]);
            var value = decodeURIComponent(splittedValues[1]);
            if (key && value) {
                if (form.find('[name="' + key + '"]').length === 0) {
                    form.append('<input type="hidden" name="' + key + '" value="' + value + '" />');
                }
            }
        });
        form.attr('action', urlParts[0]);
    }
}

/**
 * Checks if current viewport is larger than breakpoint
 * @param {number} breakpoint - breakpoint threshold
 * @returns {boolean} - returns true or false
 */
function viewportCheck(breakpoint) {
    var windowWidth = $(window).width();
    var breakpointThreshold = breakpoint;

    return windowWidth >= breakpointThreshold;
}

module.exports = {
    init: function () {
        $('.product-comparison table tbody').find('tr').each(function () {
            if ($(this).find('td ul li').length === 0) {
                $(this).remove();
            }
        });
    },
    /**
     * Refeshes viewport if changed from mobile/desktop
     */
    refreshViewport: function () {
        var lgBreakpoint = utils.getViewports('lg');
        var originalViewport = viewportCheck(lgBreakpoint);
        var pageAction = $('.page').data('action').toLowerCase();

        $(window).resize(function () {
            // prevent refresh if compare bar is not visible
            if ($('.compare-bar-wrapper').length > 0 && $('.compare-bar-wrapper').css('display') !== 'none') {
                var updatedURL;
                if ((viewportCheck(lgBreakpoint) !== originalViewport) && (pageAction !== 'compare-show')) {
                    updatedURL = window.location.hash.split(',').slice(0, 2).join(',');
                    location.hash = updatedURL;
                    location.reload();
                    originalViewport = viewportCheck(lgBreakpoint);
                }
            }
        });
    },

    /**
     * Handles Compare checkbox click
     */
    handleCompareClick: function () {
        $('div.page').on('click', '.compare input[type=checkbox]', function () {
            var pid = $(this).attr('id');
            var checked = $(this).is(':checked');
            var name = $(this).closest('.product-tile')
                .data('product-name');
            var extendedName = $(this).closest('.product-tile')
                .data('product-extended-name');
            var imgSrcDesktop = $(this).closest('.product-tile')
                .find('.tile-image')
                .data('compareDesktop');
            var imgSrcMobile = $(this).closest('.product-tile')
                .find('.tile-image')
                .data('compareMobile');

            if (checked) {
                productsForComparison = selectProduct(productsForComparison, pid, imgSrcDesktop, imgSrcMobile, name, extendedName);
                $(this).trigger('compare:selected', { pid: pid });
            } else {
                productsForComparison = deselectProduct(productsForComparison, pid);
                $(this).trigger('compare:deselected', { pid: pid });
            }
        });
    },

    /**
     * Handles the Clear All link
     */
    handleClearAll: function () {
        $('.compare-bar a.clear-all').on('click', function (e) {
            e.preventDefault();
            clearCompareBar();
        });
    },

    /**
     * Handles deselection of a product on the Compare Bar
     */
    deselectProductOnCompareBar: function () {
        $('.compare-bar').on('click', '.close', function () {
            var pid = $(this).closest('.slot').data('pid').toString();
            productsForComparison = deselectProduct(productsForComparison, pid);
            $(this).trigger('compare:deselected', { pid: pid });
        });
    },

    /**
     * Selects products for comparison based on the checked status of the Compare checkboxes in
     * each product tile.  Used when user goes back from the Compare Products page.
     */
    selectCheckedProducts: function () {
        $('.product-grid').ready(function () {
            if (location.hash) {
                location.hash.replace('#', '').split(',').forEach(function (id) {
                    $('input#' + id).prop('checked', 'checked');
                });
            }
            $('.compare input:checked').each(function () {
                var pid = $(this).prop('id');
                var name = $(this).closest('.product-tile')
                    .data('product-name');
                var extendedName = $(this).closest('.product-tile')
                    .data('product-extended-name');
                var imgSrcDesktop = $(this).closest('.product-tile')
                    .find('img.tile-image')
                    .data('compareDesktop');
                var imgSrcMobile = $(this).closest('.product-tile')
                    .find('img.tile-image')
                    .data('compareMobile');
                productsForComparison = selectProduct(productsForComparison, pid, imgSrcDesktop, imgSrcMobile, name, extendedName);
                $(this).trigger('compare:selected', { pid: pid });
            });
        });
    },

    /**
     * Sets the "backUrl" property to the last attribute selected URL to ensure that when the user
     * goes back from the Compare Products page, the previously selected attributes are still
     * selected and applied to the previous search.
     */
    setBackUrl: function () {
        $('.search-results').on('click', '.refinements a', function () {
            $('input[name="backUrl"]').val($(this).prop('href'));
        });
    },

    /**
     * Sets the history.pushState for history.back() to work from the Compare Products page.
     */
    setPushState: function () {
        $('.compare-products-form').on('submit', function () {
            updateSubmitUrl();
            var selectedProducts = $('.compare input:checked').map(function () { return this.id; }).get().join(',');
            history.pushState({}, document.title, lastKnownUrl + '#' + selectedProducts);
            location.hash = selectedProducts;

            $(this).find('input[name="cgid"]').attr('value', $('input.category-id').val());
        });
    },
    catchFilterChange: function () {
        $('.container').on('click', '.refinements li a, .refinement-bar a.reset', function (e) {
            e.preventDefault();
            clearCompareBar();
        });
    },
    listenToFilterChange: function () {
        $('body').on('search:filter', function (e, data) {
            lastKnownUrl = data.currentTarget.href;
        });
    }
};
