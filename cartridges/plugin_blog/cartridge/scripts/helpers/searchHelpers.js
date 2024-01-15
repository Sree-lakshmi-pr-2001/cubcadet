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
        apiContentSearchModel.setSearchPhrase(params.q);
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
    if (params.sort != null) {
        apiContentSearchModel.setSortingCondition(params.sort, ContentSearchModel.SORT_DIRECTION_DESCENDING);
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
 * @return {Object} viewData - The updated viewData with the content properties
 */
function updateContentViewData(contentSearch, isShowMore, isAjax, viewData) {
    var blogHelpers = require('*/cartridge/scripts/helpers/blogHelpers');
    var Site = require('dw/system/Site');
    var ContentMgr = require('dw/content/ContentMgr');
    var blogRootFolderID = Site.current.getCustomPreferenceValue('blogRootFolder');
    var rootBlogFolder = ContentMgr.getFolder(blogRootFolderID);

    viewData.currentFolder = {};
    viewData.renderingTemplate = isShowMore ? 'search/contentGrid' : 'search/contentSearch';

    if (contentSearch.folder) {
        viewData.currentFolder = contentSearch.folder;
        viewData.breadcrumbs = blogHelpers.getBreadcrumbs(viewData.currentFolder);
        if (!isShowMore && !isAjax && viewData.currentFolder.template) {
            viewData.renderingTemplate = viewData.currentFolder.template;
        } else if (isAjax && isShowMore) {
            viewData.renderingTemplate = 'search/contentGrid';
        } else {
            viewData.renderingTemplate = 'search/contentSearch';
        }
    } else {
        viewData.breadcrumbs = blogHelpers.getBreadcrumbs(rootBlogFolder);
    }
    if (viewData.currentFolder !== null && viewData.currentFolder.ID === blogRootFolderID) {
        viewData.rootBlogFolder = viewData.currentFolder;
    }
    if (rootBlogFolder == null) {
        viewData.rootBlogFolder = ContentMgr.getFolder(blogRootFolderID);
    }
    viewData.contentSearch = contentSearch;
    return viewData;
}

var exports = base;
exports.setupContentSearch = setupContentSearch;
exports.updateContentViewData = updateContentViewData;

module.exports = exports;
