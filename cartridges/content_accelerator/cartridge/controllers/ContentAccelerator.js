'use strict';
/* global request */

/**
 * Controller that renders the Content Accelerator tool
 */

var server = require('server');
// var logger = require('dw/system/Logger');
var LibraryModel = require('*/cartridge/models/ocapi/resources/library');
var Site = require('dw/system/Site');
var ContentMgr = require('dw/content/ContentMgr');
var assetHelpers = require('*/cartridge/scripts/assetHelpers');
var LOCALE = 'default';
var URLUtils = require('dw/web/URLUtils');

/**
 * Renders the Dashboard page.
 */

server.get('Show', function (req, res, next) {
    var contentAccelerator = require('*/cartridge/models/contentAccelerator');
    var lastModifiedAssets = contentAccelerator.getLastModifiedContent(6);
    var assetBrowser = contentAccelerator.createAssetBrowser();
    var presetConfigs = require('*/cartridge/client/default/js/contentAccelerator/configs/contentConfigs');

    // pull in site-specific CSS and JS files
    var site = Site.getCurrent();
    var siteContext = URLUtils.CONTEXT_SITE;
    var siteCSSURL = URLUtils.staticURL(siteContext, site.ID, '/css/global.css').toString();
    siteCSSURL = siteCSSURL.replace('Sites-Site', 'Sites-' + site.ID + '-Site');
    var caCSSURL = URLUtils.staticURL(siteContext, site.ID, '/css/contentAccelerator.css').toString();
    caCSSURL = caCSSURL.replace('Sites-Site', 'Sites-' + site.ID + '-Site');
    var caAcceleratorInitJS = URLUtils.staticURL(siteContext, site.ID, '/js/acceleratorInit.js').toString();
    caAcceleratorInitJS = caAcceleratorInitJS.replace('Sites-Site', 'Sites-' + site.ID + '-Site');

    res.render('contentAccelerator/dashboard', {
        localeOptions: contentAccelerator.createLocaleOptions(),
        selectedLocale: LOCALE,
        recentAssets: lastModifiedAssets,
        assetBrowser: assetBrowser,
        folderList: contentAccelerator.getAllFolders(true),
        presets: presetConfigs.presets,
        site: site,
        siteCSS: siteCSSURL,
        caCSS: caCSSURL,
        caJS: caAcceleratorInitJS
    });

    next();
});

/**
 * Renders the Asset Editor
 */

server.get('Create', function (req, res, next) {
    res.render('contentAccelerator/contentAccelerator', {});
    next();
});

/**
 * Saves an asset
 */
server.post('SaveContentAsset', function (req, res, next) {
    var ContentAssetModel = require('*/cartridge/models/ocapi/asset');
    var site = Site.getCurrent();
    var httpParameterMap = request.httpParameterMap;
    var siteLibrary = ContentMgr.getSiteLibrary();
    var siteLibraryID = siteLibrary.ID === 'Library' ? site.getID() : siteLibrary.ID;

    // Create asset if it doesn't exist via the OCAPI Data API
    var libraryModel = new LibraryModel(siteLibraryID);
    var data = JSON.parse(httpParameterMap.requestBodyAsString);
    var contentAsset;
    var contentAssetID = data['gjs-contentAssetID'];
    var contentAssetName = data['gjs-name'];
    var contentAssetHTML = data['gjs-html'];
    var locale = data['gjs-locale'] || LOCALE;
    LOCALE = locale.indexOf('_') > 0 ? locale.replace('_', '-') : locale;

    // prevent absolute image urls from being saved to the asset
    // OCAPI Shop image urls are always absolute
    var convertedContentAssetHTML = assetHelpers.convertImageURLs(contentAssetHTML, req);

    var assetModel = new ContentAssetModel(contentAssetID, convertedContentAssetHTML, LOCALE, site.ID);

    if (contentAssetName) {
        assetModel.setName(contentAssetName, LOCALE);
    }

    // check if we are saving or creating
    var existingAsset = libraryModel.getContentAsset(contentAssetID);
    if (existingAsset && existingAsset !== 'ERROR') {
        contentAsset = libraryModel.updateContentAsset(contentAssetID, assetModel, existingAsset._resource_state); // eslint-disable-line no-underscore-dangle
    } else {
        contentAsset = libraryModel.createContentAsset(contentAssetID, assetModel);
    }

    var contentFolder = data['gjs-folder'] || 'content-accelerator';
    // Create the content-accelerator folder if it doesn't already exist
    if (!ContentMgr.getFolder(contentFolder)) {
        libraryModel.createContentFolder(contentFolder);
    }

    libraryModel.putContentInFolder(contentAssetID, contentFolder);

    if (contentAsset !== 'ERROR') {
        res.json({ saveContentAsset: true });
    } else {
        res.json({ saveContentAsset: false + ': ' + contentAsset });
    }
    next();
});

