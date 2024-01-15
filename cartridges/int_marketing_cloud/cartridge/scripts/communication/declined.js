'use strict';

/**
 * @module communication/order
 */

const sendTrigger = require('./util/send').sendTrigger;
const hookPath = 'app.communication.order.';

/**
 * Trigger an order declined notification
 * @param {SynchronousPromise} promise
 * @param {module:communication/util/trigger~CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function declined(promise, data) {
    var Logger = require('dw/system/Logger');
    Logger.debug('in declined cartridges/int_marketing_cloud/cartridge/scripts/communication/declined.js');
    return sendTrigger(hookPath + 'declined', promise, data);
}

/**
 * Declares attributes available for data mapping configuration
 * @returns {Object} Map of hook function to an array of strings
 */
function triggerDefinitions() {
    return {
        declined: {
            description: 'Order declined trigger, contains details of the placed order. To reflect data within the Marketing Cloud template.',
            attributes: [
                'Order.currentOrderNo',
                'Order.customerName'
            ]
        }
    };
}

module.exports = require('dw/system/HookMgr').callHook(
    'app.communication.handler.initialize',
    'initialize',
    require('./handler').handlerID,
    'app.communication.order',
    {
        declined: declined
    }
);

// non-hook exports
module.exports.triggerDefinitions = triggerDefinitions;
