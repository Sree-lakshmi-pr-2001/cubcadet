'use strict';

/**
 * Controller that is called to show examples of DIS usage.
 *
 * @module controllers/DISUtil
 */

/* API Includes */
var ProductMgr = require('dw/catalog/ProductMgr');

/* Script Modules */
var app = require('app_storefront_controllers/cartridge/scripts/app');
var guard = require('app_storefront_controllers/cartridge/scripts/guard');

/**
 * Renders the example template
 */
function example() {
    if (System.getInstanceType() === System.PRODUCTION_SYSTEM) {
        return next();
    }
    var product = ProductMgr.getProduct('25518058');
    var variant = ProductMgr.getProduct('701642823568');
    var attribute = product.getVariationModel().getProductVariationAttribute('color');
    var iter = product.getVariationModel().getAllValues(attribute).iterator();
    var value;

    while (iter.hasNext()) {
        var item = iter.next();

        if (item.getID() === 'JJ5QZXX') {
            value = item;
            break;
        }
    }

    app.getView({
        Product: product,
        Variant: variant,
        VariationValue: value
    }).render('test/examples');
}

/*
 * Web exposed methods
 */
/** Called to show examples of DIS usage.
 * @see module:controllers/DISUtil~example */
exports.Example = guard.all(example);
