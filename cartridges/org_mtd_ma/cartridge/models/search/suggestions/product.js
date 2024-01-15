'use strict';

var URLUtils = require('dw/web/URLUtils');
var ACTION_ENDPOINT = 'Product-Show';
var IMAGE_SIZE = 'mini-line-item'; // 125x125 preset
var ImageModel = require('*/cartridge/models/product/productImages');
var pricingHelper = require('*/cartridge/scripts/helpers/pricing');
var money = require('dw/value/Money');
var DefaultPrice = require('*/cartridge/models/price/default');
var RangePrice = require('*/cartridge/models/price/range');


/**
 * Get Image URL
 *
 * @param {dw.catalog.Product} product - Suggested product
 * @return {string} - Image URL
 */
function getImageUrl(product) {
    var imageProduct = product;
    if (product.master) {
        imageProduct = product.variationModel.defaultVariant;
    }
    var imageData = new ImageModel(imageProduct, { types: [IMAGE_SIZE], quantity: 'single' });
    return imageData[IMAGE_SIZE][0].url;
}

/**
 * Get list price for a suggested product
 *
 * @param {dw.catalog.ProductPriceModel} priceModel - Suggested Product price model
 * @return {dw.value.Money} - List price
 */
function getListPrice(priceModel) {
    var price = money.NOT_AVAILABLE;
    var priceBook;
    var priceBookPrice;

    if (priceModel.price.valueOrNull === null && priceModel.minPrice) {
        return { minPrice: priceModel.minPrice, maxPrice: priceModel.maxPrice };
    }

    priceBook = pricingHelper.getRootPriceBook(priceModel.priceInfo.priceBook);
    priceBookPrice = priceModel.getPriceBookPrice(priceBook.ID);

    if (priceBookPrice.available) {
        return { minPrice: priceBookPrice };
    }

    price = { minPrice: (priceModel.price.available ? priceModel.price : priceModel.minPrice), maxPrice: priceModel.maxPrice };

    return price;
}

/**
 * Get price for a suggested product
 *
 * @param {dw.catalog.ProductPriceModel} priceModel - Suggested Product price model
 * @returns {Object} - price for a suggested product
 */
function getPrice(priceModel) {
    var salePrice = { minPrice: priceModel.minPrice, maxPrice: priceModel.maxPrice };
    var listPrice = getListPrice(priceModel);

    if (salePrice.minPrice.value !== salePrice.maxPrice.value) {
        // range price
        return new RangePrice(salePrice.minPrice, salePrice.maxPrice);
    }
    if (listPrice.minPrice && listPrice.minPrice.valueOrNull !== null) {
        if (listPrice.minPrice.value !== salePrice.minPrice.value) {
            return new DefaultPrice(salePrice.minPrice, listPrice.minPrice);
        }
    }
    return new DefaultPrice(salePrice.minPrice);
}

/**
 * Compile a list of relevant suggested products
 *
 * @param {dw.util.Iterator.<dw.suggest.SuggestedProduct>} suggestedProducts - Iterator to retrieve
 *                                                                             SuggestedProducts
*  @param {number} maxItems - Maximum number of products to retrieve
 * @return {Object[]} - Array of suggested products
 */
function getProducts(suggestedProducts, maxItems) {
    var product = null;
    var products = [];

    for (var i = 0; i < maxItems; i++) {
        if (suggestedProducts.hasNext()) {
            product = suggestedProducts.next().productSearchHit.product;
            products.push({
                name: product.name,
                productName2: product.custom.productName2,
                price: getPrice(product.priceModel),
                productSet: product.productSet,
                imageUrl: getImageUrl(product),
                url: URLUtils.url(ACTION_ENDPOINT, 'pid', product.ID)
            });
        }
    }

    return products;
}

/**
 * @typedef SuggestedPhrase
 * @type Object
 * @property {boolean} exactMatch - Whether suggested phrase is an exact match
 * @property {string} value - Suggested search phrase
 */

/**
 * Compile a list of relevant suggested phrases
 *
 * @param {dw.util.Iterator.<dw.suggest.SuggestedPhrase>} suggestedPhrases - Iterator to retrieve
 *                                                                           SuggestedPhrases
 * @param {number} maxItems - Maximum number of phrases to retrieve
 * @return {SuggestedPhrase[]} - Array of suggested phrases
 */
function getPhrases(suggestedPhrases, maxItems) {
    var phrase = null;
    var phrases = [];

    for (var i = 0; i < maxItems; i++) {
        if (suggestedPhrases.hasNext()) {
            phrase = suggestedPhrases.next();
            phrases.push({
                exactMatch: phrase.exactMatch,
                value: phrase.phrase
            });
        }
    }

    return phrases;
}

/**
 * @constructor
 * @classdesc ProductSuggestions class
 *
 * @param {dw.suggest.SuggestModel} suggestions - Suggest Model
 * @param {number} maxItems - Maximum number of items to retrieve
 */
function ProductSuggestions(suggestions, maxItems) {
    var productSuggestions = suggestions.productSuggestions;

    if (!productSuggestions) {
        this.available = false;
        this.phrases = [];
        this.products = [];
        return;
    }

    var searchPhrasesSuggestions = productSuggestions.searchPhraseSuggestions;

    this.available = productSuggestions.hasSuggestions();
    this.phrases = getPhrases(searchPhrasesSuggestions.suggestedPhrases, maxItems);
    this.products = getProducts(productSuggestions.suggestedProducts, maxItems);
}

module.exports = ProductSuggestions;
