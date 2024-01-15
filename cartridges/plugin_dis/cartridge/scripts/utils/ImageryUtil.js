'use strict';
var ArrayList = require('dw/util/ArrayList');
var Product = require('dw/catalog/Product');
var ProductVariationModel = require('dw/catalog/ProductVariationModel');
var ProductVariationAttributeValue = require('dw/catalog/ProductVariationAttributeValue');

var pUtil = require('./ProductUtils');
var config = require('*/cartridge/scripts/utils/ImageConfiguration.js');

/**
 * Create a new Imagery object
 *
 * @constructor
 * @param {Object} source - Product type that contains the references to the set of images
 * @param {string} viewType - (optional) The view type used to retrieve a set of images other than the default. Normally this would be set in the presets configuration
 */
function Imagery(source, viewType) {
    /** Reference to the DISUtils object methods/attributes */
    this.disUtil = require('./DISUtils.js');
    /** Reference to the ImageConfiguration object methods/attributes */
    this.configUtil = config;
    /** Product type that contains the references to the set of images */
    this.source = source;
    /** The view type used to retrieve a set of images other than the default. */
    this.viewType = viewType;
    /** The set of images retrieved from the product container by view type */
    this.images = {};
    /** The site ID used to retrieve the site specific images */
    this.siteId = dw.system.Site.getCurrent().getID();
}

/**
 * Retrieves an image based on the given preset and optional index
 *
 * @param {string} preset - size of the image that should be returned
 * @param {number} imgIndex - index of the image to retrieve from the full set
 * @returns {Object} The object representing the image
 */
Imagery.prototype.getImage = function (preset, imgIndex) {
    var presetOptions = this.configUtil.getPreset(preset) || {};
    var images = this.getImagesByViewType(presetOptions.viewType);
    var index = (imgIndex && imgIndex < images.getLength()) ? imgIndex : 0;
    var image;

    if (images.length > 0) {
        image = this.disUtil.createImageObject(images[index], presetOptions);
    } else {
        image = this.disUtil.createImagePlaceHolderObject(presetOptions, this.source);
    }

    // Return the image if found or create a place holder image
    return image;
};

/**
 * Retrieves an ArrayList of images based on the given preset
 * @param {string} preset - size of the images that should be returned
 * @returns {dw.util.ArrayList} An ArrayList of images
 */
Imagery.prototype.getImages = function (preset) {
    var presetOptions = this.configUtil.getPreset(preset) || {};
    var imgIter = this.getImagesByViewType(presetOptions.viewType).iterator();
    var imgObjs = new ArrayList();

    // Create the list of image objects based on the set of images returned from the product container
    while (imgIter.hasNext()) {
        var image = imgIter.next();
        var img = this.disUtil.createImageObject(image, presetOptions);
        if (img !== null) {
            imgObjs.add1(img);
        }
    }

    // If no images were found create a place holder to show instead and add it to the list
    if (imgObjs.length < 1) {
        imgObjs.add1(this.disUtil.createImagePlaceHolderObject(this.configUtil.getPreset(preset), this.source));
    }

    return imgObjs;
};

/**
 * Retrieves an ArrayList of images for the specified view type and source (source is the product/attribute container that stores a reference to the images)
 * @param {string} viewType - the folder in which the desired images are stored (e.g. large, medium, small, swatch, etc.)
 * @returns {dw.util.ArrayList} The ArrayList of images
 */
Imagery.prototype.getImagesByViewType = function (viewType) {
    var imageList = new ArrayList();
    var imageViewType = viewType;
    var viewTypeSiteSpecific = this.configUtil.getViewTypeForSite(this.siteId, viewType);

    // Use the view type given for this specific image set
    if (typeof this.viewType !== 'undefined') {
        imageViewType = this.viewType;
        // Otherwise use the default view type if one wasn't defined in the preset
    } else if (typeof imageViewType === 'undefined') {
        imageViewType = this.configUtil.getParamDefault('viewType');
    }

    // Return the image set for the view type if it has already been built
    if (typeof this.images[imageViewType] !== 'undefined') {
        return this.images[imageViewType];
    }

    // Otherwise build the list of images from the given view type and return it
    if (this.source instanceof Product) {
        imageList.addAll(this.getImagesFromProduct(this.source, imageViewType));
    } else if (this.source instanceof ProductVariationModel || this.source instanceof ProductVariationAttributeValue) {
        var images = this.source.getImages(imageViewType);
        var imagesSiteSpecific = this.source.getImages(viewTypeSiteSpecific);

        if (imagesSiteSpecific.length > 0) {
            images = imagesSiteSpecific;
        }

        imageList.addAll(images);
    }

    this.images[imageViewType] = imageList;
    return imageList;
};

/**
 * Retrieves an ArrayList of images from a Product source
 * @param {dw.catalog.Product} source - the Product that contains the set of images
 * @param {string} viewType - the folder that contains the images tied to the product
 * @returns {dw.util.ArrayList} The ArrayList of images
 */
Imagery.prototype.getImagesFromProduct = function (source, viewType) {
    var list = new ArrayList();
    var imageSource = source;
    var viewTypeSiteSpecific = this.configUtil.getViewTypeForSite(this.siteId, viewType);

    // Update the source to the default variant if a master Product is given
    if (imageSource.master) {
        imageSource = pUtil.getDefaultVariant(imageSource.getVariationModel());
    }

    var images = imageSource.getImages(viewType);
    var imagesSiteSpecific = imageSource.getImages(viewTypeSiteSpecific);

    if (imagesSiteSpecific.length > 0) {
        images = imagesSiteSpecific;
    }

    list.addAll(images);

    // Handle the product set and bundle images differently
    if (imageSource.isProductSet() || imageSource.isBundle()) {
        var iter = imageSource.isProductSet() ? imageSource.getProductSetProducts().iterator() : imageSource.getBundledProducts().iterator();

        while (iter.hasNext()) {
            var item = iter.next();

            if (item.isMaster()) {
                item = pUtil.getDefaultVariant(item.getVariationModel());
            }

            var temp = item.getImage(viewType, 0);
            if (temp) {
                list.add1(temp);
            }
        }
    }

    return list;
};

/**
 * Retrieve a new Imagery object
 * @param {Object} source - Product type that contains the references to the set of images
 * @param {string} viewType - (optional) The view type used to retrieve a set of images other than the default. Normally this would be set in the presets configuration
 * @returns {Imagery} The object with the image data
 */
exports.getImagery = function (source, viewType) {
    return new Imagery(source, viewType);
};
