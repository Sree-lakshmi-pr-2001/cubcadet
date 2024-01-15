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
    var videoID;
    var ytThumbSm;
    var ytThumbLg;

    for (var i = 0, l = value.length; i < l; i++) {
        var val = value[i];
        var index = val.indexOf('embed') + 6; // 6 for the character count of embed & the extra backslash
        videoID = val.substring(index);

        ytThumbSm = ytLink + videoID + '/default.jpg';
        ytThumbLg = ytLink + videoID + '/maxresdefault.jpg';

        var obj = { url: value[i], id: videoID, thumbSm: ytThumbSm, thumbLg: ytThumbLg };

        array.push(obj);
    }

    return array;
}

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'pdpMainVideo', {
        enumerable: true,
        value: objectArray(apiProduct.custom['pdp-main-image-video-slider'])
    });
};
