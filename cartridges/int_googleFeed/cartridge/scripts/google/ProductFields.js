/**
* Description of the module and the logic it provides
*
* @module cartridge/scripts/google/ProductFields
*/

'use strict';

var URLUtils = require('dw/web/URLUtils'),
    StringUtils = require('dw/util/StringUtils'),
    Calendar = require('dw/util/Calendar'),
    ProductImageDIS = require('*/cartridge/scripts/helpers/ProductImageDIS'),
    noImage = URLUtils.httpsStatic('/images/noimage.png').toString();

var ProductFields = {
    Helper: null,
    id: function (p) {
        return p.ID;
    },

    /**
     * Product Title
     * @param {p} : dw.catalog.Product
     * @returns {value} : String
     */
    title: function (p) {
        var title = '';
        if ('googleProductFeedName' in p.custom && !empty(p.custom.googleProductFeedName)) {
            title = p.custom.googleProductFeedName;
        } else {
            title = p.name;
        }
        return title;
    },

    /**
     * Product Description
     * @param {p} : dw.catalog.Product
     * @returns {value} : String
     */
    description: function (p) {
        if ('googleProductFeedDescription' in p.custom && !empty(p.custom.googleProductFeedDescription)){
            return p.custom.googleProductFeedDescription;
        } else if (!empty(p.shortDescription)) {
            return p.shortDescription.toString();
        }
        return '';
    },

    /**
     * Product URL
     * @param {p} : dw.catalog.Product
     * @returns {value} : String
     */
    link: function (p) {
        return URLUtils.abs('Product-Show', 'pid', p.ID).toString();
    },

    /**
     * Product Url for mobile devices
     * @param {p} : dw.catalog.Product
     * @returns {value} : String
     */
    mobile_link: function (p) {
        return URLUtils.abs('Product-Show', 'pid', p.ID).toString();
    },

    /**
     * Product Price
     * @param {p} : dw.catalog.Product
     * @returns {value} : String
     */
    price: function (p) {
        var StandardPrice = dw.value.Money.NOT_AVAILABLE,
            PriceModel = p.priceModel;

        if (!empty(PriceModel)) {
            if (!PriceModel.getPrice().available) {
                StandardPrice = dw.value.Money.NOT_AVAILABLE;
            } else {
                var priceBook = PriceModel.priceInfo.priceBook;

                while (priceBook.parentPriceBook) {
                    priceBook = priceBook.parentPriceBook ? priceBook.parentPriceBook : priceBook;
                }

                StandardPrice = PriceModel.getPriceBookPrice(priceBook.ID);
            }
        }

        if (!StandardPrice.equals(dw.value.Money.NOT_AVAILABLE)
                && !session.getCurrency().getCurrencyCode().equals(StandardPrice.getCurrencyCode())) {
            StandardPrice = dw.value.Money.NOT_AVAILABLE;
        }

        return StandardPrice.getValue() + '';
    },

    /**
     * Product Sale Price
     * @param {p} : dw.catalog.Product
     * @returns {value} : String
     */
    sale_price: function (p) {
        return p.priceModel.getPrice().getValue() + '';
    },

    /**
     * Google Category
     * @param {p} : dw.catalog.Product
     * @returns {value} : String
     */
    google_product_category: function (p) {
        var googleProductCategory = '';
        if (p.primaryCategory != null && 'googleFeedCategory' in p.primaryCategory.custom
                && !empty(p.primaryCategory.custom.googleFeedCategory)) {
            googleProductCategory = p.primaryCategory.custom.googleFeedCategory;
        } else if ('googleProductFeedCategory' in p.custom && !empty(p.custom.googleProductFeedCategory)) {
            googleProductCategory = p.custom.googleProductFeedCategory;
        }
        return googleProductCategory;
    },

    /**
     * Product Brand
     * @param {p} : dw.catalog.Product
     * @returns {value} : String
     */
    brand: function (p) {
        var brand = ProductFields.Helper.defaults.brandName;
        if (!empty(p.brand)) {
            brand = p.brand;
        }
        return brand;
    },

    /**
     * Product condition
     * @param {p} : dw.catalog.Product
     * @returns {value} : String
     */
    condition: function (p) {
        var condition = 'new';
        if ('googleProductFeedCondition' in p.custom && !empty(p.custom.googleProductFeedCondition)) {
            condition = p.custom.googleProductFeedCondition;
        }
        return condition;
    },

    /**
     * Product Main Image
     * @param {p} : dw.catalog.Product
     * @returns {value} : String
     */
    image_link: function (p) {
        var image = new ProductImageDIS(p, 'large');
        return image.getHttpsURL();
    },

    /**
     * Product Additional image
     * @param {p} : dw.catalog.Product
     * @returns {value} : String
     */
    additional_image_link: function (p) {
        var image = new ProductImageDIS(p, 'large', 1);
        return image.getHttpsURL();
    },

    /**
     * Product swatch image
     * @param {p} : dw.catalog.Product
     * @returns {value} : String
     */
    swatch_image_link: function (p) {
        /*var image = p.getImage('swatch');
        if (!image) {
            return noImage;
        } else {
            return image.httpsURL;
        }*/
        var image = new ProductImageDIS(p, 'swatch');
        return image.getHttpsURL();
    },

    /**
     * Product Type
     * @param {p} : dw.catalog.Product
     * @returns {value} : String
     */
    product_type: function (p) {
        var type = '';
        if ('googleProductFeedType' in p.custom && !empty(p.custom.googleProductFeedType)) {
            type = p.custom.googleProductFeedType;
        } else {
            type = ProductFields.Helper.getCategoryPath(p);
        }
        return type;
    },

    /**
     * Product Size
     * @param {p} : dw.catalog.Product
     * @returns {value} : String
     */
    size: function (p) {
        var size = '';
        if ('size' in p.custom && !empty(p.custom.size)) {
            size = p.custom.size;
        }
        return size;
    },

    /**
     * Product availability
     * @param {p} : dw.catalog.Product
     * @returns {value} : String
     */
    availability: function (p) {
        var quantity = 0,
            record = dw.catalog.ProductInventoryMgr.getInventoryList().getRecord(p),
            availability = 'out of stock';

        if (!empty(record)) {
            quantity = record.getATS().getValue();
        }

        if (quantity >= 1) {
            availability = 'in stock';
        }
        return availability;
    },

    /**
     * Product Availability Date
     * @param {p} : dw.catalog.Product
     * @returns {value} : String
     */
    availability_date: function (p) {
        var timezoneOffset = (dw.system.Site.getCurrent().getTimezoneOffset() / (60 * 60 * 1000)).toString(),
            calendar = new Calendar(),
            availabilityDate = '';

            calendar.setTimeZone(dw.system.System.getInstanceTimeZone());

        if (p.onlineFrom != null && p.onlineFrom > calendar.getTime()) {
            timezoneOffset = ("0000" + timezoneOffset).substr(-4, 4);
            availabilityDate = StringUtils.formatCalendar(new Calendar(p.onlineFrom), "YYYY-MM-dd'T'HH:mm-" + timezoneOffset);
        }
        return availabilityDate;
    },

    /**
     * MPN
     * @param {p} : dw.catalog.Product
     * @returns {value} : String
     */
    mpn: function (p) {
        return p.variant?p.masterProduct.ID: p.ID;
    },

    /**
     * GTIN
     * @param {p} : dw.catalog.Product
     * @returns {value} : String
     */
    gtin: function (p) {
        var gtin = '';
        if (!empty(p.getUPC())) {
            var gtin = p.getUPC();
        }
        return gtin;
    },

    /**
     * Product ID
     * @param {p} : dw.catalog.Product
     * @returns {value} : String
     */
    prd_id: function (p) {
        return p.ID;
    },
    
    /**
     * Promotion ID
     * @param {p} : dw.catalog.Product
     * @returns {value} : String
     */
    promotion_id: function(p) {
        var promotionId = 'new';
        if ('googleProductFeedPromoID' in p.custom && !empty(p.custom.googleProductFeedPromoID)) {
            promotionId = p.custom.googleProductFeedPromoID;
        }
        return promotionId;
    }
}

module.exports = ProductFields;