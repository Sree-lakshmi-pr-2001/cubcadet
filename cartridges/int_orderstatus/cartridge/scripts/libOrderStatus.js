'use strict';

/**
 * Exposes CheckAuthRequest() function to verify OMS credentials saved as 
 * site preferences and the UpdateOrderWithJSON() function to check and update order 
 * line item attributes.
 *
 * @module scripts/libOrderStatus
 */

/* Script Modules */

var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Transaction = require('dw/system/Transaction');
var UpdateStatusLogger = require('dw/system/Logger').getLogger('updateOrderStatus', 'updateOrderStatus');

/**
 * Validates the credentials provided in the request Auth header with the saved 
 * credentials in site preference.
 *
 * @param {Object} request The request object
 * @return {boolean} return If the OMS credentials are valid
 *
 */
 
function CheckAuthRequest (request) {
    var oms_credentials_uname = Site.getCurrent().getCustomPreferenceValue('OMSPushService_Username');
    var oms_credentials_pswd = Site.getCurrent().getCustomPreferenceValue('OMSPushService_Password');
    var baHeader = request.httpHeaders["authorization"];
    var basicPrefix = "Basic";
    if(!empty(baHeader) && baHeader.indexOf(basicPrefix) == 0){
        var base64Credentials = baHeader.substring(basicPrefix.length).trim();
        var credentials = StringUtils.decodeBase64(base64Credentials);
        var values = credentials.split(":",2);
        return (values[0] == oms_credentials_uname && values[1] == oms_credentials_pswd);
         
    }else{
        return false;
    }
}

/**
 * Iterates over lineItems in passed JSON and look up the order. Set lineItem orderStatus,
 * confirmationStatus, and shippingStatus to the statuses passed from the OMS.
 *
 * @param {Object} orderJSON The order JSON object
 *
*/

function UpdateOrderWithJSON (orderJSON) {

    if (!('orderNo' in orderJSON)) {
        throw new Error('Order JSON payload doesn\'t have orderNo attribute');
    }

    var orderNo = orderJSON.orderNo;
    var order = OrderMgr.getOrder(orderNo);

    if (!order) {
        throw new Error('Order #' + orderNo + ' is not found');
    }

    Transaction.begin();

    if ('orderStatus' in orderJSON) {
        order.setStatus(Order[orderJSON.orderStatus]);
    }
    
    if ('confirmationStatus' in orderJSON) {
        order.setConfirmationStatus(Order[orderJSON.confirmationStatus]);
    }
    
    if ('shippingStatus' in orderJSON) {
        order.setShippingStatus(Order[orderJSON.shippingStatus]);
    }

    // Update notes in the order
    for each (var noteObj in orderJSON.orderNotes) {
        UpdateStatusLogger.info('OrderNo: {0} | Notes size: {1}', order.orderNo, order.notes.size());
        // Quota is only 1000 notes per order
        if (order.notes.size() < 990) {
            order.addNote('storefront', noteObj.note.substr(0, 4000));
        }
    }

    Transaction.commit();
}


module.exports = {
        CheckAuthRequest: CheckAuthRequest,
        UpdateOrderWithJSON: UpdateOrderWithJSON
};
