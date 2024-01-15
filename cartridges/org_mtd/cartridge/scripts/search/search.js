'use strict';

var base = module.superModule;

/**
 * Sets the relevant product search model properties, depending on the parameters provided
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {Object} httpParams - Query params
 * @param {dw.catalog.Category} selectedCategory - Selected category
 * @param {dw.catalog.SortingRule} sortingRule - Product grid sort rule
 */
function setProductProperties(productSearch, httpParams, selectedCategory, sortingRule) {
    var searchPhrase = '';

    // Set filtering on fits-on-model attribute for Dynosite
    if (httpParams.fitsOnModel) {
        searchPhrase += decodeURIComponent(httpParams.fitsOnModel.replace(/\+/g, '%20'));
    }
    if (httpParams.q) {
        // If we have fits on model in search phrase we need to add space
        if (searchPhrase !== '') {
            searchPhrase += ' ';
        }
        searchPhrase += decodeURIComponent(httpParams.q.replace(/\+/g, '%20'));
    }
    if (searchPhrase !== '') {
        productSearch.setSearchPhrase(searchPhrase);
    }
    if (selectedCategory) {
        productSearch.setCategoryID(selectedCategory.ID);
    }
    if (httpParams.pid) {
        var ArrayList = require('dw/util/ArrayList');
        productSearch.setProductIDs(new ArrayList(httpParams.pid));
    }
    if (httpParams.pmin) {
        productSearch.setPriceMin(parseInt(httpParams.pmin, 10));
    }
    if (httpParams.pmax) {
        productSearch.setPriceMax(parseInt(httpParams.pmax, 10));
    }

    if (sortingRule) {
        productSearch.setSortingRule(sortingRule);
    }

    productSearch.setRecursiveCategorySearch(true);
}

module.exports = {
    addRefinementValues: base.addRefinementValues,
    setProductProperties: setProductProperties
};
