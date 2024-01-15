var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');

/**
 * Send an email to business contact if order fails to void
 *
 * @param {string} orderNumber - order number for
 * @param {string} siteName - siteName
 */
function sendEmailForFailedVoid(orderNumber, siteName) {
    var HashMap = require('dw/util/HashMap');
    var Mail = require('dw/net/Mail');
    var Template = require('dw/util/Template');
    var failedVoidEmail = new Mail();
    Logger.error('sendEmailForFailedVoid : ' + orderNumber);
    var email = Site.current.getCustomPreferenceValue('orderSupportEmail');
    if (email.indexOf(',') > -1) {
        var emails = email.split(',');
        for (var i = 0; i < emails.length; i++) {
            var email1 = emails[i];
            failedVoidEmail.addTo(email1);
        }
    } else {
        failedVoidEmail.addTo(email);
    }

    var sfccEnvironment = Site.current.getCustomPreferenceValue('sfccEnvironment');

    var context = new HashMap();
    context.put('orderNumber', orderNumber);
    failedVoidEmail.setSubject(sfccEnvironment + ' - ' + siteName + ' Failed to Void Order #' + orderNumber);
    failedVoidEmail.setFrom(
        Site.current.getCustomPreferenceValue('customerServiceEmail')
        || 'no-reply@salesforce.com');

    var template = new Template('voidReversalFailed');
    var content = template.render(context).text;
    failedVoidEmail.setContent(content, 'text/html', 'UTF-8');
    failedVoidEmail.send();
}

/**
 * Void/Reverse Order if declined. Send SFMC email for declined Order
 *
*/
function updateReviewDeclinedNotProcessedOrders() {
    var sendEmailHelper = require('int_chase/cartridge/scripts/helpers/sendEmailHelper');
    var FRAUD_SEARCH_QUERY = 'custom.fraudManualReviewStatus = {0}';
    var fraudManualReviewStatus = 'reviewDeclinedNotProcessed';
    var orders = OrderMgr.searchOrders(
        FRAUD_SEARCH_QUERY,
        'creationDate desc',
        fraudManualReviewStatus
    );

    Logger.error('# of decline orders found for ' + Site.current.getID() + ' => ' + orders.count);
    while (orders.hasNext()) {
        var order = orders.next();
        var paymentInstruments = order.getPaymentInstruments();
        var paymentInstrument = paymentInstruments[0];
        Logger.error('Decling order -> {0}', order.orderNo);
        var voidResult = null;
        try {
            // Void authorization due to fraud decline
            var COHelpers = require('org_mtd/cartridge/scripts/checkout/checkoutHelpers');
            voidResult = COHelpers.makePaymentVoid(order.orderNo, paymentInstrument);
            Transaction.wrap(function () { OrderMgr.cancelOrder(order); }); // eslint-disable-line
        } catch (ex) {
            Logger.error('Failed to cancel order #' + order.orderNo + ', ex.message => ' + ex.message);
        }

        Transaction.wrap(function() { // eslint-disable-line
            order.custom.fraudManualReviewStatus = 'reviewDeclinedProcessed';
        });
        // send sfmc email
        sendEmailHelper.sendDeclinedEmail(order);

        if (!voidResult) {
            Logger.error('failed to void order # ' + order.orderNo);
            sendEmailForFailedVoid(order.orderNo, Site.current.getID());
            //
        }
        Logger.error('done with order # ' + order.orderNo);
    }
    Logger.error('done # of decline orders found for ' + Site.current.getID() + ' => ' + orders.count);
    return;
}

/**
 * Send Order Confirmation Email to approved order
 * @param {string} orderNumber - order number for
*/
function sendOrderConfirmation(orderNumber) {
    var sendEmailHelper = require('int_chase/cartridge/scripts/helpers/sendEmailHelper');
    var order = OrderMgr.getOrder(orderNumber);
    var workingStatus = 'W';
    if (order) {
        if (order.custom.orderConfirmationEmailSent && order.custom.orderConfirmationEmailSent == workingStatus) { // eslint-disable-line
            Logger.error('sending order confirmation email for ' + orderNumber + ' because order.custom.orderConfirmationEmailSent = ' + order.custom.orderConfirmationEmailSent);
            sendEmailHelper.sendOrderConfirmation(order);

            Transaction.wrap(function() { // eslint-disable-line
                order.custom.orderConfirmationEmailSent = 'Y';
            });
        } else {
            Logger.error('NOT sending order confirmation email for ' + orderNumber + ' because order.custom.orderConfirmationEmailSent = "' + order.custom.orderConfirmationEmailSent + '"');
        }
    } else {
        Logger.error('order #' + orderNumber + ' was null when retrieving via OrderMgr get Order');
    }
}

/**
 * process approved orders
 *
*/
function updateReviewApprovedOrders() {
    var ORDER_CONFIRMATION_EMAIL_QUERY = 'custom.orderConfirmationEmailSent = {0} and custom.fraudManualReviewStatus = {1} ';
    var orderConfirmationEmailSentStatus = 'N';
    var fraudManualReviewStatus = 'reviewApproved';
    var orders = OrderMgr.searchOrders(
        ORDER_CONFIRMATION_EMAIL_QUERY,
        'creationDate desc',
        orderConfirmationEmailSentStatus,
        fraudManualReviewStatus
    );
    var workingStatus = 'W';
    Logger.error('# of approve orders to send email found for ' + Site.current.getID() + ' => ' + orders.count);
    while (orders.hasNext()) {
        var order = orders.next();
        Transaction.wrap(function() { // eslint-disable-line
            order.custom.orderConfirmationEmailSent = workingStatus;
        });

        sendOrderConfirmation(order.orderNo);
    }
    return;
}

exports.execute = function () {
    updateReviewDeclinedNotProcessedOrders();
    updateReviewApprovedOrders();
};
