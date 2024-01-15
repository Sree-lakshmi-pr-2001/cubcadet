'use strict';
const Logger = require('dw/system/Logger');
const Status = require('dw/system/Status');
const Transaction = require('dw/system/Transaction');
const Order = require('dw/order/Order');
const OrderMgr = require('dw/order/OrderMgr');
const collections = require('*/cartridge/scripts/util/collections');

exports.afterPOST = function (basket, paymentInstrument) {
    Logger.error('MTD in afterBasketPaymentPOST.js');
    Logger.error('paymentInstrument token : ' + paymentInstrument.payment_method_id);

    if (paymentInstrument.payment_method_id == 'PCIPAL'){
        Logger.error('afterBasketPaymentPOST.js PCI PAL payment');
        let paymentInstruments = basket.getPaymentInstruments();
        

        collections.forEach(paymentInstruments, function (basketPaymentInstrument) {
            var paymentMethod = basketPaymentInstrument.getPaymentMethod();
            Logger.error('paymentMethod : ' + paymentMethod);
            var transaction = basketPaymentInstrument.paymentTransaction;
            Logger.error('transaction : ' + transaction);
            transaction.custom.chaseApprovalStatus = paymentInstrument.c_chaseApprovalStatus;
            transaction.custom.chaseAutoDecisionResponse = paymentInstrument.c_chaseAutoDecisionResponse;
            transaction.custom.chaseCustomerReferenceNumber = paymentInstrument.c_chaseCustomerReferenceNumber;
            transaction.custom.chaseFraudStatusCode = paymentInstrument.c_chaseFraudStatusCode;
            transaction.custom.chaseMerchantId = paymentInstrument.c_chaseMerchantId;
            transaction.custom.chaseRespCode = paymentInstrument.c_chaseRespCode;
            transaction.custom.chaseRespDateTime = paymentInstrument.c_chaseRespDateTime;
            transaction.custom.chaseTxRefIdx = paymentInstrument.c_chaseTxRefIdx;
            transaction.custom.chaseTxRefNum = paymentInstrument.c_chaseTxRefNum;
        });
    }
    Logger.error('done in MTD in afterBasketPaymentPOST.js');
    return new Status(Status.OK);
}