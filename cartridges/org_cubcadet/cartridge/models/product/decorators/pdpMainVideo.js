'use strict';

var Site = require('dw/system/Site');

/**
 * Creates an array for a product
 * @param {Strings} value - attribute with a set of strings for a given product.
 * @return {Array} - an array containing the visible object attributes for a product.
 */
function objectArray(value) {
    var array = [];
    var ytLink = Site.getCurrent().getCustomPreferenceValue('youtubeImageURL');
    var videoIDValue;
    var videoID;
    var ytThumbSm;
    var ytThumbLg;

    for (var i = 0, l = value.length; i < l; i++) {
        var val = value[i];
        var index = val.indexOf('embed') + 6; // 6 for the character count of embed & the extra backslash
        videoIDValue = val.substring(index);
        videoID = videoIDValue.split('?');

        // Taking the videoID[0] from videoID as it has other argumnets also
        ytThumbSm = ytLink + videoID[0] + '/default.jpg';
        ytThumbLg = ytLink + videoID[0] + '/maxresdefault.jpg';

        var obj = { url: value[i], id: videoID[0], thumbSm: ytThumbSm, thumbLg: ytThumbLg };

        array.push(obj);
    }

    return array;
}

module.exports = function (object, apiProduct) {
    if (apiProduct.custom['pdp-main-image-video-slider'].length) {
        Object.defineProperty(object, 'pdpMainVideo', {
            enumerable: true,
            value: objectArray(apiProduct.custom['pdp-main-image-video-slider'])
        });
    } else {
        Object.defineProperty(object, 'pdpMainVideo', {
            enumerable: true,
            value: objectArray(object.youtubeVideos)
        });
    }
};
