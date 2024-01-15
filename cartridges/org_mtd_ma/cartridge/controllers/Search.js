'use strict';

var page = module.superModule;
var server = require('server');

var CatalogMgr = require('dw/catalog/CatalogMgr');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.extend(page);

/**
 * Creates the breadcrumbs object
 * @param {string} cgid - category ID from navigation and search
 * @param {Array} breadcrumbs - array of breadcrumbs object
 * @param {string} query - search query string
 * @returns {Array} an array of breadcrumb objects
 */
function getAllBreadcrumbs(cgid, breadcrumbs, query) {
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');

    var category;
    if (cgid) {
        category = CatalogMgr.getCategory(cgid);
    }

    if (category) {
        if (category.custom.disableBreadcrumbs) {
            return [];
        }
        breadcrumbs.push({
            htmlValue: category.displayName,
            url: URLUtils.url('Search-Show', 'cgid', category.ID)
        });

        if (category.parent && category.parent.ID !== 'root') {
            return getAllBreadcrumbs(category.parent.ID, breadcrumbs);
        }
    } else {
        breadcrumbs.push({
            htmlValue: Resource.msg('breadcrumb.searchresults', 'search', null),
            url: URLUtils.url('Search-Show', 'q', query)
        });
    }

    return breadcrumbs;
}

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
    var maxMobileSlots = 2;
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
        CatalogMgr.getSiteCatalog().getRoot(),
        categoryTemplate
    );
 
    var fitsOnModelPDP = req.querystring.pid || false
    if(fitsOnModelPDP) {
        if(productSearch.count === 0) {
            res.redirect(URLUtils.url('Product-Show', 'pid', fitsOnModelPDP, 'fitsOnModel', hasFitsOnModel, 'willNotFitModel', true));
            return next();
        } else {
            res.redirect(URLUtils.url('Product-Show', 'pid', fitsOnModelPDP, 'fitsOnModel', hasFitsOnModel));
            return next();
        }
    }
 
    var partFinderQuery = req.querystring.ispartfinder;
    if (partFinderQuery) {
        res.setViewData({
            partfinderquery: { name: req.querystring.pfname }
        });
    }
 
    var categoryID = apiProductSearch.category ? apiProductSearch.category.ID : null;
    var breadcrumbs = getAllBreadcrumbs(categoryID, [], req.querystring.q).reverse();
 
    var fitsOnModelEnable = apiProductSearch.category && apiProductSearch.category.custom.fitsOnModelEnable;
    var willFitsOnModel = hasFitsOnModel && (fitsOnModelEnable || req.querystring.q) || false;
 
    if(willFitsOnModel && productSearch.count === 0) {
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
    
    var ga4Data = {
        event: 'view_item_list',                      
        item_list_id: productSearch.category && productSearch.category.id,
        item_list_name: productSearch.category && productSearch.category.name,
        items: []          
    }
    
    for (var k = 0; k < productSearch.productIds.length; k++) {
        var plpItem = {
            item_id: productSearch.productIds[k].productSearchHit.product.ID,
            item_name: productSearch.productIds[k].productSearchHit.product.name
        }
        ga4Data.items.push(plpItem);
    }

    if (
        productSearch.isCategorySearch
        && !productSearch.isRefinedCategorySearch
        && categoryTemplate
    ) {
        pageMetaHelper.setPageMetaData(req.pageMetaData, productSearch.category);
 
        if (isAjax) {
            res.render(resultsTemplate, {
                breadcrumbs: breadcrumbs,
                productSearch: productSearch,
                maxSlots: maxSlots,
                maxMobileSlots: maxMobileSlots,
                reportingURLs: reportingURLs,
                refineurl: refineurl,
                schemaData: schemaData,
                context : JSON.stringify(ga4Data)
            });
        } else {
            res.render(categoryTemplate, {
                breadcrumbs: breadcrumbs,
                productSearch: productSearch,
                maxSlots: maxSlots,
                maxMobileSlots: maxMobileSlots,
                category: apiProductSearch.category,
                reportingURLs: reportingURLs,
                refineurl: refineurl,
                schemaData: schemaData,
                shouldIncludeInlineSchema: shouldIncludeInlineSchema,
                context : JSON.stringify(ga4Data)
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
            breadcrumbs: breadcrumbs,
            productSearch: productSearch,
            maxSlots: maxSlots,
            maxMobileSlots: maxMobileSlots,
            reportingURLs: reportingURLs,
            refineurl: refineurl,
            willFitsOnModel: willFitsOnModel,
            fitsOnModelResetURL: fitsOnModelResetURL,
            schemaData: schemaData,
            shouldIncludeInlineSchema: shouldIncludeInlineSchema,
            context : JSON.stringify(ga4Data)
        });
    }
 
    // Prioritize Category Page
    if ((req.querystring.cgid && !req.querystring.q) || hasFitsOnModel) {
        return next();
    }
    var routeName = 'Search-Show';
    var isShowMore = req.querystring.showMore ? req.querystring.showMore : false;
 
 
    var contentSearch = searchHelper.setupContentSearch(req.querystring, routeName);
    if (contentSearch.contentCount < 1) {
        return next();
    }
    var viewData = searchHelper.updateContentViewData(contentSearch, isShowMore, isAjax, res.getViewData(), routeName);
    viewData.querystring = req.querystring;
    res.setViewData(viewData);
    if (!req.querystring.cgid && req.querystring.fdid) {
        res.render(viewData.renderingTemplate);
    } else if (isShowMore) {
        res.render(viewData.renderingTemplate);
    }
 
    return next();
}

server.append('UpdateGrid', cache.applyPromotionSensitiveCache, function (req, res, next) {
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var ProductSearch = require('*/cartridge/models/search/productSearch');

    var apiProductSearch = new ProductSearchModel();
    apiProductSearch = searchHelper.setupSearch(apiProductSearch, req.querystring);
    apiProductSearch.search();
    var categoryTemplate = searchHelper.getCategoryTemplate(apiProductSearch);
    var productSearch = new ProductSearch(
        apiProductSearch,
        req.querystring,
        req.querystring.srule,
        CatalogMgr.getSortingOptions(),
        CatalogMgr.getSiteCatalog().getRoot(),
        categoryTemplate
    );

    res.render('/search/productGrid', {
        productSearch: productSearch
    });

    next();
});

server.append('Refinebar', cache.applyDefaultCache, function (req, res, next) {
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var ProductSearch = require('*/cartridge/models/search/productSearch');
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');

    var apiProductSearch = new ProductSearchModel();
    apiProductSearch = searchHelper.setupSearch(apiProductSearch, req.querystring);
    apiProductSearch.search();
    var productSearch = new ProductSearch(
        apiProductSearch,
        req.querystring,
        req.querystring.srule,
        CatalogMgr.getSortingOptions(),
        CatalogMgr.getSiteCatalog().getRoot()
    );
    res.render('/search/searchRefineBar', {
        productSearch: productSearch,
        querystring: req.querystring
    });

    next();
});

server.replace('Include', cache.applyShortPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    search(req, res, next);
}, pageMetaData.computedPageMetaData);

server.append('Show', cache.applyShortPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    search(req, res, next);
}, pageMetaData.computedPageMetaData);

server.append('Content', cache.applyDefaultCache, consentTracking.consent, function (req, res, next) {
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');

    var contentSearch = searchHelper.setupContentSearch(req.querystring);

    if (req.querystring.startingPage > 0) {
        res.render('/search/components/contentTiles', {
            contentSearch: contentSearch
        });
    } else {
        res.render('/search/contentGrid', {
            contentSearch: contentSearch
        });
    }
    next();
});

module.exports = server.exports();
