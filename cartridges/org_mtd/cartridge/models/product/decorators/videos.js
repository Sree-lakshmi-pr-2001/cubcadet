"use strict";

/**
* Returns the first video from the product's vimeoVideos or youtubeVideos array
* @param {Object} product - the product object
* @returns {string} - the first video from the product's vimeoVideos or youtubeVideos array
*/
function getVideoLink(product) {
    var pdpModalsVideo = "";

    if (product.vimeoVideos.length) {
        pdpModalsVideo = product.vimeoVideos[0];
    } else if (product.youtubeVideos.length) {
        pdpModalsVideo = product.youtubeVideos[0];
    }

    return pdpModalsVideo;
}

module.exports = function (object, apiProduct) {
    // If the attribute site-specific(V2) is not set, use the legacy attribute.
    Object.defineProperty(object, "youtubeVideos", {
        enumerable: true,
        value: apiProduct.custom.youtubeVideoUrl.length ? apiProduct.custom.youtubeVideoUrl : apiProduct.custom.youtubeVideoID
    });

    Object.defineProperty(object, "vimeoVideos", {
        enumerable: true,
        value: apiProduct.custom.vimeoVideoID
    });

    Object.defineProperty(object, "videoLink", {
        enumerable: true,
        value: getVideoLink(object)
    });
};
