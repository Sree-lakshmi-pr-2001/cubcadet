/* eslint-disable no-undef */
'use strict';

var base = module.superModule;
var Site = require('dw/system/Site');
var BasketMgr = require('dw/order/BasketMgr');
var ArrayList = require('dw/util/ArrayList');

/**
 * Get dealer youtube video id
 * @param {string} originalUrl - original youtube url
 * @returns {string} - videoId
 */
function getDealerYoutubeVideoId(originalUrl) {
    var videoId;
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/; // eslint-disable-line
    var match = originalUrl.match(regExp);

    if (match && match[2].length === 11) {
        videoId = match[2];
    } else {
        videoId = 'error';
    }

    return videoId;
}

/**
 * Parse store hours
 * @param {string} hoursString - the store hours in string
 * @returns {array} - the store hours in array
 */
function parseStoreHours(hoursString) {
    var hoursRows = hoursString.split('|');
    var hoursTable = hoursRows.map(function (row) {
        var rowValues = row.split(',');
        return {
            days: rowValues[0],
            time: rowValues[1]
        };
    });
    return hoursTable;
}

/**
 * Render social links template
 * @param {Object} storeObject - the store object
 * @returns {string} - the social links template
 */
function aboutUsSocialLinksTemplate(storeObject) {
    var HashMap = require('dw/util/HashMap');
    var Template = require('dw/util/Template');

    var contextObject = {
        instagramUrl: storeObject.custom.instagram_url ? storeObject.custom.instagram_url : '',
        facebookUrl: storeObject.custom.facebook_url ? storeObject.custom.facebook_url : '',
        twitterUrl: storeObject.custom.twitter_url ? storeObject.custom.twitter_url : '',
        youtubeUrl: storeObject.custom.youtube_url ? storeObject.custom.youtube_url : ''
    };
    var context = new HashMap();
    Object.keys(contextObject).forEach(function (key) {
        context.put(key, contextObject[key]);
    });

    var template = new Template('dealer/socialLinks');
    return template.render(context).text;
}

/**
 * Render product categories list template
 * @param {Object} storeObject - the store object
 * @returns {string} - the social links template
 */
function aboutUsProductCategoriesTemplate(storeObject) {
    var HashMap = require('dw/util/HashMap');
    var Template = require('dw/util/Template');

    var contextObject = {
        productCategories: storeObject.custom.product_categories ? storeObject.custom.product_categories : ''
    };
    var context = new HashMap();
    Object.keys(contextObject).forEach(function (key) {
        context.put(key, contextObject[key]);
    });

    var template = new Template('dealer/productCategories');
    return template.render(context).text;
}

/**
 * @constructor
 * @classdesc The stores model
 * @param {dw.catalog.Store} storeObject - a Store objects
 * @param {Object} parameters - extra parameters
 */
