'use strict';

/**
 * Search base controller overridden to show breadcrumbs on product listing page
 *
 */

var page = module.superModule;
var server = require('server');
server.extend(page);
var cache = require('*/cartridge/scripts/middleware/cache');

server.append('Show', cache.applyPromotionSensitiveCache, function (req, res, next) {
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    // Prioritize Category Page
    if (req.querystring.cgid && !req.querystring.q) {
        return next();
    }
    var isAjax = Object.hasOwnProperty.call(req.httpHeaders, 'x-requested-with')
    && req.httpHeaders['x-requested-with'] === 'XMLHttpRequest';
    var isShowMore = req.querystring.showMore ? req.querystring.showMore : false;
    var routeName = 'Search-Show';

    var contentSearch = searchHelper.setupContentSearch(req.querystring, routeName);
    if (contentSearch.contentCount < 1) {
        return next();
    }
    var viewData = searchHelper.updateContentViewData(contentSearch, isShowMore, isAjax, res.getViewData());
    viewData.querystring = req.querystring;
    res.setViewData(viewData);
    if (!req.querystring.cgid && req.querystring.fdid) {
        res.render(viewData.renderingTemplate);
    } else if (isShowMore) {
        res.render(viewData.renderingTemplate);
    }

    return next();
});

server.get('ShowContent', cache.applyPromotionSensitiveCache, function (req, res, next) {
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var isAjax = Object.hasOwnProperty.call(req.httpHeaders, 'x-requested-with')
    && req.httpHeaders['x-requested-with'] === 'XMLHttpRequest';
    var isShowMore = req.querystring.showMore ? req.querystring.showMore : false;
    var routeName = 'Search-ShowContent';

    var contentSearch = searchHelper.setupContentSearch(req.querystring, routeName);
    if (contentSearch.contentCount < 1) {
        return next();
    }
    var viewData = searchHelper.updateContentViewData(contentSearch, isShowMore, isAjax, res.getViewData());
    viewData.querystring = req.querystring;
    pageMetaHelper.setPageMetaTags(req.pageMetaData, contentSearch);
    pageMetaHelper.setPageMetaData(req.pageMetaData, contentSearch.folder);
    res.setViewData(viewData);
    res.render(viewData.renderingTemplate);
    return next();
});

module.exports = server.exports();
