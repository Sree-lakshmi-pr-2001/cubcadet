'use strict';
const Logger = require('dw/system/Logger');
const Status = require('dw/system/Status');
const Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');
const OrderMgr = require('dw/order/OrderMgr');

exports.afterPATCH = function (order, paymentInstrument, newPaymentInstrument, successfullyAuthorized) {
    Logger.error('JSM in afterPATCH.js');
    Logger.error(paymentInstrument);

    var paymentMethod = paymentInstrument.getPaymentMethod();
    Logger.error('in collection, payment method : ' + paymentMethod);

    if (paymentMethod == 'PCIPAL') {
        Transaction.wrap(function () {

            var transaction = paymentInstrument.paymentTransaction;
            Logger.error('transaction : ' + transaction);
            transaction.setTransactionID(order.getOrderNo());
            // transaction.setPaymentProcessor('PCIPAL');

            transaction.custom.chaseApprovalStatus = newPaymentInstrument.c_chaseApprovalStatus;
            transaction.custom.chaseAutoDecisionResponse = newPaymentInstrument.c_chaseAutoDecisionResponse;
            transaction.custom.chaseCustomerReferenceNumber = newPaymentInstrument.c_chaseCustomerReferenceNumber;
            transaction.custom.chaseFraudStatusCode = newPaymentInstrument.c_chaseFraudStatusCode;
            transaction.custom.chaseMerchantId = newPaymentInstrument.c_chaseMerchantId;
            transaction.custom.chaseRespCode = newPaymentInstrument.c_chaseRespCode;
            transaction.custom.chaseRespDateTime = newPaymentInstrument.c_chaseRespDateTime;
            transaction.custom.chaseTxRefIdx = newPaymentInstrument.c_chaseTxRefIdx;
            transaction.custom.chaseTxRefNum = newPaymentInstrument.c_chaseTxRefNum;

            // order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
            // Logger.error('before export');

            OrderMgr.placeOrder(order);
            order.setExportStatus(Order.EXPORT_STATUS_READY);
        });
    } else if (paymentMethod == 'NO_CHARGE') {
        Transaction.wrap(function () {

            var transaction = paymentInstrument.paymentTransaction;
            Logger.error('transaction : ' + transaction);
            transaction.setTransactionID(order.getOrderNo());
            OrderMgr.placeOrder(order);
            order.custom.noChargeNeedsApproval = true;
            // order.setExportStatus(Order.EXPORT_STATUS_READY);
        });
    }

    return new Status(Status.OK);
}
