'use strict';

var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');

/**
 * Get the content tile image URLs as an object
 *
 * @param {dw.content.Content} content - Asset to retrieve the tile image URL for
 * @return {Object} - Content tile image URLs object
 */
function getContentTileImageURLs(content) {
    var imageURLs = {};
    var mobileTransform = { scaleWidth: 200, scaleHeight: 180, scaleMode: 'cut' };
    var tabletTransform = { scaleWidth: 250, scaleHeight: 200, scaleMode: 'cut' };
    var desktopTransform = { scaleWidth: 400, scaleHeight: 300, scaleMode: 'cut' };

    var image = content.custom.image;
    if (!image) {
        image = Site.current.getCustomPreferenceValue('contentTileFallbackImage');
        if (!image) {
            var context = URLUtils.CONTEXT_SITE;
            var fallbackPath = 'images/noimagelarge.png'; // from base cartridge

            imageURLs.mobile = URLUtils.imageURL(context, null, fallbackPath, mobileTransform);
            imageURLs.tablet = URLUtils.imageURL(context, null, fallbackPath, tabletTransform);
            imageURLs.desktop = URLUtils.imageURL(context, null, fallbackPath, desktopTransform);
            imageURLs.original = image.getImageURL({});
        }
    }

    if (image) {
        imageURLs.mobile = image.getImageURL(mobileTransform);
        imageURLs.tablet = image.getImageURL(tabletTransform);
        imageURLs.desktop = image.getImageURL(desktopTransform);
        imageURLs.original = image.getImageURL({});
    }

    return imageURLs;
}

module.exports = {
    getContentTileImageURLs: getContentTileImageURLs
};
