/* global session request */
'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

/**
 * find ediller in the closest area
 * @returns {number} decision
 */
function findClosestEDealerInArea() {
    var Helper = require('org_mtd_ma/cartridge/scripts/utils/ButtonStateHelper');
    var dealerHelpers = require('org_cubcadet/cartridge/scripts/dealer/dealerHelpers');
    var closestStores = Helper.getStores('300', dealerHelpers.getDeliveryZipCode());
    if (closestStores.length) {
        for (var store in closestStores) { // eslint-disable-line
            if (store.custom.dealer_fulfillment_enabled) {
                return store.ID;
            }
        }
    }
    return null;
}

/**
 * Update Dealer
 */
function updateDealer() {
    var StoreMgr = require('dw/catalog/StoreMgr');
    var dealerID = StoreMgr.getStoreIDFromSession();
    if (!dealerID) {
        dealerID = findClosestEDealerInArea();
        StoreMgr.setStoreIDToSession(dealerID);
    }
}

/**
 * Append additional data to render PDP
 */
server.append('Show', function (req, res, next) {
    updateDealer();
    next();
});

/**
 * Append additional data to render PDP
 */
server.append('ShowInCategory', function (req, res, next) {
    updateDealer();
    next();
});

server.get('PDPButtonTileArea', function (req, res, next) {
    var productFactory = require('*/cartridge/scripts/factories/product');
    var productID = req.querystring.pid ? req.querystring.pid : '';
    var addToCart = req.querystring.addToCartUrl;
    var productObj = productFactory.get({ pid: productID });

    var dealerInventoryHTML = renderTemplateHelper.getRenderedHtml(
        {
            product: productObj,
            addToCartUrl: addToCart
        },
        'product/components/tileButtonState'
    );
    res.json({
        success: true,
        dealerInventoryHTML: dealerInventoryHTML
    });
    return next();
});

server.get('ShowExtendedWarranty', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var warrantyHelpers = require('*/cartridge/scripts/helpers/warrantyHelpers');

    var params = req.querystring;
    var product = ProductFactory.get(params);

    var warrantyParams = {};
    if (product.raw.getOrderableRecommendations(4).length) {
        warrantyParams.pid = product.raw.getOrderableRecommendations(4)[0].recommendedItem.ID;
    }

    var warranty = ProductFactory.get(warrantyParams);
    var estimatedTotalPrice = warrantyHelpers.getEstimatedTotalPrice(product, warranty);
    var addToCartUrl = URLUtils.url('Cart-AddProduct');

    warranty.isWarranty = true;

    res.render('productLanding/productLanding', {
        product: product,
        warranty: warranty,
        estimatedTotalPrice: estimatedTotalPrice,
        addToCartUrl: addToCartUrl
    });

    next();
});

module.exports = server.exports();
