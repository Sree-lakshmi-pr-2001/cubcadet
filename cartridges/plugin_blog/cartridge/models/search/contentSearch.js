'use strict';

var PagingModel = require('dw/web/PagingModel');
var ContentMgr = require('dw/content/ContentMgr');
var Site = require('dw/system/Site');
var collections = require('*/cartridge/scripts/util/collections');
var URLUtils = require('dw/web/URLUtils');
var ACTION_ENDPOINT_CONTENT = 'Page-Show';
var DEFAULT_PAGE_SIZE = 12;

/**
 * Creates a nested folder refinement for sub-folders
 * @param {Array} values - The values of the Folder Refinement
 * @return {Array} tree - The updated array of the values of the nested folder refinement
 */
function createNestedFolderRefinements(values) {
    var tree = [];
    var mappedList = {};
    for (var j = 0; j < values.length; j++) {
        var folderID = values[j].value;
        mappedList[folderID] = values[j];
        mappedList[folderID].subCategories = [];
    }
    Object.keys(mappedList).forEach(function (key) {
        var folder = ContentMgr.getFolder(key);
        if (!folder.parent.root) {
            if (mappedList[folder.parent.ID]) {
                mappedList[folder.parent.ID].subCategories.push(mappedList[key]);
            }
        } else {
            tree.push(mappedList[key]);
        }
    });
    return tree;
}

/**
 * Copies the inputed object and assigned it to a custom object so it can be modified
 * @param {Object} CreatedObject - The Created Object the will be modified
 * @param {Object} CopiedObject - The object that values and keys will be Copied from
 */
function buildModelObject(CreatedObject, CopiedObject) {
    Object.keys(CopiedObject).forEach(function (key) {
        CreatedObject[key] = CopiedObject[key];
    });
}

/**
 * Adds other needed refinement Attributes to the custom Refinement Object similar to Product Search
 * @param {Object} refinementObj - The custom Refinement Object that will be modified with new properties
 * @param {dw.content.ContentSearchModel} apiContentSearchModel - The Content Search Model
 * @param {string} refinementDefinition - The refinement definition you are build the custom object around
 * @param {string} routeName - a string representing the route name
 */
function buildOtherRefinementAttributes(refinementObj, apiContentSearchModel, refinementDefinition, routeName) {
    if (refinementDefinition.folderRefinement) {
        var currentFolder;
        var blogRootFolderID = Site.current.getCustomPreferenceValue('blogRootFolder');
        var blogHelpers = require('*/cartridge/scripts/helpers/blogHelpers');

        if (apiContentSearchModel.folderSearch) {
            if (blogHelpers.isBlogFolder(apiContentSearchModel.folder)) {
                currentFolder = apiContentSearchModel.folder;
                if (apiContentSearchModel.isRefinedByFolder() && currentFolder.ID === refinementObj.value) {
                    refinementObj.url = apiContentSearchModel.urlRefineFolder(routeName, blogRootFolderID);
                    refinementObj.selected = true;
                } else {
                    refinementObj.url = apiContentSearchModel.urlRefineFolder(routeName, refinementObj.value);
                    refinementObj.selected = false;
                }
            } else {
                currentFolder = apiContentSearchModel.folder;
                if (apiContentSearchModel.isRefinedByFolder() && currentFolder.ID === refinementObj.value) {
                    if (!currentFolder.parent.root) {
                        refinementObj.url = apiContentSearchModel.urlRefineFolder(routeName, currentFolder.parent.ID);
                        refinementObj.selected = true;
                    } else {
                        refinementObj.url = apiContentSearchModel.urlRefineFolder(routeName, currentFolder.ID);
                        refinementObj.selected = true;
                    }
                } else {
                    refinementObj.url = apiContentSearchModel.urlRefineFolder(routeName, refinementObj.value);
                    refinementObj.selected = false;
                }
            }
        } else {
            currentFolder = apiContentSearchModel.folder;
            if (apiContentSearchModel.isRefinedByFolder() && currentFolder.ID === refinementObj.value) {
                if (apiContentSearchModel.searchPhrase) {
                    refinementObj.url = apiContentSearchModel.urlRelaxFolder(routeName);
                } else if (blogHelpers.isBlogFolder(apiContentSearchModel.folder)) {
                    refinementObj.url = apiContentSearchModel.urlRefineFolder(routeName, blogRootFolderID);
                } else {
                    refinementObj.url = apiContentSearchModel.urlRefineFolder(routeName, refinementObj.value);
                }
                refinementObj.selected = true;
            } else {
                refinementObj.url = apiContentSearchModel.urlRefineFolder(routeName, refinementObj.value);
                refinementObj.selected = false;
            }
        }
    } else if (refinementDefinition.attributeRefinement) {
        if (apiContentSearchModel.isRefinedByAttributeValue(refinementObj.ID, refinementObj.value)) {
            refinementObj.url = apiContentSearchModel.urlRelaxAttributeValue(routeName, refinementObj.ID, refinementObj.value);
            refinementObj.selected = true;
        } else {
            refinementObj.url = apiContentSearchModel.urlRefineAttributeValue(routeName, refinementObj.ID, refinementObj.value);
            refinementObj.selected = false;
        }
    }
    refinementObj.selectable = true;
    refinementObj.title = refinementObj.displayValue;
}
/**
 * Configures and returns a PagingModel instance
 *
 * @param {dw.util.Iterator} contentHits - Iterator for content search results
 * @param {number} count - Number of contents in search results
 * @param {number} pageSize - Number of contents to display
 * @param {number} startIndex - Beginning index value
 * @return {dw.web.PagingModel} - PagingModel instance
 */
