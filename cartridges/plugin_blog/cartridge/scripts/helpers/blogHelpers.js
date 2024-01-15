'use strict';

/**
 * Generate breadcrumbs for given folder
 * @param  {dw.content.Folder} folder Current folder object
 * @return  {array} {breadcrumbs} Array of breadcrumbs
 */
function getBreadcrumbs(folder) {
    var breadcrumbs = [];
    if (folder !== null) {
        var URLUtils = require('dw/web/URLUtils');
        var currentFolder = folder;

        while (!currentFolder.root) {
            breadcrumbs.unshift({
                htmlValue: currentFolder.displayName,
                url: URLUtils.url('Search-ShowContent', 'fdid', currentFolder.ID)
            });

            currentFolder = currentFolder.parent;
        }
    }

    return breadcrumbs;
}

/**
 * @description Get Related product
 *
 * @param {dw.content.Content} apiContent Content object
 * @returns {Array} relatedProducts Array of Products
 */
function getRelatedProducts(apiContent) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var relatedProducts = [];

    if (Object.prototype.hasOwnProperty.call(apiContent.custom, 'relatedProducts') && apiContent.custom.relatedProducts) {
        apiContent.custom.relatedProducts.forEach(function (productID) {
            var product = ProductMgr.getProduct(productID);
            if (product) {
                relatedProducts.push(product);
            }
        });
    }

    return relatedProducts;
}

/**
 * @description Get Related Content
 *
 * @param {dw.content.Content|dw.catalog.Product} apiObject Content object or Product
 * @returns {Array} relatedContent Array of Content Assets
 */
function getRelatedContent(apiObject) {
    var ContentMgr = require('dw/content/ContentMgr');
    var relatedContent = [];

    if (Object.prototype.hasOwnProperty.call(apiObject.custom, 'relatedContent') && apiObject.custom.relatedContent) {
        apiObject.custom.relatedContent.forEach(function (contentID) {
            var content = ContentMgr.getContent(contentID);
            if (content) {
                relatedContent.push(content);
            }
        });
    }

    return relatedContent;
}

/**
 * @description Get the posted date of Content
 *
 * @param {dw.content.Content} apiContent Content object
 * @returns {Date} the post date
 */
function getPostedDate(apiContent) {
    if (apiContent.custom.postedDate !== null && apiContent.custom.postedDate !== '') {
        return apiContent.custom.postedDate;
    }

    return apiContent.creationDate;
}

/**
 * @description Determine if Content is a blog post, based on folder assignment
 *
 * @param {dw.content.Content} apiContent Content object
 * @returns {boolean} whether this is a blog post
 */
function isBlogPost(apiContent) {
    var Site = require('dw/system/Site');

    var folder = apiContent.classificationFolder;

    if (folder !== null) {
        var blogRootFolderID = Site.current.getCustomPreferenceValue('blogRootFolder');
        while (!folder.root) {
            if (folder.ID === blogRootFolderID) {
                return true;
            }

            folder = folder.parent;
        }
    }

    return false;
}

/**
 * @description Determine if Folder is a blog Folder
 * @param {dw.content.Folder} folder - Folder to be checked
 * @returns {boolean} whether this is a blog post
 */
function isBlogFolder(folder) {
    var Site = require('dw/system/Site');
    var folderToTest = folder;
    if (folderToTest !== null) {
        var blogRootFolderID = Site.current.getCustomPreferenceValue('blogRootFolder');
        while (!folderToTest.root) {
            if (folderToTest.ID === blogRootFolderID) {
                return true;
            }
            folderToTest = folderToTest.parent;
        }
    }
    return false;
}
module.exports = {
    getBreadcrumbs: getBreadcrumbs,
    getRelatedProducts: getRelatedProducts,
    getRelatedContent: getRelatedContent,
    getPostedDate: getPostedDate,
    isBlogPost: isBlogPost,
    isBlogFolder: isBlogFolder
};
