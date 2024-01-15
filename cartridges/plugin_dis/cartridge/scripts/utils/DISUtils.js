'use strict';
var ArrayList = require('dw/util/ArrayList');
var StringUtils = require('dw/util/StringUtils');
var Product = require('dw/catalog/Product');
var ProductVariationAttributeValue = require('dw/catalog/ProductVariationAttributeValue');
var URLUtils = require('dw/web/URLUtils');

var utils = require('./ScriptUtils');
var pUtil = require('*/cartridge/scripts/utils/ImageConfiguration');

/**
 * Set of functions used to validate the presets to make sure sane values are used
 */
var optionParamValid = { // TODO : Put min/max values into separate config file (presets?)
    isNumber: function (value) {
        return typeof value === 'number';
    },
    isString: function (value) {
        return typeof value === 'string';
    },
    scaleWidth: function (option) {
        return (this.isNumber(option) && option > pUtil.getParamDefault('scaleMin') && option < pUtil.getParamDefault('scaleMax'));
    },
    scaleHeight: function (option) {
        return (this.isNumber(option) && option > pUtil.getParamDefault('scaleMin') && option < pUtil.getParamDefault('scaleMax'));
    },
    scaleMode: function (option) {
        return (this.isString(option) && /^fit|cut/.test(option));
    },
    overlayX: function (option) {
        return (this.isNumber(option) && option > pUtil.getParamDefault('overlayMin'));
    },
    overlayY: function (option) {
        return (this.isNumber(option) && option > pUtil.getParamDefault('overlayMin'));
    },
    imageURI: function (option) {
        return (this.isString(option) && utils.validateURL(option));
    },
    cropX: function (option) {
        return (this.isNumber(option) && option > pUtil.getParamDefault('cropCoords'));
    },
    cropY: function (option) {
        return (this.isNumber(option) && option > pUtil.getParamDefault('cropCoords'));
    },
    cropWidth: function (option) {
        return (this.isNumber(option) && option > pUtil.getParamDefault('cropMin'));
    },
    cropHeight: function (option) {
        return (this.isNumber(option) && option > pUtil.getParamDefault('cropMin'));
    }
};

/**
 * Takes in preset name and returns object containing the preset data.
 * If an invalid preset name is giving the first preset value on the list is
 * returned by default.
 * @param {string} preset - String specifying the preset data to get
 * @returns {Object} containing the specified preset data.
 */
exports.getPreset = function (preset) {
    return pUtil.getPreset(preset);
};

/**
 * Takes a set of options to transform the image and outputs a validated set of options along
 * with some defaults if necessary
 * @param {Object} options - Set of parameters
 * @returns {Object} containing the valid DIS image parameters.
 */
exports.createDISParams = function (options) {
    var imageParams = {};
    var validParams = new ArrayList(
            'scaleWidth', 'scaleHeight', 'scaleMode', 'overlayX', 'overlayY', 'imageURI',
            'cropX', 'cropY', 'cropWidth', 'cropHeight', 'format').iterator();

    // check if we are starting with a preset and set up parameters
    if ('viewType' in options) {
        imageParams = pUtil.getPreset(options.viewType);
        imageParams.viewType = options.viewType;
    } else {
        imageParams = pUtil.getPreset('default');
        imageParams.viewType = 'large';
    }

    while (validParams.hasNext()) {
        var param = validParams.next();
        if (param in options && optionParamValid[param](options[param])) {
            imageParams[param] = options[param];
        }
    }

    return imageParams;
};

/**
 * Takes a MediaFile object along with several different options and returns
 * an object that contains the image attributes of the MediaFile
 * @param {dw.content.MediaFile} image The MediaFile to use
 * @param {Object} options The transformation options
 * @param {string} alt The image alt text
 * @param {string} title The image title text
 * @returns {Object} containing the image's attributes
 */
exports.createImageObject = function (image, options, alt, title) {
    var imageObj = null;
    if (image && options) {
        var imageAlt = '';
        var imageTitle = '';

        if (typeof alt === 'string') {
            imageAlt = alt;
        } else if ('alt' in image && typeof image.alt === 'string') {
            imageAlt = image.alt;
        }

        if (typeof title === 'string') {
            imageTitle = title;
        } else if ('title' in image && typeof image.title === 'string') {
            imageTitle = image.title;
        }

        imageObj = {
            url: image.getAbsImageURL(options).toString(),
            alt: StringUtils.encodeString(imageAlt, StringUtils.ENCODE_TYPE_HTML),
            title: StringUtils.encodeString(imageTitle, StringUtils.ENCODE_TYPE_HTML),
            getURL: function () {
                return this.url;
            },
            getTitle: function () {
                return this.title;
            },
            getAlt: function () {
                return this.alt;
            }
        };
    }
    return imageObj;
};

/**
 * Creates a placeholder object for product containers that do not have an associated image
 * @param {Object} options The transformation options
 * @param {Object} source The image source
 * @param {string} url The URL for the image
 * @param {string} alt The image alt text
 * @param {string} title The image title text
 * @returns {Object} containing the placeholder attributes
 */
exports.createImagePlaceHolderObject = function (options, source, url, alt, title) {
    // Create the image title based on the given title or source
    var imageTitle = '';

    // Use the title if one was given
    if (typeof title === 'string') {
        imageTitle = StringUtils.encodeString(title, StringUtils.ENCODE_TYPE_HTML);
        // Otherwise use the information on the source to fill in the title
    } else if (this.source instanceof Product) {
        imageTitle = StringUtils.encodeString(this.source.name, StringUtils.ENCODE_TYPE_HTML);
    } else if (this.source instanceof ProductVariationAttributeValue) {
        imageTitle = StringUtils.encodeString(this.source.displayValue, StringUtils.ENCODE_TYPE_HTML);
    }

    // Create the image alt based on the given alt or source
    var imageAlt = '';

    // Use the title if one was given
    if (typeof alt === 'string') {
        imageAlt = StringUtils.encodeString(title, StringUtils.ENCODE_TYPE_HTML);
        // Otherwise use the information on the source to fill in the title
    } else if (this.source instanceof Product) {
        imageAlt = StringUtils.encodeString(this.source.name, StringUtils.ENCODE_TYPE_HTML);
    } else if (this.source instanceof ProductVariationAttributeValue) {
        imageAlt = StringUtils.encodeString(this.source.displayValue, StringUtils.ENCODE_TYPE_HTML);
    }

    return {
        url: typeof url === 'string' ? url : URLUtils.absImage('/images/noimagelarge.png', options),
        title: imageTitle,
        alt: imageAlt,
        getURL: function () {
            return this.url;
        },
        getTitle: function () {
            return this.title;
        },
        getAlt: function () {
            return this.alt;
        }
    };
};
