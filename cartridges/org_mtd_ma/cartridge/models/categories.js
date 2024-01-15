'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var URLUtils = require('dw/web/URLUtils');

/**
 * Get category url
 * @param {dw.catalog.Category} category - Current category
 * @returns {string} - Url of the category
 */
function getCategoryUrl(category) {
    return category.custom && 'alternativeUrl' in category.custom && category.custom.alternativeUrl
        ? category.custom.alternativeUrl
        : URLUtils.url('Search-Show', 'cgid', category.getID()).toString();
}

/**
 * Converts a given category from dw.catalog.Category to plain object
 * @param {dw.catalog.Category} category - A single category
 * @returns {Object} plain object that represents a category
 */
function categoryToObject(category) {
    if (!category.custom || !category.custom.showInMenu) {
        return null;
    }
    var result = {
        name: category.getDisplayName(),
        url: getCategoryUrl(category),
        id: category.ID,
        layoutType: ('layoutType' in category.custom && category.custom.layoutType && category.custom.layoutType.value) ? category.custom.layoutType.value : '',
        menuCardText: 'menuCardText' in category.custom ? category.custom.menuCardText : '',
        menuCardLinkText: 'menuCardLinkText' in category.custom ? category.custom.menuCardLinkText : '',
        promoAsset: 'promoAsset' in category.custom ? category.custom.promoAsset : '',
        image: category.image,
        menuCardSVG: 'menuCardSVG' in category.custom ? category.custom.menuCardSVG : ''
    };
    var subCategories = category.hasOnlineSubCategories() ?
            category.getOnlineSubCategories() : null;

    if (subCategories) {
        collections.forEach(subCategories, function (subcategory) {
            var converted = null;
            if (subcategory.hasOnlineProducts() || subcategory.hasOnlineSubCategories() || subcategory.custom.alternativeUrl) {
                converted = categoryToObject(subcategory);
            }
            if (converted) {
                if (!result.subCategories) {
                    result.subCategories = [];
                }
                result.subCategories.push(converted);
            }
        });
        if (result.subCategories) {
            result.complexSubCategories = result.subCategories.some(function (item) {
                return !!item.subCategories;
            });
        }
    }

    return result;
}


/**
 * Represents a single category with all of it's children
 * @param {dw.util.ArrayList<dw.catalog.Category>} items - Top level categories
 * @constructor
 */
function categories(items) {
    this.categories = [];
    collections.forEach(items, function (item) {
        if (item.custom && item.custom.showInMenu &&
                (item.hasOnlineProducts() || item.hasOnlineSubCategories())) {
            this.categories.push(categoryToObject(item));
        }
    }, this);
}

module.exports = categories;
