'use strict';

var TEMPLATE_FOLDER = 'content-accelerator-templates';


/**
 * Retrieves all folders in the system starting from the given folder.
 * @param {dw.content.Folder} folder - folder
 * @returns {Collection} subFolderList - sub folder list
 */
function getSubFolders(folder) {
    var subFolders = folder.subFolders;
    var subFolderList = subFolders;

    if (subFolders.length) {
        for (var i = 0; i < subFolders.length; i++) {
            subFolderList.addAll(getSubFolders(subFolders[i]));
        }
    }

    return subFolderList;
}

/**
 * Retrieves all content assets in the system starting from the given folder.
 * @param {dw.content.Folder} folder - the folder
 * @returns {Collection} subFolderAssets - returns all subFolderAssets
 */
function getSubFolderAssets(folder) {
    var folderContent = folder.content;
    var subFolders = folder.subFolders;
    var subFolderAssets = folderContent;

    if (subFolders.length) {
        for (var i = 0; i < subFolders.length; i++) {
            subFolderAssets.addAll(getSubFolderAssets(subFolders[i]));
        }
    }

    return subFolderAssets;
}


/**
 * Retrieves all of the content assets in the system starting from the root folder.
 * @returns {Collection} allContent - returns all content
 */
function getAllContentAssets() {
    var ContentMgr = require('dw/content/ContentMgr');
    var siteLibrary = ContentMgr.getSiteLibrary();

    var allContent = getSubFolderAssets(siteLibrary.root);

    return allContent;
}

/**
 * Retrieves all of the folders in the system starting from the root folder.
 * @param {collection} sort - the collection to sort
 * @returns {Collection} allFolders - allFolders
 */
function getAllFolders(sort) {
    var ContentMgr = require('dw/content/ContentMgr');
    var siteLibrary = ContentMgr.getSiteLibrary();

    var allFolders = getSubFolders(siteLibrary.root);

    if (sort) {
        allFolders = allFolders.toArray().sort(function (a, b) {
            if (a.ID > b.ID) {
                return 1;
            } else if (a.ID < b.ID) {
                return -1;
            }

            return 0;
        });
    }

    return allFolders;
}

/**
 * Retrieves all of the folders directly under the root folder
 * @param {Object} folder - folder
 * @returns {string} browserHtml - html
 */
function createAssetBrowserLevel(folder) {
    var folderContent = folder.content;
    var subFolders = folder.subFolders;
    var folderLevelClasses = 'collapse';
    var folderExpanded = 'false';

    if (folder.ID === 'root') {
        folderLevelClasses += ' show';
        folderExpanded = 'true';
    }

    var browserHtml = '<div class="content-folder" data-toggle="collapse" data-target="#' + folder.ID + '-folder" aria-expanded="' + folderExpanded + '" aria-controls="' + folder.ID + '-folder">';
    browserHtml += '<i class="fa fa-plus-square"></i>';
    browserHtml += '<i class="fa fa-minus-square"></i>';
    browserHtml += folder.ID;
    browserHtml += '</div>';
    browserHtml += '<div class="content-folder-level ' + folderLevelClasses + '" id="' + folder.ID + '-folder" data-folder="' + folder.ID + '">';

    for (var j = 0; j < subFolders.length; j++) {
        if (subFolders[j].content.length > 0 || subFolders[j].subFolders.length > 0) {
            if (subFolders[j].ID !== TEMPLATE_FOLDER) {
                browserHtml += createAssetBrowserLevel(subFolders[j]);
            }
        }
    }

    for (var i = 0; i < folderContent.length; i++) {
        browserHtml += '<div class="content-asset">';
        browserHtml += folderContent[i].ID;
        browserHtml += '</div>';
    }

    browserHtml += '</div>';

    return browserHtml;
}

/**
 * Retrieves all of the folders directly under the root folder
 * @returns {string} browserHtml - html
 */
function createAssetBrowser() {
    var ContentMgr = require('dw/content/ContentMgr');
    var siteLibrary = ContentMgr.getSiteLibrary();

    return createAssetBrowserLevel(siteLibrary.root);
}

/**
 * populates a select input with locale options
 * @returns {string} browserHtml - html
 */
function createLocaleOptions() {
    var Site = require('dw/system/Site');
    var Locales = Site.getCurrent().getAllowedLocales();
    var browserHtml = '<option value="default">default</option>';
    for (var i = 0; i < Locales.length; i++) {
        browserHtml += '<option value="' + Locales[i] + '"> ' + Locales[i] + '</option>';
    }

    return browserHtml;
}

/**
 * Retrieves a number of content assets that were last modified based on the given count
 * @param {nNumber} count - Number of assets to retrieve
 * @param {number} start - Starting index to count from
 * @returns {dw.util.List} sortedAssets - the sorted list
 */
function getLastModifiedContent(count, start) {
    var assets = getAllContentAssets();
    var filteredAssets;
    var startIndex = start || 0;
    var endIndex = startIndex + count;

    // remove template assets
    filteredAssets = assets.toArray().filter(function (asset) {
        if (asset.folders[0].ID !== TEMPLATE_FOLDER) {
            return this;
        }
    });

    var sortedAssets = filteredAssets.sort(function (a, b) {
        return b.getLastModified().getTime() - a.getLastModified().getTime();
    });

    return sortedAssets.slice(startIndex, endIndex);
}

module.exports = {
    getAllContentAssets: getAllContentAssets,
    getSubFolderAssets: getSubFolderAssets,
    getAllFolders: getAllFolders,
    getSubFolders: getSubFolders,
    getLastModifiedContent: getLastModifiedContent,
    createAssetBrowser: createAssetBrowser,
    createLocaleOptions: createLocaleOptions
};
