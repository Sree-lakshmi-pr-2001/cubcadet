'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

var cache = require('*/cartridge/scripts/middleware/cache');

server.append('Show', function (req, res, next) {
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');

    var addToCartProductTypes = Site.current.getCustomPreferenceValue('productTileA2CProductTypes');
    var showStockMessage = Site.current.getCustomPreferenceValue('productTileStockMsgEnabled');
    var showPartReplacesWidget = Site.current.getCustomPreferenceValue('productTilePartReplacesEnabled');
    var fitsOnModel = req.querystring.fitsOnModel || false;

    var viewData = res.getViewData();
    var searchKeyword = req.querystring.q || '';
    var showAddToCartButton = false;
    var bsHelper = require('org_mtd_ma/cartridge/scripts/utils/ButtonStateHelper');
    var isQuickView = req.querystring.isQuickView === 'true';
    var buttonStates = bsHelper.getStates(viewData.product.id);
    if(buttonStates) {
        res.cachePeriod = 24;
        res.cachePeriodUnit = 'hours'; 
    }
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var params = req.querystring;
    var product = ProductFactory.get(params);
    var isPDP = params.pdp ? params.pdp : false;
    // Since the add to cart button is already shown on the PDP, we don't want to show it on the tile as well
    if (isPDP) {
        showAddToCartButton = false;
    }
    addToCartProductTypes.forEach(function (type) {
        if (type.value === viewData.product.mtdProductType) {
            showAddToCartButton = true;
            return;
        }
    });
    if(showAddToCartButton || showStockMessage) {
        res.cachePeriod = 3;
        res.cachePeriodUnit = 'minutes';
    }
    var productUrl = URLUtils.url('Product-Show', 'pid', viewData.product.id, 'fitsOnModel', fitsOnModel).relative().toString();
    var quickViewUrl = URLUtils.url('Product-ShowQuickView', 'pid', viewData.product.id).relative().toString();

    res.setViewData({
        showAddToCartButton: showAddToCartButton,
        showStockMessage: showStockMessage,
        showPartReplacesWidget: showPartReplacesWidget && req.querystring.q,
        searchKeyword: searchKeyword,
        product:product,
        isQuickView:isQuickView,
        isPDP:isPDP,
        urls: {
            product: productUrl,
            quickView: quickViewUrl
        },
        willFitsOnModel: fitsOnModel,
    });

    next();
});

server.get('Availability', cache.applyAvailabilitySensitiveCache, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Site = require('dw/system/Site');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var params = req.querystring;

    var product;
    var productUrl;
    var addToCartUrl;
    var showAddToCartButton;

    var addToCartProductTypes = Site.current.getCustomPreferenceValue('productTileA2CProductTypes');
    var isPDP = params.pdp ? params.pdp : false;
    var showStockMessage = isPDP ? true : Site.current.getCustomPreferenceValue('productTileStockMsgEnabled');

    try {
        product = ProductFactory.get(params);
        productUrl = URLUtils.url('Product-Show', 'pid', product.id).relative().toString();
        addToCartUrl = URLUtils.url('Cart-AddProduct').relative().toString();
        showAddToCartButton = false;
        addToCartProductTypes.forEach(function (type) {
            if (type.value === product.raw.custom['product-type'].value) {
                showAddToCartButton = true;
                return;
            }
        });

        // Since the add to cart button is already shown on the PDP, we don't want to show it on the tile as well
        if (isPDP) {
            showAddToCartButton = false;
        }
    } catch (e) {
        product = false;
    }

    var context = {
        product: product,
        urls: {
            product: productUrl,
            addToCart: addToCartUrl
        },
        showAddToCartButton: showAddToCartButton,
        showStockMessage: showStockMessage,
        isPDP: isPDP
    };

    res.render('product/productTileAvailability.isml', context);
    next();
});

module.exports = server.exports();