/**
 * Opens an asset in the Editor
 */
server.get('LoadContentAsset', function (req, res, next) {
    var httpParameterMap = request.httpParameterMap;
    var html;
    var folder;
    var name;
    var error;
    var site = Site.getCurrent();
    var siteLibrary = ContentMgr.getSiteLibrary();
    var siteLibraryID = siteLibrary.ID === 'Library' ? site.getID() : siteLibrary.ID;
    var libraryModel = new LibraryModel(siteLibraryID);
    var pLocale = httpParameterMap.locale.value;
    // convert locale to prop value, ie Fr_CA to fr-CA
    LOCALE = (pLocale && pLocale.indexOf('_') > 0) ? pLocale.replace('_', '-') : pLocale;
    // get Site library path with site context for use in the canvas to display images
    var staticURL = URLUtils.staticURL('').toString().replace('-/', '');
    staticURL = staticURL.replace('Sites-Site', '-/Sites-' + siteLibraryID + '-Library');

    // get Site global CSS and JS so we stay confined to the site we're working in
    var siteContext = URLUtils.CONTEXT_SITE;
    var siteCSSURL = URLUtils.staticURL(siteContext, site.ID, '/css/global.css').toString();
    siteCSSURL = siteCSSURL.replace('Sites-Site', 'Sites-' + site.ID + '-Site');
    var caCSSURL = URLUtils.staticURL(siteContext, site.ID, '/css/contentAccelerator.css').toString();
    caCSSURL = caCSSURL.replace('Sites-Site', 'Sites-' + site.ID + '-Site');
    var caEditorInitJS = URLUtils.staticURL(siteContext, site.ID, '/js/editorInit.js').toString();
    caEditorInitJS = caEditorInitJS.replace('Sites-Site', 'Sites-' + site.ID + '-Site');

    // Retrieve the asset via OCAPI to get its _resource_state
    var assetData = libraryModel.getContentAsset(httpParameterMap.contentAssetID);

    if (assetData !== null) {
        // If the content asset is locked, the server returns a 409 with a PATCH request
        var isUnlocked = libraryModel.updateContentAsset(httpParameterMap.contentAssetID, assetData, assetData._resource_state); // eslint-disable-line no-underscore-dangle
        if (isUnlocked !== 'ERROR') {
            html = assetData.c_body[LOCALE] ? assetData.c_body[LOCALE].markup : assetData.c_body.default.markup;

            // get folder and name to prefill save asset form
            folder = (assetData.classification_folder_id === 'content-accelerator-templates') ? 'content-accelerator' : assetData.classification_folder_id;
            name = assetData.name ? assetData.name.default : httpParameterMap.contentAssetID;
        } else {
            error = 'The Asset is Locked and can not be edited.';
            res.json({ contentAssetCode: null, error: true, errorMessage: error });
        }
    }

    if (httpParameterMap.format.value === 'json') {
        // load the asset in the editor
        if (html !== null) {
            var returnData = {
                html: html
            };
            res.viewData = returnData;
            res.json();
        } else {
            res.json({ contentAssetCode: null, error: true, errorMessage: 'Unable to locate that content asset' });
        }
    } else {
        var contentAccelerator = require('*/cartridge/models/contentAccelerator');
        var localeOptions = contentAccelerator.createLocaleOptions();
        var assetBrowser = contentAccelerator.createAssetBrowser();

        // open the editor with the content asset loaded
        res.render('contentAccelerator/contentAccelerator', {
            assetID: httpParameterMap.contentAssetID,
            assetName: name,
            assetFolder: folder,
            html: html,
            assetBrowser: assetBrowser,
            folderList: contentAccelerator.getAllFolders(true),
            error: error,
            locale: LOCALE,
            localeOptions: localeOptions,
            staticURL: staticURL,
            site: site,
            siteCSS: siteCSSURL,
            caCSS: caCSSURL,
            caJS: caEditorInitJS
        });
    }

    next();
});

