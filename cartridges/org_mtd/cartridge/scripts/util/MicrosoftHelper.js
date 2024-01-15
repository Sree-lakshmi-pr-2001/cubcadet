/* global session empty dw request response */
'use strict';

/**
 * API dependencies
 */

/**
 * Get Order Revenue
 *
 * @param {PipelineDictionary} args - pipeline dictionary
 * @return {number|string} - returns revenue
 */
function getOrderRevenue(args) {
    if ('order' in args) {
        var OrderMgr = require('dw/order/OrderMgr');
        var order = OrderMgr.getOrder(args.order.orderNumber);
        return order.getAdjustedMerchandizeTotalPrice(false).value;
    }

    return '';
}

exports.getOrderRevenue = getOrderRevenue;
