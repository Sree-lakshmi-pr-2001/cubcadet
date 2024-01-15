'use strict';
const Logger = require('dw/system/Logger');
const Status = require('dw/system/Status');
const Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');
const OrderMgr = require('dw/order/OrderMgr');
var collections = require('*/cartridge/scripts/util/collections');
var OrderModel = require('*/cartridge/models/order');
var Locale = require('dw/util/Locale');
var HashMap = require('dw/util/HashMap');
var HookMgr = require('dw/system/HookMgr');
var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

exports.afterPOST = function (order) {
    Logger.error('starting afterOrderPOST.js')
    let paymentInstruments = order.getPaymentInstruments();
    // var collections = require('*/cartridge/scripts/util/collections');
    var orderNumber = order.getOrderNo();
    Logger.error('orderNumber : ' + orderNumber);
    var epcotOrder = null;
    let epcotPaymentInstrument = null;

    collections.forEach(paymentInstruments, function (item) {
        var paymentMethod = item.getPaymentMethod();
        Logger.error('payment method ' + item.getPaymentMethod());

        if (paymentMethod == 'NO_CHARGE') {
            epcotOrder = paymentMethod;
            epcotPaymentInstrument = item;
        }

        if (paymentMethod == 'PCIPAL') {
            epcotOrder = paymentMethod;
            epcotPaymentInstrument = item;
        }

    });

    var orderPlaced = false;

    if (epcotOrder != null) {
        Transaction.wrap(function () {
            var transaction = epcotPaymentInstrument.paymentTransaction;

            if (epcotOrder == 'NO_CHARGE') {

            }
            if (epcotOrder == 'PCIPAL') {
                // remove existing transaction
                Logger.error('epcotPaymentInstrument.payment_instrument_id = ' + epcotPaymentInstrument.getUUID());

            }


            try {
                // var sendMailProxy = require('int_marketing_cloud/cartridge/scripts/hookProxy/sendMailProxy');
                // Logger.error('JSM - after sendMailProxy init');


                // sendMailProxy.sendMail({
                //                 communicationHookID: 'order.confirmation',
                //                 template: 'checkout/confirmation/confirmationEmail',
                //                 fromEmail: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
                //                 toEmail: order.customerEmail,
                //                 subject: Resource.msg('subject.order.confirmation.email', 'order', null),
                //                 messageBody: content,
                //                 params: context
                //             })
                //         ;
                //         Logger.error('JSM - after sendMailProxy call');
                // }
                Logger.error('transaction : ' + transaction);
                transaction.setTransactionID(order.getOrderNo());


                Logger.error('before export');

                OrderMgr.placeOrder(order);
                order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                order.setExportStatus(Order.EXPORT_STATUS_READY);
                Logger.error('done in afterOrderPOST.js');
                orderPlaced = true;

            } catch (ex) {
                Logger.error(JSON.stringify(ex));
                throw ex;
            }


        });


        // if (orderPlaced) {

        //         var siteId = Site.getCurrent().getID();
        //         Logger.error('JSM - site : ' + siteId);

        //         Logger.error('JSM1 - sending email from in afterOrderPost');
        //         var locale = 'en_US';
        //         var context = new HashMap();
        //         Logger.error('JSM2 - sending email from in afterOrderPost');
        //         var currentLocale = Locale.getLocale(locale);
        //         Logger.error('JSM3 - sending email from in afterOrderPost');
        //         Logger.error('currentLocale : ' + currentLocale);
        //         Logger.error('current Country : ' + currentLocale.country);
        //         var orderModel = new OrderModel(order, {
        //             countryCode: currentLocale.country
        //         });
        //         Logger.error('JSM4 - sending email from in afterOrderPost');

        //         var orderObject = {
        //             order: orderModel
        //         };
        //         Logger.error('JSM5 - sending email from in afterOrderPost');
        //         Object.keys(orderObject).forEach(function (key) {
        //             context.put(key, orderObject[key]);
        //         });
        //         Logger.error('JSM - before template');

        //         // var template = new Template('checkout/confirmationEmail');
        //         Logger.error('JSM - after template 1');
        //         // var render = template.render(context)
        //         // Logger.error('JSM - after render 1');
        //         // var content = render.text;
        //         Logger.error('JSM - after render 2');
        //         var content = 'test';
        //         // Set Order for hook compat
        //         context.put('Order', order);
        //         // Set extra param, CurrentLocale
        //         context.put('CurrentLocale', currentLocale);
        //         Logger.error('before cohelpers');
        //         // let orderXML = order.getOrderExportXML(null, null);
        //         // Logger.error(JSON.stringify(orderXML));
        //         COHelpers.sendConfirmationEmail(order, locale);
        //         Logger.error('after cohelpers');

        // }

        // else {
        //     Logger.error('Order was not placed');
        // }

    }

    return new Status(Status.OK);
}
