'use strict';

var Site = require('dw/system/Site');

var base = module.superModule;

/**
 * @constructor
 * @classdesc The stores model
 * @param {dw.catalog.Store} storeObject - a Store objects
 */
function store(storeObject) {
    base.call(this, storeObject);
    if (storeObject) {
        // maintain custom property for consistent checking in templates
        this.custom = {};

        this.custom.logoImage = null;
        if (storeObject.custom.logoImage) {
            this.custom.logoImage = storeObject.custom.logoImage.URL.toString();
        } else {
            var defaultLogoImage = Site.getCurrent().getCustomPreferenceValue('defaultStoreLogoImage');
            if (defaultLogoImage) {
                this.custom.logoImage = defaultLogoImage.URL.toString();
            }
        }
    }
}

module.exports = store;
