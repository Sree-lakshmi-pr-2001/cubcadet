/* eslint-disable no-useless-escape */
'use strict';

/**
 * Format StoreName for URL
 * @param {string} text Store name
 * @returns {string} storeName
 */
function slugify(text) {
    var res = text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
    return res;
}

/**
 * Constract URL for Store
 *
 * @param {Store} store object
 * @returns {URL} url
 */
function createUrlForDealer(store) {
    var URLUtils = require('dw/web/URLUtils');
    var slug = slugify([store.name, store.city, store.stateCode].join('-'));
    return URLUtils.url('Dealer-Show', null).toString() + '/' + store.ID + '/' + slug;
}


module.exports = {
    createUrlForDealer: createUrlForDealer
};
