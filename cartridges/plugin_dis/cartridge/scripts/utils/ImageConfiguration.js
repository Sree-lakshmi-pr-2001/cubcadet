"use strict";

/* Constants */
var VIEW_TYPE_SUFFIX_CUBCADET = "cubcadet";
var VIEW_TYPE_SUFFIX_TROYBILT = "troybilt";
var VIEW_TYPE_SUFFIX_MTDPARTS = "mtdparts";

/**
 * Object containing all image preset data.
 * Modify based on needs.
 */
var presets = {
    "hi-res": {
        scaleWidth: 1000,
        scaleHeight: 1000,
        scaleMode: "fit"
    },
    large: {
        scaleWidth: 630,
        scaleHeight: 630,
        scaleMode: "fit"
    },
    quickview: {
        scaleWidth: 315,
        scaleHeight: 315,
        scaleMode: "fit"
    },
    medium: {
        scaleWidth: 258,
        scaleHeight: 258,
        scaleMode: "fit"
    },
    small: {
        scaleWidth: 200,
        scaleHeight: 200,
        scaleMode: "fit"
    },
    xsmall: {
        scaleWidth: 88,
        scaleHeight: 88,
        scaleMode: "fit"
    },
    swatch: {
        scaleWidth: 34,
        scaleHeight: 24,
        scaleMode: "fit",
        viewType: "swatch"
    }
};

/**
 * Contains all of the default settings for the DIS image display
 */
var paramDefault = {
    overlayX: 0,
    overlayY: 0,
    imageURI: "",
    cropX: 0,
    cropY: 0,
    cropWidth: 0,
    cropHeight: 0,
    format: "",
    scaleMin: 10,
    scaleMax: 2000,
    overlayMin: 0,
    cropCoords: 0,
    cropMin: 10,
    viewType: "large",
    preset: "small"
};

var siteViewTypeMapping = {
    cubcadet: VIEW_TYPE_SUFFIX_CUBCADET,
    cubcadetca: VIEW_TYPE_SUFFIX_CUBCADET,
    troybilt: VIEW_TYPE_SUFFIX_TROYBILT,
    troybiltca: VIEW_TYPE_SUFFIX_TROYBILT,
    mtdparts: VIEW_TYPE_SUFFIX_MTDPARTS,
    mtdpartsca: VIEW_TYPE_SUFFIX_MTDPARTS
};

/**
 * Takes in preset name and returns object containing the preset data.
 * If an invalid preset name is giving the first preset value on the list is
 * returned by default.
 * @param {string} preset - specifying the preset data to get
 * @return {Object} - containing the specified preset data.
 */
exports.getPreset = function (preset) {
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
exports.getParamDefault = function (value) {
    if (value in paramDefault) {
        return paramDefault[value];
    }

    return null;
};

/**
* Returns the view type for the given site.
* If the site is not found, the original view type is returned.
* The view type is appended with the site suffix
* There is no distinction for the suffix between the US and CA sites.
*
* @param {string} siteID - the site ID
* @param {string} viewType - the view type
* @returns {string} - the view type with the site suffix
*/
exports.getViewTypeForSite = function (siteID, viewType) {
    var siteViewType = siteViewTypeMapping[siteID];

    if (siteViewType) {
        return viewType + "-" + siteViewType;
    }

    return viewType;
};
