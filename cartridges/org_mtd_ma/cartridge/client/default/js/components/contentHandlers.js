'use strict';

var utils = require('lyonscg/util/utils');
var imagesloaded = require('imagesloaded');

/**
 *
 */
var handleHomeCatTile = function () {
    // synch the child heights to align the CTAs
    // flex will not work with CTAs > 1
    var $title = $('.category-tile-group .card-title');
    var $text = $('.category-tile-group .card-text');
    var $img = $('.category-tile-group .primary-tile-image');
    var $cta = $('.category-tile-group .category-cta');

    $title.removeAttr('style');
    $text.removeAttr('style');
    $img.removeAttr('style');
    $cta.removeAttr('style');

    utils.syncHeights($title);
    utils.syncHeights($text);
    utils.syncHeights($img);
    utils.syncHeights($cta);
};

module.exports = function () {
    if ($('.category-tile-group').length) {
        imagesloaded(function () {
            handleHomeCatTile();
        });

        utils.smartResize(function () {
            handleHomeCatTile();
        });
    }
};
