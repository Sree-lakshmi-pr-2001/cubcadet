'use strict';
/* global empty */

var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');

/**
 * Sends a declined email after Safetech review
 * @param {dw.order.Order} order - the order object
 * @returns {void}
 */
function sendDeclinedEmail(order) {
    var Locale = require('dw/util/Locale');
    var Logger = require('dw/system/Logger');
    var HookMgr = require('dw/system/HookMgr');
    var HashMap = require('dw/util/HashMap');

    var context = new HashMap();
    var currentLocale = Locale.getLocale(order.getCustomerLocaleID());

    // Set Order for hook compat
    context.put('Order', order);
    // Set extra param, CurrentLocale
    context.put('CurrentLocale', currentLocale);
    var customerServiceEmail = Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com';
    Logger.debug('trying to send a decline email for order #' + order.orderNo + ' with email = ' + customerServiceEmail);
    var hookID = 'app.mail.sendMail';
    if (HookMgr.hasHook(hookID)) {
        Logger.debug('calling hookID ' + hookID + '  for order # ' + order.orderNo);
        var hookJSON = {
            communicationHookID: 'order.declined',
            fromEmail: customerServiceEmail,
            toEmail: order.customerEmail,
            subject: Resource.msg('demandware.cartridges.int_chase.email.subject.declined', 'int_chase', null),
            params: context
        };
        Logger.debug('hookJSON: ' + JSON.stringify(hookJSON));

        HookMgr.callHook(
            hookID,
            'sendMail', hookJSON
        );
    } else {
        Logger.debug('No hook registered for {0}', hookID);
    }
}


/**
 * Sends a order confirmation email after Safetech review
 * @param {dw.order.Order} order - the order object
 * @returns {void}
 */
function sendOrderConfirmation(order) {
    var Locale = require('dw/util/Locale');
    var Logger = require('dw/system/Logger');
    var HookMgr = require('dw/system/HookMgr');
    var HashMap = require('dw/util/HashMap');

    var context = new HashMap();
    var currentLocale = Locale.getLocale(order.getCustomerLocaleID());

    // Set Order for hook compat
    context.put('Order', order);
    // Set extra param, CurrentLocale
    context.put('CurrentLocale', currentLocale);
    var content = '';
    var hookID = 'app.mail.sendMail';
    if (HookMgr.hasHook(hookID)) {
        var hookJSON = {
            communicationHookID: 'order.confirmation',
            template: 'checkout/confirmation/confirmationEmail',
            fromEmail: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
            toEmail: order.customerEmail,
            subject: Resource.msg('subject.order.confirmation.email', 'order', null),
            messageBody: content,
            params: context
        };

        Logger.debug('hookJSON: ' + JSON.stringify(hookJSON));

        HookMgr.callHook(
            hookID,
            'sendMail', hookJSON
        );
    } else {
        Logger.debug('No hook registered for {0}', hookID);
    }
}
module.exports = {
    sendDeclinedEmail: sendDeclinedEmail,
    sendOrderConfirmation: sendOrderConfirmation
};
