"use strict";

var Site = require('dw/system/Site');
var Locale = require('dw/util/Locale');
var Calendar = require('dw/util/Calendar');
var URLUtils = require('dw/web/URLUtils');
var ProductMgr = require('dw/catalog/ProductMgr');
var StringUtils = require("dw/util/StringUtils");

function removeHtmlTagsAndInlineCss(text) {
    if (!text) {
        return "";
    }

    var regexTags = /(<([^>]+)>)/gi;
    var regexStyleTags = /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi;

    var textWithoutStyleTags = text.replace(regexStyleTags, "");
    var textWithoutTags = textWithoutStyleTags.replace(regexTags, "");

    return textWithoutTags;
  }

/**
 * Get product schema information
 * @param {Object} product - Product Object
 *
 * @returns {Object} - Product Schema object
 */
function getProductSchema(product) {
    var apiProduct = ProductMgr.getProduct(product.id);

    if (!apiProduct) {
        return null;
    }

    var fullProductName = product.productName.trim();
    var currentSite = Site.current;
    var productUrl = URLUtils.url('Product-Show', 'pid', product.id).abs().toString();
    var siteLocale = Locale.getLocale(currentSite.getDefaultLocale());

    if (apiProduct.custom.productName2) {
        fullProductName += ' - ' + apiProduct.custom.productName2;
    }

    var schema = {
        '@context'  : 'http://schema.org/',
        '@type'     : 'Product',
        '@id'       : productUrl,
        name        : fullProductName,
        description : removeHtmlTagsAndInlineCss(product.longDescription),
        mpn         : product.id,
        sku         : product.id,
        gtin13      : apiProduct.UPC
    };

    if (apiProduct.brand) {
        schema.brand = {
            '@type' : 'Brand',
            name    : apiProduct.brand
        };
    }

    if (apiProduct.primaryCategory) {
        schema.category = apiProduct.primaryCategory.displayName;
    }

    if (apiProduct.custom["weight-approx"]) {
        var weightValue = apiProduct.custom["weight-approx"].replace(/[^0-9]/g, "");

        schema.weight = {
            "@type": "QuantitativeValue",
            value: weightValue,
            unitCode: "LBR"
        };
    }

    if (apiProduct.custom["available-colors"]) {
        var availableColors = apiProduct.custom["available-colors"].map(function (color) {
            return color;
        });

        if (availableColors.length) {
            schema.color = availableColors;
        }
    }

    if (product.images && product.images.large) {
        schema.image = [];
        product.images.large.forEach(function (image) {
            schema.image.push(image.url);
        });
    }

    if (product.price) {
        schema.offers = {
            url : productUrl,
        };

        if (product.price.type === 'range') {
            schema.offers['@type']      = 'AggregateOffer';
            schema.offers.priceCurrency = product.price.currency;
            schema.offers.lowprice      = product.price.min;
            schema.offers.highprice     = product.price.max;
        } else {
            schema.offers['@type'] = 'Offer';

            if (product.price.sales) {
                var priceOnlineTo = apiProduct.priceModel && apiProduct.priceModel.priceInfo && apiProduct.priceModel.priceInfo.onlineTo;
                var priceValidUntil = new Calendar(priceOnlineTo || new Date());

                if (!priceOnlineTo) {
                    var salesPriceDefaultExpirationDays = currentSite.getCustomPreferenceValue("salesPriceDefaultExpirationDays");

                    priceValidUntil.add(Calendar.DAY_OF_MONTH, salesPriceDefaultExpirationDays);
                }

                schema.offers.priceCurrency   = product.price.sales.currency;
                schema.offers.price           = product.price.sales.decimalPrice;
                schema.offers.priceValidUntil = StringUtils.formatCalendar(priceValidUntil, "yyyy-MM-dd");
            } else if (product.price.list) {
                schema.offers.priceCurrency = product.price.list.currency;
                schema.offers.price         = product.price.list.decimalPrice;
            }
        }

        schema.offers.itemCondition = 'https://schema.org/NewCondition';
        schema.offers.availability = 'http://schema.org/InStock';
        schema.offers.itemOffered = product.isBuyable;

        if (product.available) {
            if (product.availability && product.availability.messages[0] === require('dw/web/Resource').msg('label.preorder', 'common', null)) {
                schema.offers.availability = 'http://schema.org/PreOrder';
            }
        } else {
            schema.offers.availability = 'http://schema.org/OutOfStock';
        }

        schema.offers.shippingDetails = {
            "@type": "OfferShippingDetails",
        }

        schema.offers.shippingDetails.shippingDestination = {
            "@type": "definedRegion",
            addressCountry: siteLocale.getCountry()
        };

        schema.offers.shippingDetails.shippingRate = {
            "@type": "MonetaryAmount",
            currency: product.price.sales.currency
        };

        schema.offers.shippingDetails.deliveryTime = {
            "@type": "shippingDeliveryTime",
            businessDays: {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: [
                    "https://schema.org/Monday",
                    "https://schema.org/Tuesday",
                    "https://schema.org/Wednesday",
                    "https://schema.org/Thursday",
                    "https://schema.org/Friday"
                ],
            },
            cutOffTime: "12:00-05:00",
            handlingTime: {
                "@type": "QuantitativeValue",
                minValue: "1",
                maxValue: "4",
                unitCode: "DAY"
            },
            transitTime: {
                "@type": "QuantitativeValue",
                minValue: "1",
                maxValue: "4",
                unitCode: "DAY"
            }
        };
    }

    return schema;
}

/**
* Returns a BreadcrumbList schema object
* @param {Array|dw.util.Collection} breadcrumbs - the breadcrumbs to be used to create the schema
* @returns {Object} - a BreadcrumbList schema object
*/
function getBreadcrumbsSchema(breadcrumbs) {
    if (!breadcrumbs || breadcrumbs.length === 0) {
        return null;
    }

    var domain = StringUtils.format("{0}://{1}", request.httpProtocol, request.httpHost);
    var items = Array.isArray(breadcrumbs) ? breadcrumbs : breadcrumbs.toArray();

    var itemListElement = items.map(function(item, index) {
        // Checks if the breadcrumbValue.url contains the domain on its value. If not, adds the domain to the url
        // ex: /home -> https://www.storefront.com/home
        var url = item.url.toString();
        var itemUrl = url.indexOf(domain) > -1 ? url : domain + url;

        return {
            "@type": "ListItem",
            position: index + 1,
            item: {
                "@id": itemUrl,
                name: item.htmlValue.trim()
            }
        };
    });

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: itemListElement
    };
}

/**
 * Get product listing page schema information
 * @param {Object} productIds - Product Ids
 *
 * @returns {Object} - Listing Schema object
 */
function getListingPageSchema(productIds) {
    var schema = {
        '@context': 'http://schema.org/',
        '@type': 'ItemList',
        itemListElement: []
    };
    Object.keys(productIds).forEach(function (item) {
        var productID = productIds[item].productID;
        schema.itemListElement.push({
            '@type': 'ListItem',
            position: Number(item) + 1,
            url: URLUtils.abs('Product-Show', 'pid', productID).toString()
        });
    });
    return schema;
}

module.exports = {
    getBreadcrumbsSchema: getBreadcrumbsSchema,
    getProductSchema: getProductSchema,
    getListingPageSchema: getListingPageSchema
};
