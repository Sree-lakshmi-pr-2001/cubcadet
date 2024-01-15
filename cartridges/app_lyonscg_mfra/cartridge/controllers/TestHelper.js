'use strict';

var server = require('server');

var Resource = require('dw/web/Resource');
var System = require('dw/system/System');

/**
 * Get Dealer Data
 * @param {string} orderId - order ID
 * @returns {Object} dealer data object
 */
function getDealerData(orderId) {
    var OrderMgr = require('dw/order/OrderMgr');
    var MTDUtil = require('int_mtdservices/cartridge/scripts/helpers/Util');
    var DealerHelper = require('int_mtdservices/cartridge/scripts/helpers/DealerHelper');

    var viewData = {
        dealerDeliveryMethodId: MTDUtil.VALUE.DEALER_DELIVERY_METHOD,
        dealerPickupMethodId: MTDUtil.VALUE.DEALER_PICKUP_METHOD,
        dealerDeliveryInfo: DealerHelper.getContentAssetBody('dealers-delivery-info'),
        dealerPickupInfo: DealerHelper.getContentAssetBody('dealers-pickup-info')
    };
    var order = OrderMgr.getOrder(orderId);
    // Add dealer info if we have set custom attribute
    if (order && order.defaultShipment.custom.dealerInfo) {
        viewData.dealerInfo = JSON.parse(order.defaultShipment.custom.dealerInfo);
        viewData.isCheckout = false;
    }
    return viewData;
}

/**
 * Order Confirmation Test Controller
 * Enter order number into the URL to view the order confirmation
 *
 * EX: TestHelper-Confirm?ID=00000301
 */

server.get(
    'Confirm',
    server.middleware.https,
    function (req, res, next) {
        var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
        var OrderMgr = require('dw/order/OrderMgr');
        var OrderModel = require('*/cartridge/models/order');
        var Locale = require('dw/util/Locale');

        if (System.getInstanceType() === System.PRODUCTION_SYSTEM) {
            return next();
        }

        var order = OrderMgr.getOrder(req.querystring.ID);

        if (!order) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });

            return next();
        }

        var config = {
            numberOfLineItems: '*'
        };

        var currentLocale = Locale.getLocale(req.locale.id);

        var orderModel = new OrderModel(
            order,
            { config: config, countryCode: currentLocale.country, containerView: 'order' }
        );
        var passwordForm;

        var reportingURLs = reportingUrlsHelper.getOrderReportingURLs(order);

        if (!req.currentCustomer.profile) {
            passwordForm = server.forms.getForm('newPasswords');
            passwordForm.clear();
            res.render('checkout/confirmation/confirmation', {
                order: orderModel,
                returningCustomer: false,
                passwordForm: passwordForm,
                reportingURLs: reportingURLs
            });
        } else {
            res.render('checkout/confirmation/confirmation', {
                order: orderModel,
                returningCustomer: true,
                reportingURLs: reportingURLs
            });
        }

        return next();
    }
);

server.append(
    'Confirm',
    function (req, res, next) {
        var ContentMgr = require('dw/content/ContentMgr');
        var ContentModel = require('*/cartridge/models/content');

        var prop65Asset = ContentMgr.getContent('prop65-cart-line-item-warning');
        if (prop65Asset) {
            var assetModel = new ContentModel(prop65Asset);
            var assetHtml = assetModel.body.markup;
            res.setViewData({ itemProp65WarningMsg: assetHtml });
        }

        var originalViewData = res.getViewData();
        var viewData = getDealerData(originalViewData.order.orderNumber);
        res.setViewData(viewData);
        return next();
    }
);

module.exports = server.exports();
