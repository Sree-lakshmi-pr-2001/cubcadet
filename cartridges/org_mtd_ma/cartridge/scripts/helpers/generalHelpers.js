'use strict';
var Site = require('dw/system/Site');

/**
 * Checks the site ID to deterimine if tiles should show
 * This is for sites that do not sell online
 * @returns {boolean} show unavailable tile
 */
function showUnavailableTiles() {
    var sitesToShowOOSTiles = ['cubcadetca'];
    var currentSite = Site.getCurrent().ID;
    return sitesToShowOOSTiles.indexOf(currentSite) > -1;
}


module.exports = {
    showUnavailableTiles: showUnavailableTiles
};
