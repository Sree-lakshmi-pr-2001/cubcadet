/* global request empty */
'use strict';

var server = require('server');
server.extend(module.superModule);

var StoreMgr = require('dw/catalog/StoreMgr');
var BasketMgr = require('dw/order/BasketMgr');
var Logger = require('dw/system/Logger');

var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
var productFactory = require('*/cartridge/scripts/factories/product');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

server.get('Find', function (req, res, next) {
    var radius = 100;
    var postalCode = req.querystring.postalCode;
    var lat = req.querystring.lat;
    var long = req.querystring.long;
    var showMap = req.querystring.showMap || false;
    var isServiceLocator = req.querystring.isServiceLocator === 'true' || false;
    var productId = req.querystring.productId || null;
    var productQuantity = parseInt(req.querystring.productQuantity, 10) || 1;
    var eventType = req.querystring.eventType || null;
    var shippingMethod = req.querystring.shippingMethod || null;

    var stores = storeHelpers.getStoresForDealerSelectorModal(radius, postalCode, lat, long, req.geolocation, showMap, null, isServiceLocator, productId, productQuantity, eventType, shippingMethod);
    stores.productCategoriesFilter = req.querystring.pc ? req.querystring.pc : storeHelpers.getProductCategoriesFilters();
    res.json(stores);
    next();
});

server.post('Select', function (req, res, next) {
    var result = {
        error: false
    };

    var selectedDealer = req.querystring.selectedDealer;
    if (!empty(selectedDealer)) {
        var dealerHelpers = require('*/cartridge/scripts/dealer/dealerHelpers');
        StoreMgr.setStoreIDToSession(selectedDealer);

        // save deliveryZipCode
        var deliveryZipCode = req.querystring.postalCode;
        if (!empty(deliveryZipCode)) {
            dealerHelpers.setDeliveryZipCode(deliveryZipCode);
        }

        // update inventory for all products in basket for a new selected Dealer
        var dealer = StoreMgr.getStore(selectedDealer);
        var basket = BasketMgr.getCurrentBasket();
        dealerHelpers.updateBasketInventoryForDealer(basket, dealer);
    } else {
        result.error = true;
    }

    res.json(result);
    next();
});

server.get('TileArea', function (req, res, next) {
    var productId = req.querystring.pid ? req.querystring.pid : '';
    var isQuickView = req.querystring.isQuickView === 'true';
    if (productId === '') {
        next();
    }
    var productObj = productFactory.get({ pid: productId });
    var dealerInventoryHTML = renderTemplateHelper.getRenderedHtml(
        {
            product: productObj,
            isQuickView: isQuickView
        },
        'search/components/tileButtonState'
    );
    res.json({
        success: true,
        dealerInventoryHTML: dealerInventoryHTML
    });
    return next();
});

server.get('ShowSelectedDealer', function (req, res, next) {
    var region = req.querystring.region ? req.querystring.region : '';
    var isQuickView = req.querystring.isQuickView === 'true';
    var productType = req.querystring.productType;
    var isProductEdealerEligible = req.querystring.productEdealerEligible === 'true';
    if (req.querystring.productEdealerEligible === '') {
        isProductEdealerEligible = true;
    }

    var dealerHelper = require('*/cartridge/scripts/dealer/dealerHelpers');
    var selectedDealer = dealerHelper.getSelectedDealer();
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var deliveryType = COHelpers.getDeliveryType();
    var deliveryDealerPickup = COHelpers.DELIVERY.DEALER_PICK_UP;
    var deliveryDealer = COHelpers.DELIVERY.DEALER;

    res.render('dealer/refineSelectedDealer', {
        region: region,
        selectedDealer: selectedDealer,
        isQuickView: isQuickView,
        deliveryType: deliveryType,
        deliveryDealerPickup: deliveryDealerPickup,
        deliveryDealer: deliveryDealer,
        productType: productType,
        isProductEdealerEligible: isProductEdealerEligible
    });
    next();
});

