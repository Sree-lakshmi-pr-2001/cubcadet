'use strict';

/**
 * Builds out the JSON for a content asset to pass into the service
 * @param {string} contentAssetID - The asset ID that we be used in the model
 * @param {string} html - HTML to be saved in the content asset
 * @param {string} locale - locale of the asset
 * @returns {Object} - data built to service schema
 */
function ContentAssetModel(contentAssetID, html, locale, siteId) {
    this['id'] = contentAssetID;
    // localized values
    this.name = {};
    this['name'][locale] = contentAssetID;
    this.c_body = {};
    this['c_body'][locale] = {
        'source': html
    };
    // site specific values
    this.online = {};
    this['online'][siteId] = true;
    this.searchable = {};
    this['searchable'][siteId] = false;
}

ContentAssetModel.prototype.setName = function (name, locale) {
    this.name = {};
    this['name'][locale] = name;
};

module.exports = ContentAssetModel;
