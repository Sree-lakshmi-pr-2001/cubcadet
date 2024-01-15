'use strict';

var base = module.superModule;

/**
 * Set content search configuration values
 *
 * @param {Object} params - Provided HTTP query parameters
 * @param {string} routeName - a string representing the route name
 * @return {Object} - content search instance
 */
function setupContentSearch(params, routeName) {
    var ContentSearchModel = require('dw/content/ContentSearchModel');
    var ContentSearch = require('*/cartridge/models/search/contentSearch');

    var apiContentSearchModel = new ContentSearchModel();
    apiContentSearchModel.setRecursiveFolderSearch(true);
    if (params.q != null) {
        var parsedSearch = params.q.replace(/[^\w. ]/gi, '');
        apiContentSearchModel.setSearchPhrase(parsedSearch);
        apiContentSearchModel.setSortingCondition('creationDate', ContentSearchModel.SORT_DIRECTION_DESCENDING);
    }
    if (params.fdid != null) {
        apiContentSearchModel.setFolderID(params.fdid);
    }
    if (params.crefn1 != null && params.crefv1 != null) {
        apiContentSearchModel.setRefinementValues(params.crefn1, params.crefv1);
    }
    if (params.crefn2 != null && params.crefv2 != null) {
        apiContentSearchModel.setRefinementValues(params.crefn2, params.crefv2);
    }
    if (params.crefn3 != null && params.crefv3 != null) {
        apiContentSearchModel.setRefinementValues(params.crefn3, params.crefv3);
    }
    apiContentSearchModel.search();
    var contentSearchResult = apiContentSearchModel.getContent();
    var count = Number(apiContentSearchModel.getCount());
    var contentSearch = new ContentSearch(contentSearchResult, count, params, null, apiContentSearchModel, routeName);

    return contentSearch;
}

/**
 * Set content search configuration values
 *
 * @param {Object} contentSearch - The Content Search Object
 * @param {Object} isShowMore - Was it a Show More button click
 * @param {Object} isAjax - Was it an Ajax request
 * @param {Object} viewData - The viewData from the res object
 * @param {string} routeName - The route that called the function
 * @return {Object} viewData - The updated viewData with the content properties
 */
function updateContentViewData(contentSearch, isShowMore, isAjax, viewData, routeName) {
    var blogHelpers = require('*/cartridge/scripts/helpers/blogHelpers');
    var Site = require('dw/system/Site');
    var ContentMgr = require('dw/content/ContentMgr');
    var blogRootFolderID = Site.current.getCustomPreferenceValue('blogRootFolder');
    var rootBlogFolder = ContentMgr.getFolder(blogRootFolderID);
    var isStandardSearch = routeName === 'Search-Show';
    var searchViewData = viewData;

    searchViewData.currentFolder = {};
    searchViewData.renderingTemplate = isShowMore ? 'search/contentGrid' : 'search/contentSearch';

    if (contentSearch.folder) {
        searchViewData.currentFolder = contentSearch.folder;
        if (!isStandardSearch) {
            searchViewData.breadcrumbs = blogHelpers.getBreadcrumbs(searchViewData.currentFolder);
        }
        if (!isShowMore && !isAjax && searchViewData.currentFolder.template && !contentSearch.queryPhrase) {
            searchViewData.renderingTemplate = searchViewData.currentFolder.template;
        } else if (isAjax && isShowMore) {
            searchViewData.renderingTemplate = 'search/contentGrid';
        } else {
            searchViewData.renderingTemplate = 'search/contentSearch';
        }
    } else if (!isStandardSearch) {
        searchViewData.breadcrumbs = blogHelpers.getBreadcrumbs(rootBlogFolder);
    }
    if (searchViewData.currentFolder !== null && searchViewData.currentFolder.ID === blogRootFolderID) {
        searchViewData.rootBlogFolder = searchViewData.currentFolder;
    }
    if (rootBlogFolder == null) {
        searchViewData.rootBlogFolder = ContentMgr.getFolder(blogRootFolderID);
    }
    searchViewData.contentSearch = contentSearch;
    return searchViewData;
}

var exports = base;
exports.setupContentSearch = setupContentSearch;
exports.updateContentViewData = updateContentViewData;

module.exports = exports;
