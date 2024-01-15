'use strict';

/**
 * Helper that sends an email to a customer. This will only get called if hook handler is not registered
 * @param {obj} emailObj - An object that contains information about email that will be sent
 * @param {string} emailObj.to - Email address to send the message to (required)
 * @param {string} emailObj.subject - Subject of the message to be sent (required)
 * @param {string} emailObj.from - Email address to be used as a "from" address in the email (required)
 * @param {int} emailObj.type - Integer that specifies the type of the email being sent out. See export from emailHelpers for values.
 * @param {string} template - Location of the ISML template to be rendered in the email.
 * @param {obj} context - Object with context to be passed as pdict into ISML template.
 */
function send(emailObj, template, context) {
    var Mail = require('dw/net/Mail');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

    var email = new Mail();
    email.addTo(emailObj.to);
    email.setSubject(emailObj.subject);
    email.setFrom(emailObj.from);
    email.setContent(renderTemplateHelper.getRenderedHtml(context, template), 'text/html', 'UTF-8');
    var mailSentRes = email.send();
    return mailSentRes;
}

/**
 * Sends a declined order email - Copied from int_chase cartridge
 * @param {dw.order.Order} order - the order object
 * @returns {void}
 */
 function sendDeclinedEmail(order) {
    var Locale = require('dw/util/Locale');
    var Logger = require('dw/system/Logger');
    var HookMgr = require('dw/system/HookMgr');
    var HashMap = require('dw/util/HashMap');
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');

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

function sendDeclinedEmailFromSFCC(order) {
    var URLUtils = require('dw/web/URLUtils');
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');
    var email = order.customerEmail;
    var siteName = Site.getCurrent().getName();
    var emailOrderObj = {
        orderNo: order.orderNo,
        customerFirstName: order.defaultShipment.shippingAddress.firstName,
        customerEmail: email,
        commerceStore: order.custom.commerceStore, 
        }
            
    var homePageUrl = URLUtils.abs('Home-Show').toString();
    var loginUrl = URLUtils.abs('Login-Show').toString();
    emailOrderObj.homePageUrl = homePageUrl;
    emailOrderObj.loginUrl = loginUrl;
 
    var emailObj = {
        to: email,
        subject: Resource.msgf('email.msg.order.header','email', null, siteName , order.orderNo),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com'
    };
    var template = 'email/orderDecline';
    var mailSent = send(emailObj, template, emailOrderObj);
    return mailSent;
}

module.exports = {
    send: send,
    sendDeclinedEmail: sendDeclinedEmail,
    sendDeclinedEmailFromSFCC: sendDeclinedEmailFromSFCC
};
