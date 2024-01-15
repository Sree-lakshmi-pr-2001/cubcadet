'use strict';

/**
 * If there is an api key creates the url to include the google maps api else returns null
 * @returns {string|Null} return the api
 */
function getGoogleMapsApi() {
    var Site = require('dw/system/Site');
    var apiKey = Site.getCurrent().getCustomPreferenceValue('mapAPI');
    var mapID = Site.getCurrent().getCustomPreferenceValue('mapID');
    var googleMapsApi;

    if (apiKey) {
        googleMapsApi = 'https://maps.googleapis.com/maps/api/js?key=' + apiKey + '&map_ids=' + mapID;
    } else {
        googleMapsApi = null;
    }

    return googleMapsApi;
}

/**
 * returns a google maps key
 * @returns {string|Null} return the api
 */
function getGoogleMapsID() {
    var Site = require('dw/system/Site');
    var mapID = Site.getCurrent().getCustomPreferenceValue('mapID');
    var googleMapsID;

    if (mapID) {
        googleMapsID = mapID;
    } else {
        googleMapsID = null;
    }

    return googleMapsID;
}

module.exports = exports = {
    getGoogleMapsApi: getGoogleMapsApi,
    getGoogleMapsID: getGoogleMapsID
};
