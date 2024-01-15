'use strict';

var sendEmail = require('./util/email').sendEmail;
var Logger = require('dw/system/Logger');

/**
 * Send an order declined notification
 * @param {SynchronousPromise} promise
 * @param {CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function declined(promise, data) {
    Logger.debug('Handler hook {0} executed', 'order.declined');
    return sendEmail(promise, data);
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
