'use strict';
var server = require('server');
server.extend(module.superModule);

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
    if (order && order.defaultShipment.custom.dealerAddress) {
        var dealerInfo = {
            dealerAddress: JSON.parse(order.defaultShipment.custom.dealerAddress)
        };
        viewData.dealerInfo = dealerInfo;
        viewData.isCheckout = false;
    }
    return viewData;
}

server.append(
    'Confirm',
    function (req, res, next) {
        var originalViewData = res.getViewData();
        session.custom.ZTRInCart ='';
        var viewData = getDealerData(originalViewData.order.orderNumber);
        res.setViewData(viewData);
        return next();
    }
);

server.append(
    'Details',
    function (req, res, next) {
        var originalViewData = res.getViewData();
        var viewData = getDealerData(originalViewData.order.orderNumber);
        res.setViewData(viewData);
        return next();
    }
);

module.exports = server.exports();
