'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var searchRefinementsFactory = require('*/cartridge/scripts/factories/searchRefinements');
var URLUtils = require('dw/web/URLUtils');
var ProductSortOptions = require('*/cartridge/models/search/productSortOptions');
var urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');

var ACTION_ENDPOINT = 'Search-Show';
var DEFAULT_PAGE_SIZE = 12;


/**
 * Generates URL that removes refinements, essentially resetting search criteria
 *
 * @param {dw.catalog.ProductSearchModel} search - Product search object
 * @param {Object} httpParams - Query params
 * @param {string} [httpParams.q] - Search keywords
 * @param {string} [httpParams.cgid] - Category ID
 * @return {string} - URL to reset query to original search
 */
function getResetLink(search, httpParams) {
    // eslint-disable-next-line
    return search.categorySearch
        ? URLUtils.url(ACTION_ENDPOINT, 'cgid', httpParams.cgid)
        : httpParams.fitsOnModel ? URLUtils.url(ACTION_ENDPOINT, 'fitsOnModel', httpParams.fitsOnModel, 'cgid', httpParams.cgid)
        : URLUtils.url(ACTION_ENDPOINT, 'q', httpParams.q);
}

/**
 * Retrieves search refinements
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {dw.catalog.ProductSearchRefinements} refinements - Search refinements
 * @param {ArrayList.<dw.catalog.ProductSearchRefinementDefinition>} refinementDefinitions - List of
 *     product serach refinement definitions
 * @return {Refinement[]} - List of parsed refinements
 */
function getRefinements(productSearch, refinements, refinementDefinitions) {
    return collections.map(refinementDefinitions, function (definition) {
        var refinementValues = refinements.getAllRefinementValues(definition);
        var values = searchRefinementsFactory.get(productSearch, definition, refinementValues);

        return {
            displayName: definition.displayName,
            isCategoryRefinement: definition.categoryRefinement,
            isAttributeRefinement: definition.attributeRefinement,
            isPriceRefinement: definition.priceRefinement,
            values: values
        };
    });
}

/**
 * Returns the refinement values that have been selected
 *
 * @param {Array.<CategoryRefinementValue|AttributeRefinementValue|PriceRefinementValue>}
 *     refinements - List of all relevant refinements for this search
 * @return {Object[]} - List of selected filters
 */
function getSelectedFilters(refinements) {
    var selectedFilters = [];
    var selectedValues = [];

    refinements.forEach(function (refinement) {
        selectedValues = refinement.values.filter(function (value) { return value.selected; });
        if (selectedValues.length) {
            selectedFilters.push.apply(selectedFilters, selectedValues);
        }
    });

    return selectedFilters;
}

/**
 * Retrieves banner image URL
 *
 * @param {dw.catalog.Category} category - Subject category
 * @param {string} viewType - "desktop" or "mobile"
 * @return {string} - Banner's image URL
 */
function getBannerImageUrl(category, viewType) {
    var url = null;

    if (viewType === 'mobile') {
        if (category.custom && 'slotBannerImageMobile' in category.custom && category.custom.slotBannerImageMobile) {
            url = category.custom.slotBannerImageMobile.getURL();
        }
    } else if (viewType === 'desktop') {
        if (category.custom && 'slotBannerImage' in category.custom && category.custom.slotBannerImage) {
            url = category.custom.slotBannerImage.getURL();
        }
    } else if (url === null && category.image) {
        url = category.image.getURL();
    }

    return url;
}

/**
 * Retrieves category SEO HTML
 *
 * @param {dw.catalog.Category} category - Subject category
 * @return {string} - SEO HTML
 */
function getCategorySEOText(category) {
    var seotext = null;

    if (category.custom && 'seoText' in category.custom && category.custom.seoText) {
        seotext = category.custom.seoText;
    }

    return seotext;
}

/**
 * Configures and returns a PagingModel instance
 *
 * @param {dw.util.Iterator} productHits - Iterator for product search results
 * @param {number} count - Number of products in search results
 * @param {number} pageSize - Number of products to display
 * @param {number} startIndex - Beginning index value
 * @return {dw.web.PagingModel} - PagingModel instance
 */
function getPagingModel(productHits, count, pageSize, startIndex) {
    var PagingModel = require('dw/web/PagingModel');
    var paging = new PagingModel(productHits, count);

    paging.setStart(startIndex || 0);
    paging.setPageSize(pageSize || DEFAULT_PAGE_SIZE);

    return paging;
}

/**
 * Generates URL for [Show] More button
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {Object} httpParams - HTTP query parameters
 * @return {string} - More button URL
 */
