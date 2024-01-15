'use strict';

var keyboardAccessibility = require('base/components/keyboardAccessibility');

/**
 * Fires the Ajax to change the site locale
 * @param {string} action - URL Action
 * @param {string} localeCode - Country Code
 * @param {string} localeCurrencyCode - Country Currency
 * @param {string} queryString - Query
 * @param {string} url - URL Content
 */
function siteChangeAjax(action, localeCode, localeCurrencyCode, queryString, url) {
    $.ajax({
        url: url,
        type: 'get',
        dataType: 'json',
        data: {
            code: localeCode,
            queryString: queryString,
            CurrencyCode: localeCurrencyCode,
            action: action
        },
        success: function (response) {
            $.spinner().stop();
            if (response && response.redirectUrl) {
                window.location.href = response.redirectUrl;
            }
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

/**
 * Renders a modal window warning for site locale change
 * @param {string} action - URL Action
 * @param {string} localeCode - Country Code
 * @param {string} localeCurrencyCode - Country Currency
 * @param {string} queryString - Query
 * @param {string} url - URL Content
 */
function showSiteChangeModal(action, localeCode, localeCurrencyCode, queryString, url) {
    var textbody = $('.locale-change').data('body');
    var textYes = $('.locale-change').data('accepttext');
    var textNo = $('.locale-change').data('rejecttext');
    var textHeader = $('.locale-change').data('heading');

    var htmlString = '<!-- Modal -->'
        + '<div class="modal show" id="site-change" role="dialog" style="display: block;" aria-labelledby="modal-title" data-la-initdispnone="true">'
        + '<div class="modal-dialog" role="document">'
        + '<!-- Modal content-->'
        + '<div class="modal-content">'
        + '<div class="modal-header">'
        + '<h4 class="modal-title">'
        + textHeader
        + '</h4>'
        + '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'
        + '<span aria-hidden="true"></span>'
        + '</button>'
        + '</div>'
        + '<div class="modal-body">'
        + textbody
        + '</div>'
        + '<div class="modal-footer">'
        + '<button class="decline btn btn-outline-secondary">'
        + textNo
        + '</button>'
        + '<button class="affirm btn btn-secondary">'
        + textYes
        + '</button>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '</div>';
    $.spinner().start();
    $('#main').append(htmlString);

    $('#site-change .close').click(function (e) {
        e.preventDefault();

        $('#site-change').remove();
        $.spinner().stop();
    });

    $('#site-change .btn').click(function (e) {
        e.preventDefault();

        if ($(this).hasClass('affirm')) {
            siteChangeAjax(action, localeCode, localeCurrencyCode, queryString, url);
        } else {
            $('#site-change').remove();
            $.spinner().stop();
        }
    });
}

module.exports = function () {
    $('.country-selector a').click(function (e) {
        e.preventDefault();
        var action = $('.page').data('action');
        var localeCode = $(this).data('locale');
        var localeCurrencyCode = $(this).data('currencycode');
        var queryString = $('.page').data('querystring');
        var url = $('.country-selector').data('url');
        var minicartQty = $('.minicart-quantity').html();
        var currentCountry = $('#dropdownCountrySelector').data('currentcountry');
        var selectedCountry = $(this).data('country');

        if ((parseInt(minicartQty, 10) === 0) || currentCountry === selectedCountry) {
            siteChangeAjax(action, localeCode, localeCurrencyCode, queryString, url);
        } else {
            showSiteChangeModal(action, localeCode, localeCurrencyCode, queryString, url);
        }
    });

    keyboardAccessibility('nav .country-selector',
        {
            40: function ($countryOptions) { // down
                if ($(this).is(':focus') || $(':focus').length === 0) {
                    $countryOptions.first().focus();
                } else {
                    $(':focus').next().focus();
                }
            },
            38: function ($countryOptions) { // up
                if ($countryOptions.first().is(':focus') || $(this).is(':focus')) {
                    $(this).focus();
                    $(this).removeClass('show');
                } else {
                    $(':focus').prev().focus();
                }
            },
            27: function () { // escape
                $(this).focus();
                $(this).removeClass('show').children('.dropdown-menu').removeClass('show');
            },
            9: function () { // tab
                $(this).removeClass('show').children('.dropdown-menu').removeClass('show');
            }
        },
        function () {
            if (!($(this).hasClass('show'))) {
                $(this).addClass('show');
            }
            return $(this).find('.dropdown-country-selector').children('a');
        }
    );
    $('nav .country-selector').on('focusin', function () {
        $(this).addClass('show').children('.dropdown-menu').addClass('show');
    });
};
