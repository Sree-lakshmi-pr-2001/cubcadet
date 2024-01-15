'use strict';
// var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');
var ContentMgr = require('dw/content/ContentMgr');

/**
 * prevents absolute URLs from being saved to an asset
 *
 * @param {string} html - asset body markup
 * @return {string} newMarkup - modified asset body markup
 */
function convertImageURLs(html, req) {
    var newMarkup = html;
    var site = Site.getCurrent();
    var siteLibrary = ContentMgr.getSiteLibrary();
    var siteLibraryID = siteLibrary.ID === 'Library' ? site.getID() : siteLibrary.ID;
    var instance = req.https ? 'https://' + req.host : 'http://' + req.host;
    // get Site library path with site context for use in the canvas to display images
    var absURL = require('dw/web/URLUtils').staticURL('').toString().replace('-/', '');
    absURL = instance + absURL.replace('Sites-Site', '-/Sites-' + siteLibraryID + '-Library') + '/';
    var pattern = new RegExp(absURL, "g");
    // remove the http(s)://staging..../
    newMarkup = newMarkup.replace(pattern, '');

    // add ?$staticlink$
    var suffix = '?$staticlink$"';
    newMarkup = newMarkup.replace(/.jpg\"/g, '.jpg' + suffix).replace(/.png\"/g, '.png' + suffix).replace(/.gif\"/g, '.gif' + suffix)

    return newMarkup;

}

module.exports = {
    convertImageURLs: convertImageURLs
};
