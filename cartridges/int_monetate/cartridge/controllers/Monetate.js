'use strict';

/**
 * Determines a product based on the given ID.
 *
 * @module controllers/Monetate
 */
var server = require('server');

/**
 * Get monetate product data
 */
server.get('GetProductID', function (req, res, next) {
    var monetateObject = require('~/cartridge/scripts/monetate/libMonetate');
    var Site = require('dw/system/Site');
    var bsHelper = require('org_mtd_ma/cartridge/scripts/utils/ButtonStateHelper');
    var addToCartProductTypes = Site.current.getCustomPreferenceValue('productTileA2CProductTypes');
    var showAddToCartButton = false;
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var showStockMessage = Site.current.getCustomPreferenceValue('productTileStockMsgEnabled');
    var pid = request.httpParameterMap.pid.stringValue;
    var buttonStates = bsHelper.getStates(pid);
    var  mtdProducValue = mProduct.primaryCategoryAssignment.product.custom['product-type'].value;
    addToCartProductTypes.forEach(function (type) {
        if (type.value === mtdProducValue) {
            showAddToCartButton = true;
            return;
        }
    });
    if(buttonStates) {
        res.cachePeriod = 24;
        res.cachePeriodUnit = 'hours'; 
    }
    if(showAddToCartButton || showStockMessage) {
        res.cachePeriod = 3;
        res.cachePeriodUnit = 'minutes';
    }
    if (request.httpHeaders['x-is-requestid'].indexOf('-0-00') !== -1){
        throw new Error('Guard(s) \'include\' did not match the incoming request.');
    }
    var mProduct,
        type;
    if (pid) {
        mProduct = require('dw/catalog/ProductMgr').getProduct(pid);
        type = request.httpParameterMap.type.stringValue || "lp";
    }
    if (mProduct && mProduct.variant && !monetateObject.getMonetateVariationInSite()){
        mProduct = mProduct.variationModel.master
    }
    res.render('monetate/monetategetproduct', {MProduct: mProduct, type: type});
    next();
});

module.exports = server.exports();