server.get('ContactDealerFormModal', csrfProtection.generateToken, function (req, res, next) {
    var Site = require('dw/system/Site');

    var dealerHelper = require('*/cartridge/scripts/dealer/dealerHelpers');
    var selectedDealer = dealerHelper.getSelectedDealer();

    var contactUsForm = server.forms.getForm('contactus');
    contactUsForm.clear();
    contactUsForm.actionUrl = Site.current.getCustomPreferenceValue('customerServiceURL');
    contactUsForm.dealerId = selectedDealer.ID;

    res.render('dealer/contactDealerModal/contactDealerForm', {
        contactUsForm: contactUsForm
    });
    next();
});

server.get('ContactDealerModalUpdate', function (req, res, next) {
    var productId = req.querystring.pid ? req.querystring.pid : '';
    if (productId === '') {
        res.json({
            success: false
        });
        return next();
    }
    var productObj = productFactory.get({ pid: productId });
    var contactDealerProductHTML = renderTemplateHelper.getRenderedHtml(
        {
            product: productObj
        },
        'dealer/contactDealerModal/contactDealerProduct'
    );

    var dealerHelper = require('*/cartridge/scripts/dealer/dealerHelpers');
    var selectedDealer = dealerHelper.getSelectedDealer();

    res.json({
        success: true,
        contactDealerProductHTML: contactDealerProductHTML,
        selectedDealerId: selectedDealer.ID,
        productName: productObj.productName,
        productId: productId
    });
    return next();
});

server.post('SaveDeliveryZipCode', function (req, res, next) {
    var result = {
        error: false
    };

    var deliveryZipCode = req.querystring.deliveryZipCode;
    if (!empty(deliveryZipCode)) {
        var dealerId = StoreMgr.getStoreIDFromSession();
        var dealer = StoreMgr.getStore(dealerId);
        var Helper = require('org_mtd_ma/cartridge/scripts/utils/ButtonStateHelper');
        var isDeliveryInRange = Helper.isDeliveryInRange(dealer, deliveryZipCode);

        var canBeChanged = true;
        var basket = BasketMgr.getCurrentBasket();
        if (dealer && !isDeliveryInRange && basket && basket.defaultShipment && basket.defaultShipment.shippingMethodID === 'dealer-delivery') {
            // set "dealer-pickup" shipping if new delivery zipcode is not in rage of dealer delivery
            var shippingMethod = 'dealer-pickup';
            var shipment = basket.defaultShipment;
            var DealerHelper = require('int_mtdservices/cartridge/scripts/helpers/DealerHelper.js');
            var method = DealerHelper.getShippingMethodById(shipment, shippingMethod);
            if (method) {
                DealerHelper.setShippingMethodToShipment(basket, shipment, method);
                // Calculate totals for selected shipping method
                DealerHelper.calculateTotalForDealerShippingMethod(shippingMethod);
            } else {
                canBeChanged = false;
            }
        }
        if (canBeChanged) {
            var dealerHelpers = require('*/cartridge/scripts/dealer/dealerHelpers');
            dealerHelpers.setDeliveryZipCode(deliveryZipCode);
        } else {
            Logger.error('Dealer - SaveDeliveryZipCode: shipping method dealer-pickup was not set');
            result.error = true;
        }
    } else {
        result.error = true;
    }

    res.json(result);
    next();
});

server.get('GetDeliveryZipCode', function (req, res, next) {
    var result = {
        error: false
    };

    var dealerHelpers = require('*/cartridge/scripts/dealer/dealerHelpers');
    var deliveryZipCode = dealerHelpers.getDeliveryZipCode();
    if (!empty(deliveryZipCode)) {
        result.deliveryZipCode = deliveryZipCode;
    } else {
        result.error = true;
    }

    res.json(result);
    next();
});

module.exports = server.exports();
