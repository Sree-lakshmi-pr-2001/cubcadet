'use strict';

const Logger = require('dw/system/Logger');

const Status = require('dw/system/Status');

const Transaction = require('dw/system/Transaction');

var Order = require('dw/order/Order');

const OrderMgr = require('dw/order/OrderMgr');



exports.afterPOST = function (order, paymentInstrument, successfullyAuthorized) {

    Logger.error('JSM in afterPaymentPOST.js');

    Logger.error('paymentInstrument token : ' + paymentInstrument.c_payment_token);

    Logger.error('paymentInstrument token : ' + paymentInstrument.payment_method_id);

    Logger.error('done in afterPaymentPOST');



    if (paymentInstrument.payment_method_id == 'PCIPAL') {

        Logger.error('PCIPAL');



        // Logger.error('selected payment_instrument_id : ' + paymentInstrument.payment_instrument_id);

        Logger.error('selected customer payment_instrument_id : ' + paymentInstrument.customer_payment_instrument_id);



        let paymentInstruments = order.getPaymentInstruments();

        var collections = require('*/cartridge/scripts/util/collections');



        collections.forEach(paymentInstruments, function (orderPaymentInstrument) {

            var paymentMethod = orderPaymentInstrument.getPaymentMethod();

            Logger.error('in collection, payment method : ' + paymentMethod);



            if (paymentMethod == 'PCIPAL') {

                Transaction.wrap(function () {



                    var transaction = orderPaymentInstrument.paymentTransaction;

                    Logger.error('transaction : ' + transaction);

                    transaction.setTransactionID(order.getOrderNo());

                    // transaction.setPaymentProcessor('PCIPAL');



                    transaction.custom.chaseApprovalStatus = paymentInstrument.c_chaseApprovalStatus;

                    transaction.custom.chaseAutoDecisionResponse = paymentInstrument.c_chaseAutoDecisionResponse;

                    transaction.custom.chaseCustomerReferenceNumber = paymentInstrument.c_chaseCustomerReferenceNumber;

                    transaction.custom.chaseFraudStatusCode = paymentInstrument.c_chaseFraudStatusCode;

                    transaction.custom.chaseMerchantId = paymentInstrument.c_chaseMerchantId;

                    transaction.custom.chaseRespCode = paymentInstrument.c_chaseRespCode;

                    transaction.custom.chaseRespDateTime = paymentInstrument.c_chaseRespDateTime;

                    transaction.custom.chaseTxRefIdx = paymentInstrument.c_chaseTxRefIdx;

                    transaction.custom.chaseTxRefNum = paymentInstrument.c_chaseTxRefNum;



                    // order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);

                    // Logger.error('before export');



                    // order.setExportStatus(Order.EXPORT_STATUS_READY);

                    // OrderMgr.placeOrder(order);

                });
            }
        });
    }
    return new Status(Status.OK);
}