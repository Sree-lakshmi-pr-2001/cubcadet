'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var storeMgr = require('dw/catalog/StoreMgr');
var storeHelpers = require('org_mtd/cartridge/scripts/helpers/storeHelpers');
var URLUtils = require('dw/web/URLUtils');
var BasketMgr = require('dw/order/BasketMgr');
var CartModel = require('*/cartridge/models/cart');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var productFactory = require('*/cartridge/scripts/factories/product');

/**
 * Set grand total if it is empty by subtotal
 *
 * @param {Object} viewData Response object
 * @param {dw.order.Basket} currentBasket Basket object
 */
function setGrandTotal(viewData, currentBasket) {
    var formatMoney = require('dw/util/StringUtils').formatMoney;

    if (!currentBasket) {
        return;
    }

    if (!currentBasket.totalGrossPrice.available && currentBasket.totalNetPrice.available) {
        viewData.totals.grandTotal = formatMoney(currentBasket.totalNetPrice); // eslint-disable-line no-param-reassign
    }
}

server.get('Show', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var StoreModel = require('*/cartridge/models/store');

    var dealerId = req.querystring.dealer_id;
    if (!dealerId) {
        // redirect to Stores-Find page
        res.redirect(URLUtils.url('Stores-Find'));
        return next();
    }

    var dealer = storeMgr.getStore(dealerId);
    if (!dealer || dealer.custom.dealer_minisite_enabled === false) {
        res.redirect(URLUtils.url('Stores-Find'));
        return next();
    }

    var dealerStore = new StoreModel(dealer);
    if (dealerStore.pageTitle || dealerStore.pageDescription) {
        pageMetaHelper.setPageMetaData(req.pageMetaData, dealerStore);
    } else {
        pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    }

    var renderResult = storeHelpers.renderDealerShow(req, res, next, dealer);
    res.render('dealer/homePage', renderResult);
    return next();
}, pageMetaData.computedPageMetaData);

server.get('SetShippingMethod', function (req, res, next) {
    var shippingMethod = req.querystring.method;

    var basket = BasketMgr.getCurrentOrNewBasket();
    var shipment = basket.defaultShipment;
    var DealerHelper = require('int_mtdservices/cartridge/scripts/helpers/DealerHelper.js');
    var method = DealerHelper.getShippingMethodById(shipment, shippingMethod);
    if (method) {
        DealerHelper.setShippingMethodToShipment(basket, shipment, method);
        DealerHelper.resetShippingAddressForm(method);
        // Calculate totals for selected shipping method
        DealerHelper.calculateTotalForDealerShippingMethod(shippingMethod);
    } else {
        res.json({
            success: false,
            method: shipment.getShippingMethodID()
        });
        return next();
    }

    // Get the product object in order to re-render the product/components/tileButtonState template on the PDP
    var productId = req.querystring.productId ? req.querystring.productId : '';
    if (productId === '') {
        res.json({
            success: false,
            method: shipment.getShippingMethodID()
        });
        return next();
    }
    var productObj = productFactory.get({ pid: productId });
    var tileButtonStateHTML = renderTemplateHelper.getRenderedHtml(
        {
            product: productObj,
            addToCartUrl: URLUtils.url('Cart-AddProduct')
        },
        '/product/components/tileButtonState'
    );

    res.json({
        success: true,
        method: shipment.getShippingMethodID(),
        tileButtonStateHTML: tileButtonStateHTML
    });
    return next();
});

server.get('CartSetShippingMethod', function (req, res, next) {
    var shippingMethod = req.querystring.method;
    var basket = BasketMgr.getCurrentOrNewBasket();
    var shipment = basket.defaultShipment;
    var currentShippingMethodId = shipment.shippingMethodID;
    var DealerHelper = require('int_mtdservices/cartridge/scripts/helpers/DealerHelper.js');
    var method = DealerHelper.getShippingMethod(shippingMethod);
    if (method) {
        DealerHelper.setShippingMethodToShipment(basket, shipment, method);

        // Update inventory if shipping method was changed
        var newShippingMethodId = basket.defaultShipment.shippingMethodID;
        DealerHelper.updateInventoryForProductsInBasket(currentShippingMethodId, newShippingMethodId);
        DealerHelper.resetShippingAddressForm(shippingMethod);
        // Calculate totals for selected shipping method
        DealerHelper.calculateTotalForDealerShippingMethod(shippingMethod);
    } else {
        res.json({
            success: false,
            method: shipment.getShippingMethodID()
        });
        return next();
    }

    var productId = req.querystring.productId ? req.querystring.productId : '';
    if (productId === '') {
        res.json({
            success: false,
            method: shipment.getShippingMethodID()
        });
        return next();
    }
    var cartProductDeliveryHTML = renderTemplateHelper.getRenderedHtml(
        {
            productId: productId
        },
        'cart/productCard/cartProductDelivery'
    );

    var basketModel = new CartModel(basket);
    setGrandTotal(basketModel, basket);

    res.json({
        success: true,
        basket: basketModel,
        method: shipment.getShippingMethodID(),
        cartProductDeliveryHTML: cartProductDeliveryHTML
    });
    return next();
});

server.get('CartDeliveryMethods', function (req, res, next) {
    var productId = req.querystring.productId ? req.querystring.productId : '';
    if (productId === '') {
        return next();
    }
    res.render('cart/productCard/cartProductDelivery', {
        productId: productId
    });
    return next();
});

server.get('ErrorNotFound', function (req, res, next) {
    res.setStatusCode(404);
    res.render('error/notFound');
    next();
});

module.exports = server.exports();