function store(storeObject, parameters) {
    base.call(this, storeObject);
    if (storeObject) {
        // Google Reviews
        this.custom.googleReviewsAve = storeObject.custom.google_reviews_average ? storeObject.custom.google_reviews_average : null;
        this.custom.googleReviewsTotal = storeObject.custom.google_reviews_count ? storeObject.custom.google_reviews_count : null;
        this.custom.googleReviewsUrl = storeObject.custom.google_reviews_url ? storeObject.custom.google_reviews_url : null;

        this.custom.dealerVideo = null; // Dealer Youtube URL
        if (storeObject.custom.elite_dealer_video_url) {
            this.custom.dealerYoutubeVideoId = getDealerYoutubeVideoId(storeObject.custom.elite_dealer_video_url);
        }
        this.custom.dealerImage = null; // Dealer Picture URL
        if (storeObject.custom.dealer_picture_url) {
            this.custom.dealerImage = storeObject.custom.dealer_picture_url.URL.toString();
        }
        if (empty(this.custom.dealerImage)) {
            var defaultHeroImage = Site.getCurrent().getCustomPreferenceValue('defaultStoreHeroImage');
            if (defaultHeroImage) {
                this.custom.dealerImage = defaultHeroImage.URL.toString();
            }
        }
        this.custom.dealer_specific_logo_url = null; // Dealer Logo URL
        if (storeObject.custom.dealer_specific_logo_url) {
            this.custom.dealer_specific_logo_url = storeObject.custom.dealer_specific_logo_url.URL.toString();
        }
        this.custom.actualBusinessHours = [];
        var actualBusinessHoursString = storeObject.custom['actual-business-hours'] ? storeObject.custom['actual-business-hours'] : ''; // Actual Business Hours
        if (actualBusinessHoursString.length) {
            this.custom.actualBusinessHours = parseStoreHours(actualBusinessHoursString);
        }
        this.custom.holidayHours = [];
        var holidayHoursString = storeObject.custom.holiday_hours ? storeObject.custom.holiday_hours : ''; // Holiday Store Hours
        if (holidayHoursString.length) {
            this.custom.holidayHours = parseStoreHours(holidayHoursString);
        }
        this.custom.eliteBadgeUrl = storeObject.custom.elite_badge_url ? storeObject.custom.elite_badge_url : ''; // Elite Badge URL
        this.custom.dealerWebsiteUrl = storeObject.custom.dealer_website_url ? storeObject.custom.dealer_website_url : ''; // Website URL
        // About Us
        var aboutUs = storeObject.custom.about_us ? storeObject.custom.about_us.getMarkup() : ''; // About Us html section
        // About Us (social links)
        if (!empty(aboutUs)) {
            var socialLinksMarkup = aboutUsSocialLinksTemplate(storeObject);
            aboutUs = aboutUs.replace('<div class="dealer-aboutus-social-placeholder"></div>', socialLinksMarkup);
        }
        // About Us (product categories)
        if (!empty(aboutUs)) {
            var productCategoriesMarkup = aboutUsProductCategoriesTemplate(storeObject);
            aboutUs = aboutUs.replace('<div class="dealer-aboutus-products-list-placeholder"></div>', productCategoriesMarkup);
        }
        this.custom.aboutUs = aboutUs;
        this.custom.aboutUs = aboutUs;
        // Enable dealer minisite
        this.custom.dealerMinisiteEnabled = storeObject.custom.dealer_minisite_enabled ? storeObject.custom.dealer_minisite_enabled : false;
        this.custom.retailer_id = storeObject.custom.retailer_id ? enumToArray(storeObject.custom.retailer_id) : '';
    }

    // Data for Dealer Selector Modal
    if (parameters && parameters.isDealerSelectorModal) {
        if (parameters.storeDistanceDictionary) {
            this.googleDistance = parameters.storeDistanceDictionary[this.ID];
        }
        if (parameters && parameters.availableStoreDictionary) {
            var availableStoreData = parameters.availableStoreDictionary[this.ID];
            if (availableStoreData) {
                this.estimatedDelivery = availableStoreData.dealerDeliveryTime;
                this.estimatedPickup = availableStoreData.pickUpTime;
            }
        }
    }
    var currentBasket = BasketMgr.getCurrentBasket();
    this.isCartEmpty = true;
    if (currentBasket) {
        if (currentBasket.allProductLineItems.length > 0) {
            this.isCartEmpty = false;
        }
    }

    // Learn More
    this.custom.learnMore = storeObject.custom.learn_more ? storeObject.custom.learn_more : '';

    // News
    if (storeObject.custom.news) {
        var newsArray = new ArrayList(storeObject.custom.news);
        this.custom.newsAssetList = newsArray;
    }

    // Social Media Links
    this.custom.twitterLink = storeObject.custom.twitter_url ? storeObject.custom.twitter_url : '';
    this.custom.youtubeLink = storeObject.custom.youtube_url ? storeObject.custom.youtube_url : '';
    this.custom.instaLink = storeObject.custom.instagram_url ? storeObject.custom.instagram_url : '';
    this.custom.facebookLink = storeObject.custom.facebook_url ? storeObject.custom.facebook_url : '';
}

function enumToArray(attributeValues) {
    var arrayValues = [];
    for (var i = 0, l = attributeValues.length; i < l; i++) { // eslint-disable-line dot-notation
        var attribute = attributeValues[i]; // eslint-disable-line dot-notation
        arrayValues.push(attribute);
    }
    return arrayValues;
}

module.exports = store;