function getShowMoreUrl(productSearch, httpParams) {
    var showMoreEndpoint = 'Search-UpdateGrid';
    var currentStart = httpParams.start || 0;

    var pageSize;
    if (httpParams.scroll && httpParams.scroll < productSearch.count) {
        pageSize = Math.floor((httpParams.scroll / DEFAULT_PAGE_SIZE) + 1) * DEFAULT_PAGE_SIZE;
    } else {
        pageSize = httpParams.sz || DEFAULT_PAGE_SIZE;
    }

    var hitsCount = productSearch.count;
    var nextStart;

    var paging = getPagingModel(
        productSearch.productSearchHits,
        hitsCount,
        pageSize,
        currentStart
    );

    if (pageSize > hitsCount) {
        return '';
    } else if (pageSize > DEFAULT_PAGE_SIZE) {
        nextStart = pageSize;
    } else {
        var endIdx = paging.getEnd();
        nextStart = endIdx + 1 < hitsCount ? endIdx + 1 : null;

        if (!nextStart) {
            return '';
        }
    }

    paging.setStart(nextStart);

    var baseUrl = productSearch.url(showMoreEndpoint);
    var finalUrl = paging.appendPaging(baseUrl);
    return finalUrl;
}

/**
 * Forms a URL that can be used as a permalink with filters, sort, and page size preserved
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {number} pageSize - 'sz' query param
 * @param {number} startIdx - 'start' query param
 * @return {string} - Permalink URL
 */
function getPermalink(productSearch, pageSize, startIdx) {
    var showMoreEndpoint = 'Search-Show';
    var params = { start: '0', sz: pageSize + startIdx };
    var url = productSearch.url(showMoreEndpoint).toString();
    var appended = urlHelper.appendQueryParams(url, params).toString();
    return appended;
}

/**
 * Compile a list of relevant suggested phrases
 *
 * @param {dw.util.Iterator.<dw.suggest.SuggestedPhrase>} suggestedPhrases - Iterator to retrieve suggestedPhrases
 * @return {SuggestedPhrase[]} - Array of suggested phrases
 */
function getPhrases(suggestedPhrases) {
    var phrase = null;
    var phrases = [];

    while (suggestedPhrases.hasNext()) {
        phrase = suggestedPhrases.next();
        phrases.push({
            value: phrase.phrase,
            url: URLUtils.url(ACTION_ENDPOINT, 'q', phrase.phrase)
        });
    }
    return phrases;
}


/**
 * @constructor
 * @classdesc ProductSearch class
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {Object} httpParams - HTTP query parameters
 * @param {string} sortingRule - Sorting option rule ID
 * @param {dw.util.ArrayList.<dw.catalog.SortingOption>} sortingOptions - Options to sort search
 *     results
 * @param {dw.catalog.Category} rootCategory - Search result's root category if applicable
 */
function ProductSearch(productSearch, httpParams, sortingRule, sortingOptions, rootCategory) {
    if (httpParams.scroll && httpParams.scroll < productSearch.count) {
        this.pageSize = Math.floor((httpParams.scroll / DEFAULT_PAGE_SIZE) + 1) * DEFAULT_PAGE_SIZE;
    } else {
        this.pageSize = parseInt(httpParams.sz, 10) || DEFAULT_PAGE_SIZE;
    }

    var startIdx = httpParams.start || 0;
    var paging = getPagingModel(
        productSearch.productSearchHits,
        productSearch.count,
        this.pageSize,
        startIdx
    );

    var searchSuggestions = productSearch.searchPhraseSuggestions;
    this.isSearchSuggestionsAvailable = searchSuggestions ? searchSuggestions.hasSuggestedPhrases() : false;

    if (this.isSearchSuggestionsAvailable) {
        this.suggestionPhrases = getPhrases(searchSuggestions.suggestedPhrases);
    }

    this.pageNumber = paging.currentPage;
    this.count = productSearch.count;
    this.isCategorySearch = productSearch.categorySearch;
    this.isRefinedCategorySearch = productSearch.refinedCategorySearch;
    this.searchKeywords = productSearch.searchPhrase;
    this.refinements = getRefinements(
        productSearch,
        productSearch.refinements,
        productSearch.refinements.refinementDefinitions
    );
    this.selectedFilters = getSelectedFilters(this.refinements);
    this.resetLink = getResetLink(productSearch, httpParams);
    this.bannerImageUrl = productSearch.category ? getBannerImageUrl(productSearch.category, 'desktop') : null;
    this.mobileBannerImageUrl = productSearch.category ? getBannerImageUrl(productSearch.category, 'mobile') : null;
    this.seoText = productSearch.category ? getCategorySEOText(productSearch.category) : null;
    this.productIds = collections.map(paging.pageElements, function (item) {
        return {
            productID: item.productID,
            productSearchHit: item
        };
    });
    this.productSort = new ProductSortOptions(
        productSearch,
        sortingRule,
        sortingOptions,
        rootCategory,
        paging
    );
    this.showMoreUrl = getShowMoreUrl(productSearch, httpParams);
    this.permalink = getPermalink(
        productSearch,
        parseInt(this.pageSize, 10),
        parseInt(startIdx, 10)
    );

    if (productSearch.category) {
        this.category = {
            name: productSearch.category.displayName,
            id: productSearch.category.ID,
            pageTitle: productSearch.category.pageTitle,
            pageDescription: productSearch.category.pageDescription,
            pageKeywords: productSearch.category.pageKeywords
        };
    }
    this.pageMetaTags = productSearch.pageMetaTags;
    this.apiProductSearch = productSearch;
}

module.exports = ProductSearch;