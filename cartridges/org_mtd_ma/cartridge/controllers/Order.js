'use strict';
var server = require('server');
server.extend(module.superModule);

var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');

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

server.append(
    'Details',
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
        // Remove showing td account number of specific order detail in history
        // because td account number is not available in order
        viewData.isNotShowingTDAccountNumber = true;
        res.setViewData(viewData);
        return next();
    }
);

server.append(
    'History',
    function (req, res, next) {
        var breadcrumbs = [
            {
                htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                url: URLUtils.url('Account-Show').toString()
            }
        ];

        res.render('account/order/history', {
            breadcrumbs: breadcrumbs
        });
        next();
    }
);

server.get(
    'Purchase',
    function (req, res, next) {
        var orderId = req.querystring.ID;
        var token = req.querystring.ID ? req.querystring.ID : null;
        var OrderMgr = require('dw/order/OrderMgr');
        var order;
        if (!order) {
            order = OrderMgr.getOrder(orderId);
        }
        else {
            order = OrderMgr.getOrder(orderId, token);
        }

        var ga4Data = {
            event: 'purchase',                       
            transaction_id: orderId,
            value: order.totalGrossPrice.value,
            currency: order.totalGrossPrice.currencyCode,
            items: []           
        }
        var shipmentLineItems = order.shipments[0].getProductLineItems().iterator();
        while (shipmentLineItems.hasNext()) {
            var lineItem = shipmentLineItems.next();
            var orderLineItem = {
                item_id: lineItem.productID,
                item_name: lineItem.lineItemText
            }
            ga4Data.items.push(orderLineItem);
        }
        res.render('seo/seoDataLayerPurchase',{
            context : JSON.stringify(ga4Data)
        });
        next();
    }
);

module.exports = server.exports();
