'use strict';

var countries = require('*/cartridge/config/countries');
var ApiLocale = require('dw/util/Locale');

/**
 * Capitalize display name
 * @param {string} displayName - Display Name
 * @returns {string} capitalized display name
 */
function capitalizeDisplayName(displayName) {
    var cName = displayName.substr(0, 1).toUpperCase() + displayName.substr(1, displayName.length - 1);
    return cName;
}

/**
 * returns object needed to render links to change the locale of the site
 * @param {string} allowedLocales - list of allowed locales for the site
 * @param {string} siteId - id of the current site
 * @param {string} currentLocaleID - id of the current loale
 * @returns {Array} - array of Objects representing available locales
 */
function getLocaleLinks(allowedLocales, siteId, currentLocaleID) {
    var localeOption;
    var apiLocale;
    var localeOptions = [];
    var System = require('dw/system/System');
    var countryLocales = System.preferences.custom.countryLocales ? JSON.parse(System.preferences.custom.countryLocales) : [];

    countryLocales.forEach(function (locale) {
        if (locale.allowedSites.indexOf(siteId) > -1 && locale.id !== currentLocaleID) {
            apiLocale = ApiLocale.getLocale(locale.id);

            localeOption = {
                localID: locale.id,
                country: apiLocale.country,
                countryISO3Code: apiLocale.ISO3Country,
                displayCountry: apiLocale.displayCountry,
                currencyCode: locale.currencyCode,
                currencySymbol: locale.currencySymbol,
                displayName: capitalizeDisplayName(apiLocale.displayName),
                language: apiLocale.language,
                displayLanguage: apiLocale.displayLanguage
            };
            localeOptions.push(localeOption);
        }
    });
    return localeOptions;
}

/**
 * Performs a deeper check on a plain locale object
 * @param {dw.util.Locale} currentLocale - current locale of the request
 * @return {boolean} - returns true
 */
function isLocaleValid(currentLocale) {
    return currentLocale && currentLocale.ID;
}

/**
 * Represents current locale information in plain object
 * @param {dw.util.Locale} currentLocale - current locale of the request
 * @param {string} allowedLocales - list of allowed locales for the site
 * @param {string} siteId - id of the current site
 * @constructor
 */
function Locale(currentLocale, allowedLocales, siteId) {
    var currentCountry = !isLocaleValid(currentLocale) ? countries[0]
        : countries.filter(function (country) {
            return country.id === currentLocale.ID;
        })[0];

    this.locale = {
        countryCode: currentLocale.country,
        countryISO3Code: currentLocale.ISO3Country,
        name: currentLocale.displayCountry,
        localLinks: getLocaleLinks(allowedLocales, siteId, currentLocale.ID),
        currencyCode: currentCountry.currencyCode,
        currencySymbol: currentCountry.currencySymbol,
        displayName: capitalizeDisplayName(currentLocale.displayName),
        language: currentLocale.language,
        displayLanguage: currentLocale.displayLanguage
    };
}

module.exports = Locale;
