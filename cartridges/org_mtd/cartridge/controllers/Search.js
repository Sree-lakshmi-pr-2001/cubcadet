'use strict';

var page = module.superModule;
var server = require('server');

var CatalogMgr = require('dw/catalog/CatalogMgr');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.extend(page);

/**
 * Search function
 * @param {Object} req - request object
 * @param {Object} res - response object
 * @param {Function} next - next function
 * @returns {Function} - returns
 */
function search(req, res, next) {
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var URLUtils = require('dw/web/URLUtils');
    var ProductSearch = require('*/cartridge/models/search/productSearch');
    var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var MTDHelper = require('*/cartridge/scripts/util/MTDHelper');
    var urlHelpers = require('*/cartridge/scripts/helpers/urlHelpers');
    var Resource = require('dw/web/Resource');

    var categoryTemplate = '';
    var productSearch;
    var shouldIncludeInlineSchema = req.querystring.includeInlineSchema === "true";
    var isAjax = Object.hasOwnProperty.call(req.httpHeaders, 'x-requested-with')
        && req.httpHeaders['x-requested-with'] === 'XMLHttpRequest';
    var hasFitsOnModel = req.querystring.fitsOnModel || false;
    var resultsTemplate = isAjax || hasFitsOnModel ? 'search/searchResultsNoDecorator' : 'search/searchResults';
    var apiProductSearch = new ProductSearchModel();
    var maxSlots = 4;
    var reportingURLs;
    var searchRedirect = req.querystring.q
        ? apiProductSearch.getSearchRedirect(req.querystring.q)
        : null;

    if (searchRedirect) {
        res.redirect(searchRedirect.getLocation());
        return next();
    }

    apiProductSearch = searchHelper.setupSearch(apiProductSearch, req.querystring);
    apiProductSearch.search();

    categoryTemplate = searchHelper.getCategoryTemplate(apiProductSearch);
    productSearch = new ProductSearch(
        apiProductSearch,
        req.querystring,
        req.querystring.srule,
        CatalogMgr.getSortingOptions(),
        CatalogMgr.getSiteCatalog().getRoot()
    );

    var fitsOnModelPDP = req.querystring.pid || false
    if (fitsOnModelPDP) {
        if(productSearch.count === 0) {
            res.redirect(URLUtils.url('Product-Show', 'pid', fitsOnModelPDP, 'fitsOnModel', hasFitsOnModel, 'willNotFitModel', true));
            return next();
        } else {
            res.redirect(URLUtils.url('Product-Show', 'pid', fitsOnModelPDP, 'fitsOnModel', hasFitsOnModel));
            return next();
        }
    }

    var fitsOnModelEnable = apiProductSearch.category && apiProductSearch.category.custom.fitsOnModelEnable;
    var willFitsOnModel = hasFitsOnModel && (fitsOnModelEnable || req.querystring.q) || false;

    if (willFitsOnModel && productSearch.count === 0) {
        var currentURL = request.httpURL.toString();
        currentURL = urlHelpers.removeQueryParam(currentURL, 'fitsOnModel');
        var newURL = urlHelpers.appendQueryParams(currentURL, {'willNotFit': hasFitsOnModel});
        res.redirect(newURL);
        return next();
    }

    pageMetaHelper.setPageMetaTags(req.pageMetaData, productSearch);

    var refineurl = URLUtils.url('Search-Refinebar');
    var whitelistedParams = ['q', 'cgid', 'pmin', 'pmax', 'srule', 'fitsOnModel'];
    Object.keys(req.querystring).forEach(function (element) {
        if (whitelistedParams.indexOf(element) > -1) {
            refineurl.append(element, req.querystring[element]);
        }
        if (element === 'preferences') {
            var i = 1;
            Object.keys(req.querystring[element]).forEach(function (preference) {
                refineurl.append('prefn' + i, preference);
                refineurl.append('prefv' + i, req.querystring[element][preference]);
                i++;
            });
        }
    });

    if (productSearch.searchKeywords !== null && !productSearch.selectedFilters.length) {
        reportingURLs = reportingUrlsHelper.getProductSearchReportingURLs(productSearch);
    }

    var schemaHelper = require('*/cartridge/scripts/helpers/structuredDataHelper');
    var schemaData = schemaHelper.getListingPageSchema(productSearch.productIds);

    if (
        productSearch.isCategorySearch
        && !productSearch.isRefinedCategorySearch
        && categoryTemplate
        && apiProductSearch.category.parent.ID === 'root'
    ) {
        pageMetaHelper.setPageMetaData(req.pageMetaData, productSearch.category);

        if (isAjax) {
            res.render(resultsTemplate, {
                productSearch: productSearch,
                maxSlots: maxSlots,
                reportingURLs: reportingURLs,
                refineurl: refineurl,
                schemaData: schemaData
            });
        } else {
            res.render(categoryTemplate, {
                productSearch: productSearch,
                maxSlots: maxSlots,
                category: apiProductSearch.category,
                reportingURLs: reportingURLs,
                refineurl: refineurl,
                schemaData: schemaData,
                shouldIncludeInlineSchema: shouldIncludeInlineSchema
            });
        }
    } else {
        if (!hasFitsOnModel && !isAjax) {
            // Verify if we need to make Dynosite Redirect to PDP
            var dynositeRedirect = MTDHelper.redirectToDynosite(productSearch);
            if (dynositeRedirect) {
                res.redirect(dynositeRedirect);
                return next();
            }
        }

        var searchMetadataObj = {};
        var queryString = req.querystring.q;

        if (!queryString && productSearch.category) {
            pageMetaHelper.setPageMetaData(req.pageMetaData, productSearch.category);
        } else {
            searchMetadataObj.pageTitle = Resource.msgf('metadata.searchresults', 'search', null, queryString);
            pageMetaHelper.setPageMetaData(req.pageMetaData, searchMetadataObj);
        }

        resultsTemplate = !willFitsOnModel ? resultsTemplate : 'search/searchResults';

        var fitsOnModelResetURL = request.httpURL.toString();
        fitsOnModelResetURL = urlHelpers.removeQueryParam(fitsOnModelResetURL, 'fitsOnModel');
        fitsOnModelResetURL = urlHelpers.removeQueryParam(fitsOnModelResetURL, 'willNotFit');

        res.render(resultsTemplate, {
            productSearch: productSearch,
            maxSlots: maxSlots,
            reportingURLs: reportingURLs,
            refineurl: refineurl,
            willFitsOnModel: willFitsOnModel,
            fitsOnModelResetURL: fitsOnModelResetURL,
            schemaData: schemaData,
            shouldIncludeInlineSchema: shouldIncludeInlineSchema
        });
    }

    return next();
}

server.append('Refinebar', function (req, res, next) {
    var MTDHelper = require('*/cartridge/scripts/util/MTDHelper');

    res.setViewData({
        mtdValue: MTDHelper.VALUE
    });

    return next();
});

server.get('Include', cache.applyShortPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    search(req, res, next);
}, pageMetaData.computedPageMetaData);

server.append('Show', cache.applyShortPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    search(req, res, next);
}, pageMetaData.computedPageMetaData);

module.exports = server.exports();
