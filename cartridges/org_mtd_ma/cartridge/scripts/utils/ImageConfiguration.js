'use strict';

var base = module.superModule;

/* Script Includes */
var assign = require("server/assign");

/**
 * Object containing all image preset data.
 * Modify based on needs.
 */
var presets = {
    // zoom
    'hi-res': {
        scaleWidth: 1000,
        scaleHeight: 1000,
        scaleMode: 'fit'
    },
    // PDP primary image
    large: {
        scaleWidth: 740,
        scaleHeight: 740,
        scaleMode: 'fit'
    },
    // 360 animation
    '360-view': {
        scaleWidth: 1000,
        scaleHeight: 1000,
        scaleMode: 'fit',
        viewType: '360view'
    },
    // bundle and set PDPs
    // TODO: update with Cub Specs
    pdp: {
        scaleWidth: 740,
        scaleHeight: 740,
        scaleMode: 'fit'
    },
    quickview: {
        scaleWidth: 580,
        scaleHeight: 580,
        scaleMode: 'fit'
    },
    medium: {
        scaleWidth: 345,
        scaleHeight: 345,
        scaleMode: 'fit'
    },
    // used on PDPs (mobile)
    small: {
        scaleWidth: 480,
        scaleHeight: 480,
        scaleMode: 'fit'
    },
    // PDP Thumb image
    xsmall: {
        scaleWidth: 70,
        scaleHeight: 70,
        scaleMode: 'fit'
    },
    swatch: {
        scaleWidth: 34,
        scaleHeight: 34,
        scaleMode: 'fit',
        viewType: 'swatch'
    },
    // Custom Cub Presets
    'tile-desktop': {
        scaleWidth: 290,
        scaleHeight: 290,
        scaleMode: 'fit'
    },
    'tile-tablet': {
        scaleWidth: 290,
        scaleHeight: 290,
        scaleMode: 'fit'
    },
    'tile-mobile': {
        scaleWidth: 315,
        scaleHeight: 315,
        scaleMode: 'fit'
    },
    // slider presets
    'slider-tile-desktop': {
        scaleWidth: 280,
        scaleHeight: 280,
        scaleMode: 'fit'
    },
    'slider-tile-mobile': {
        scaleWidth: 138,
        scaleHeight: 138,
        scaleMode: 'fit'
    },
    // compare bar only, compare landing uses tile presets
    'compare-bar-desktop': {
        scaleWidth: 90,
        scaleHeight: 90,
        scaleMode: 'fit'
    },
    'compare-bar-mobile': {
        scaleWidth: 145,
        scaleHeight: 145,
        scaleMode: 'fit'
    },
    // cart line items
    'line-item': {
        scaleWidth: 180,
        scaleHeight: 180,
        scaleMode: 'fit'
    },
    // mini cart line items
    'mini-line-item': {
        scaleWidth: 125,
        scaleHeight: 125,
        scaleMode: 'fit'
    },
    // Troy Blog Presets
    article: {
        scaleWidth: 472,
        scaleHeight: 245,
        scaleMode: 'cut'
    },
    'article-tablet': {
        scaleWidth: 345,
        scaleHeight: 179,
        scaleMode: 'cut'
    },
    'article-mobile': {
        scaleWidth: 345,
        scaleHeight: 179,
        scaleMode: 'cut'
    }
};

/**
 * Contains all of the default settings for the DIS image display
 */
var paramDefault = {
    overlayX: 0,
    overlayY: 0,
    imageURI: '',
    cropX: 0,
    cropY: 0,
    cropWidth: 0,
    cropHeight: 0,
    format: '',
    scaleMin: 10,
    scaleMax: 2000,
    overlayMin: 0,
    cropCoords: 0,
    cropMin: 10,
    viewType: 'large',
    preset: 'small'
};

/**
 * Takes in preset name and returns object containing the preset data.
 * If an invalid preset name is giving the first preset value on the list is
 * returned by default.
 * @param {string} preset - specifying the preset data to get
 * @return {Object} - containing the specified preset data.
 */
function getPreset(preset) {
    if (preset in presets) {
        return presets[preset];
    }

    return presets[Object.keys(presets)[0]];
};

/**
 * Takes in an image display property and returns the default value if the property is present
 * @param {string} value - The property to retrieve
 * @return {string|Object} - The default value of the given property or null if the property isn't found
 */
function getParamDefault(value) {
    if (value in paramDefault) {
        return paramDefault[value];
    }

    return null;
};

module.exports = assign({}, base, {
    getPreset: getPreset,
    getParamDefault: getParamDefault
});