function getPagingModel(contentHits, count, pageSize, startIndex) {
    var pagingModel = new PagingModel(contentHits, count);
    pagingModel.setStart(startIndex || 0);
    pagingModel.setPageSize(pageSize);
    return pagingModel;
}

/**
 * Transforms a page of content into an array of JSON objects
 * @param {{dw.util.List}} pageElements - PagingModel page of content
 * @param {Object} refinements - refinements for the content
 * @param {Object} apiContentSearchModel - refinements for the content
 * @return {Array} - page of content JSON objects
 */
function getContentSearchPageJSON(pageElements) {
    return collections.map(pageElements, function (contentAsset) {
        var parentFolderID;
        var classificationFolder = contentAsset.classificationFolder;
        if (classificationFolder === null && !contentAsset.folders.empty) {
            for (var x = 0; x < contentAsset.folders.length; x++) {
                parentFolderID = contentAsset.folders[x].parent.ID;
                classificationFolder = contentAsset.folders[x];
            }
        }
        return {
            name: contentAsset.name,
            custom: contentAsset.custom,
            url: URLUtils.url(ACTION_ENDPOINT_CONTENT, 'cid', contentAsset.ID),
            description: contentAsset.description,
            id: contentAsset.ID,
            parentFolderID: parentFolderID,
            classificationFolder: classificationFolder
        };
    });
}
/**
 * Retrieves search refinements for Content Search and assigns them to a custom object
 * @param {dw.content.ContentSearchModel} apiContentSearchModel - The Content Search Model
 * @param {string} routeName - a string representing the route name
 * @return {Object} - JSON object containing info about the refinement definition
 */
function getContentRefinements(apiContentSearchModel, routeName) {
    var refinementDefinitions = apiContentSearchModel.refinements.refinementDefinitions;
    var refinements = apiContentSearchModel.refinements;

    return collections.map(refinementDefinitions, function (definition) {
        var refinementValues = refinements.getAllRefinementValues(definition);
        var values = [];
        for (var x = 0; x < refinementValues.length; x++) {
            var refinementObj = {};
            var refinementValue = refinementValues[x];
            buildModelObject(refinementObj, refinementValue);
            buildOtherRefinementAttributes(refinementObj, apiContentSearchModel, definition, routeName);
            values.push(refinementObj);
        }
        if (definition.folderRefinement) {
            var nestedFolders = createNestedFolderRefinements(values);
            values = nestedFolders;
        }
        return {
            displayName: definition.displayName,
            isCategoryRefinement: definition.folderRefinement,
            isAttributeRefinement: definition.attributeRefinement,
            values: values
        };
    });
}
/**
 * @constructor
 * @classdesc ContentSearch class
 * @param {dw.util.Iterator<dw.content.Content>} contentSearchResult - content iterator
 * @param {number} count - number of contents returned in the search results
 * @param {string} params - the querystring parameters for the content search
 * @param {number | null} pageSize - The index for the start of the content page
 * @param {dw.content.ContentSearchModel} apiContentSearchModel - The Content Search Model
 * @param {string} routeName - a string representing the route name
 */
function ContentSearch(contentSearchResult, count, params, pageSize, apiContentSearchModel, routeName) {
    var ps = pageSize == null ? DEFAULT_PAGE_SIZE : pageSize;
    var pagingModel = getPagingModel(contentSearchResult, count, ps, params.startingPage);
    var contents = getContentSearchPageJSON(pagingModel.pageElements.asList(), apiContentSearchModel);
    var moreContentUrl;
    if (params.q) {
        moreContentUrl = pagingModel.maxPage > pagingModel.currentPage
            ? URLUtils.url(routeName, 'q', params.q, 'startingPage', pagingModel.end + 1, 'showMore', true)
            : null;
    } else if(params.sort) {
        moreContentUrl = pagingModel.maxPage > pagingModel.currentPage
            ? URLUtils.url(routeName, 'fdid', apiContentSearchModel.folder.ID, 'startingPage', pagingModel.end + 1, 'showMore', true, 'sort', params.sort)
            : null;
    } else {
        moreContentUrl = pagingModel.maxPage > pagingModel.currentPage
        ? URLUtils.url(routeName, 'fdid', apiContentSearchModel.folder.ID, 'startingPage', pagingModel.end + 1, 'showMore', true)
        : null;
    }
    this.queryPhrase = params.q;
    this.contents = contents;
    this.contentCount = count;
    this.moreContentUrl = moreContentUrl;
    this.hasMessage = params.startingPage === 0;
    this.folder = apiContentSearchModel.folder || apiContentSearchModel.deepestCommonFolder;
    this.refinements = getContentRefinements(apiContentSearchModel, routeName);
}

module.exports = ContentSearch;