/**
 * Initiated from the dashboard
 * Copies and asset in the library then loads it in the editor
 */
server.get('CopyContentAsset', function (req, res, next) {
    var ContentAssetModel = require('*/cartridge/models/ocapi/asset');
    var httpParameterMap = request.httpParameterMap;
    var site = Site.getCurrent();
    var siteLibrary = ContentMgr.getSiteLibrary();
    var siteLibraryID = siteLibrary.ID === 'Library' ? site.getID() : siteLibrary.ID;
    var contentAsset = ContentMgr.getContent(httpParameterMap.contentAssetID);
    var contentAssetID = contentAsset.ID;
    var contentAssetHtml = contentAsset.custom.body.source;
    var pLocale = httpParameterMap.locale.value || LOCALE;
    LOCALE = pLocale.indexOf('_') > 0 ? pLocale.replace('_', '-') : pLocale;

    // Give a unique ID to the new asset
    var newAssetID = httpParameterMap.newAssetID.value;

    if (!newAssetID) {
        var datetime = new Date().getTime();
        newAssetID = contentAssetID + '-' + datetime;
    }

    var newAssetName = httpParameterMap.name;
    var newAssetFolder = httpParameterMap.folder;

    // Create the new asset via OCAPI Data API
    var libraryModel = new LibraryModel(siteLibraryID);
    var assetModel = new ContentAssetModel(newAssetID, contentAssetHtml, LOCALE, site.ID);

    if (newAssetName.empty === false) {
        assetModel.setName(newAssetName, LOCALE);
    }

    // Create the new content asset
    var newAsset = libraryModel.createContentAsset(newAssetID, assetModel);

    if (newAsset !== 'ERROR') {
        // Create the content-accelerator folder if it doesn't already exist
        if (!ContentMgr.getFolder('content-accelerator')) {
            libraryModel.createContentFolder('content-accelerator');
        }

        // Add the new asset to the chosen folder or content-accelerator if none was chosen
        if (newAssetFolder.empty === true) {
            newAssetFolder = 'content-accelerator';
        }

        libraryModel.putContentInFolder(newAssetID, newAssetFolder);
    }

    if (httpParameterMap.format.value === 'json') {
        if (contentAssetHtml !== null) {
            var returnData = {
                html: contentAssetHtml
            };
            res.viewData = returnData;
            res.json();
        } else {
            res.json({ contentAssetCode: null, error: true, errorMessage: 'Unable to locate that content asset' });
        }
    } else {
        // open the editor with the content asset loaded
        res.render('contentAccelerator/contentAccelerator', {
            assetID: newAssetID,
            assetFolder: newAssetFolder,
            assetName: newAssetName,
            html: contentAssetHtml,
            site: site
        });
    }

    next();
});

/**
 * Checks a given content asset ID to make sure it exists
 */
server.get('ValidateAsset', function (req, res, next) {
    var assetId = request.httpParameterMap.aid;
    var copyAssetId = request.httpParameterMap.copyaid;
    var response = {
        errorFields: []
    };

    if (assetId) {
        var contentAsset = ContentMgr.getContent(assetId);

        if (!contentAsset) {
            response.errorFields.push('aid');
        }
    }

    if (copyAssetId) {
        var contentAssetCopy = ContentMgr.getContent(copyAssetId);

        if (contentAssetCopy) {
            response.errorFields.push('copyaid');
        }
    }

    res.json(response);
    next();
});

module.exports = server.exports();
