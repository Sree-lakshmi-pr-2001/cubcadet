'use strict';

var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');
var imgConfig = require('*/cartridge/scripts/utils/ImageConfiguration');

/**
 * Get the content tile image URLs as an object
 *
 * @param {dw.content.Content} content - Asset to retrieve the tile image URL for
 * @return {Object} - Content tile image URLs object
 */
function getContentTileImageURLs(content) {
    var imageURLs = {};
    var mobileTransform = imgConfig.getPreset('article-mobile');
    var tabletTransform = imgConfig.getPreset('article-tablet');
    var desktopTransform = imgConfig.getPreset('article');

    var image = content.custom.image;
    if (!image) {
        image = Site.current.getCustomPreferenceValue('contentTileFallbackImage');
        if (!image) {
            var context = URLUtils.CONTEXT_SITE;
            var fallbackPath = 'images/noimagelarge.png'; // from base cartridge

            imageURLs.mobile = URLUtils.imageURL(context, null, fallbackPath, mobileTransform);
            imageURLs.tablet = URLUtils.imageURL(context, null, fallbackPath, tabletTransform);
            imageURLs.desktop = URLUtils.imageURL(context, null, fallbackPath, desktopTransform);
        }
    }

    if (image) {
        imageURLs.mobile = image.getImageURL(mobileTransform);
        imageURLs.tablet = image.getImageURL(tabletTransform);
        imageURLs.desktop = image.getImageURL(desktopTransform);
    }

    return imageURLs;
}

module.exports = {
    getContentTileImageURLs: getContentTileImageURLs
};
