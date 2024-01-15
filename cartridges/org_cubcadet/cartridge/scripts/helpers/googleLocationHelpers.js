'use strict';
/* global request */
var Logger = require('dw/system/Logger');
var SecureEncoder = require('dw/util/SecureEncoder');

/**
 * get lat and long for location
 * @param {string} zipCode - zip code / postal code
 * @param {string} country -country code
 * @returns {json} lat long location
 */
function convertZipcodeToLocation(zipCode, country) {
    var Site = require('dw/system/Site');
    var googleGeoCodingUrl = 'https://maps.googleapis.com/maps/api/geocode/json?key=' + Site.getCurrent().getCustomPreferenceValue('googleGeocodingAPIKey');

    var HTTPClient = require('dw/net/HTTPClient');
    var locationResults = null;

    try {
        var httpClient = new HTTPClient();

        var googleURL = googleGeoCodingUrl + '&components=country:' + SecureEncoder.forUriComponent(country) + '%7Cpostal_code:' + SecureEncoder.forUriComponent(zipCode);
        Logger.debug(googleURL);
        httpClient.setTimeout(3000);
        httpClient.open('GET', googleURL);
        httpClient.setRequestHeader('Content-Type', 'application/json');
        httpClient.send();

        var text = httpClient.text;
        Logger.debug(text);
        if (text) {
            var jsonText = JSON.parse(text);
            if (jsonText.results && jsonText.results.length > 0 && jsonText.results[0].geometry && jsonText.results[0].geometry.location) {
                locationResults = {};
                locationResults.longitude = jsonText.results[0].geometry.location.lng;
                locationResults.latitude = jsonText.results[0].geometry.location.lat;
            }
        } else {
            Logger.error('httpClient text was null');
        }
    } catch (ex) {
        Logger.error(ex);
    }

    return locationResults;
}

module.exports = exports = {
    convertZipcodeToLocation: convertZipcodeToLocation
};
