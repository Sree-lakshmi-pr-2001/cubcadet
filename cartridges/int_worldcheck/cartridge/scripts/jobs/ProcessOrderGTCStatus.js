'use strict';

var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var emailHelpers = require('org_mtd/cartridge/scripts/helpers/emailHelpers');


var count = 0;

function execute(params) {
    Logger.info('Starting ProcessOrdersGTCStatus job...');

    try {
        var startDate = !empty(params.StartDate) ? new Date(params.StartDate) : null;
        var daysOffset = !empty(params.DaysOffset) ? Number(params.DaysOffset) : 5;

        if (empty(startDate)) {
            startDate = new Date();
            var dateMilli = startDate.getTime();
            var offset = 1000 * 60 * 60 * 24 * daysOffset; // days in milliseconds
            startDate.setTime(dateMilli - offset);
        }
        OrderMgr.processOrders(processGTCOrders, 'exportStatus = {0} AND (status = {1} OR status = {2} AND creationDate >= {3})', Order.EXPORT_STATUS_NOTEXPORTED, Order.ORDER_STATUS_NEW, Order.ORDER_STATUS_OPEN, startDate);

        if (count == 0) {
            Logger.info('No orders to be processed.');
        }

        return new Status(Status.OK, 'OK', 'ProcessOrdersGTCStatus job finished.');

    } catch (e) {
        Logger.error('ProcessOrdersGTCStatus error - ' + e.toString());
        return new Status(Status.ERROR, 'ERROR', e.toString());
    }
}

function processGTCOrders(order) {
    var COHelpers = require('org_mtd/cartridge/scripts/checkout/checkoutHelpers');
    var siteId = Site.current.ID;
    count++;

    try {

        // Process GTC Check PENDING Orders
        if (siteId !== 'epcotca' && siteId !== 'epcotus' && order.custom.globalComplianceCheckStatus == 'PENDING') {
            var result = checkGTC(order);

            Transaction.wrap(function () {
               order.custom.globalComplianceCheckStatus = result.isGTCApproved ? 'APPROVED' : 'MANUAL';
            });

            // var gtcResponse = result.gtcResponse ? JSON.stringify(result.gtcResponse) : null;
            var shippingGTCResponse = result.shippingGTCResponse ? JSON.stringify(result.shippingGTCResponse) : '';
            var billingGTCResponse = result.billingGTCResponse ? JSON.stringify(result.billingGTCResponse) : '';
           
            if (!result.isGTCApproved) {
                sendReviewNotification(order,shippingGTCResponse,billingGTCResponse);
            }
        }


        // Process GTC Check APPROVED Orders

        if (order.custom.globalComplianceCheckStatus == 'APPROVED') {
            if (order.paymentInstrument.paymentMethod == 'CREDIT_CARD' && ((!('fraudManualReviewStatus' in order.custom)) || order.custom.fraudManualReviewStatus == '' || order.custom.fraudManualReviewStatus == 'reviewApproved')) {
                Transaction.wrap(function () {
                    order.setExportStatus(Order.EXPORT_STATUS_READY);
                });
            } else if (order.paymentInstrument.paymentMethod === 'TD_FINANCE' && ((!('fraudManualReviewStatus' in order.custom)) || order.custom.fraudManualReviewStatus == '' || order.custom.fraudManualReviewStatus == 'reviewApproved')) {
                Transaction.wrap(function () {
                    order.setExportStatus(Order.EXPORT_STATUS_READY);
                });
            } else if (order.paymentInstrument.paymentMethod === 'PCIPAL' || order.paymentInstrument.paymentMethod === 'NO_CHARGE') {
                Transaction.wrap(function () {
                    order.setExportStatus(Order.EXPORT_STATUS_READY);
                });
            }
            // else verification can be added for EPCOT later
        }

        // Process GTC Check NOT_APPROVED Orders
        if (order.custom.globalComplianceCheckStatus == 'NOT_APPROVED') {
            if (order.paymentInstrument.paymentMethod === 'CREDIT_CARD' || order.paymentInstrument.paymentMethod === 'TD_FINANCE' || order.paymentInstrument.paymentMethod === 'PCIPAL' || order.paymentInstrument.paymentMethod === 'NO_CHARGE') {
                COHelpers.makePaymentVoid(order.orderNo, order.paymentInstrument);
                var sendEmailFromSFCC = Site.current.getCustomPreferenceValue('sendEmailsFromSFCC');
                var emailHelper = require('mtd_bm_customizations/cartridge/scripts/helpers/emailHelper');
                Transaction.wrap(function () {
                    OrderMgr.cancelOrder(order);
                    if (sendEmailFromSFCC) {
                        if (siteId == 'epcotca' || siteId == 'epcotus') {
                            emailHelper.sendOrderCancellationFormSFCC(order.orderNo);
                        } else {
                            emailHelpers.sendDeclinedEmailFromSFCC(order);
                        }
                        
                    } else {
                        emailHelpers.sendDeclinedEmail(order);
                    }
                });
            }
        }

    } catch (e) {
        Logger.error('ProcessOrdersGTCStatus - processGTCOrders error - ' + e.toString());
    }
}

function checkGTC(order) {
    var GTCStatusService = require('~/cartridge/scripts/services/GTCStatusService');

    var shippingCheckStatus = null;
    var billingCheckStatus = null;
    var shippingGTCResult = null;
    var billingGTCResult = null;

   // if isDealerPickupDelivery is false call GTC check
    if (!isDealerPickupDelivery(order) && order.defaultShipment && order.defaultShipment.shippingAddress) {
        shippingGTCResult = GTCStatusService.checkCompliance(
            order.defaultShipment.shippingAddress.firstName,
            order.defaultShipment.shippingAddress.lastName,
            order.defaultShipment.shippingAddress.countryCode.value
        );

        shippingCheckStatus = shippingGTCResult.isGTCApproved;
        var statusNoteShip = {
            decision: shippingGTCResult && shippingGTCResult.isGTCApproved ? 'APPROVED' : 'MANUAL',
            timestamp: new Date().toISOString()
        };
        if (shippingGTCResult.error) {
            statusNoteShip.error = true;
            statusNoteShip.errorMessage = shippingGTCResult.errorMessage.message || '';
            statusNoteShip.errorCode = shippingGTCResult.errorMessage.statusCode;
        }
        order.addNote('Trade Compliance Result - Shipping', JSON.stringify(statusNoteShip));
    }

    if (isDealerPickupDelivery(order) && order.defaultShipment && order.defaultShipment.shippingAddress) {
        shippingGTCResult = GTCStatusService.checkCompliance(
            order.defaultShipment.shippingAddress.firstName,
            order.defaultShipment.shippingAddress.lastName,
            order.defaultShipment.shippingAddress.countryCode.value
        );

        shippingCheckStatus = shippingGTCResult.isGTCApproved;
        var statusNoteShip = {
            decision: shippingGTCResult && shippingGTCResult.isGTCApproved ? 'APPROVED' : 'MANUAL',
            timestamp: new Date().toISOString()
        };
        if (shippingGTCResult.error) {
            statusNoteShip.error = true;
            statusNoteShip.errorMessage = shippingGTCResult.errorMessage.message || '';
            statusNoteShip.errorCode = shippingGTCResult.errorMessage.statusCode;
        }
        order.addNote('Trade Compliance Result - Shipping', JSON.stringify(statusNoteShip));
    }

    // if shippingCheckStatus is null or (order billing address firstName and lastName are different from the ones on shipping address)
    if (shippingCheckStatus == null || (order.billingAddress.firstName != order.defaultShipment.shippingAddress.firstName || order.billingAddress.lastName != order.defaultShipment.shippingAddress.lastName)) {
        billingGTCResult = GTCStatusService.checkCompliance(
            order.billingAddress.firstName,
            order.billingAddress.lastName,
            order.billingAddress.countryCode.value
        );

        billingCheckStatus = billingGTCResult.isGTCApproved;
        var statusNoteBill = {
            decision: billingGTCResult && billingGTCResult.isGTCApproved ? 'APPROVED' : 'MANUAL',
            timestamp: new Date().toISOString()
        };
        if (billingGTCResult.error) {
            statusNoteBill.error = true;
            statusNoteBill.errorMessage = billingGTCResult.errorMessage.message || '';
            statusNoteBill.errorCode = billingGTCResult.errorMessage.statusCode;
        }
        order.addNote('Trade Compliance Result - Billing', JSON.stringify(statusNoteBill));
    }

    // shippingCheckStatus and billingCheckStatus can be null (checking was skipped) or true (checking was performed and approved), however they cannot be both null at the same time
    var generalCTGStatusApproved = (shippingCheckStatus == null || shippingCheckStatus == true) && (billingCheckStatus == null || billingCheckStatus == true) && (shippingCheckStatus != null || billingCheckStatus != null);
    var shippingGTCRes;
    var billingGTCRes;

    if (shippingGTCResult && shippingGTCResult.error) {
        shippingGTCRes = statusNoteShip;
    } else if (shippingGTCResult && shippingGTCResult.response) {
        shippingGTCRes = shippingGTCResult.response;
    }

    if (billingGTCResult && billingGTCResult.error) {
        billingGTCRes = statusNoteBill;
    } else if (billingGTCResult && billingGTCResult.response) {
        billingGTCRes = billingGTCResult.response;
    } else if (billingGTCResult == null && (order.billingAddress.firstName == order.defaultShipment.shippingAddress.firstName) && (order.billingAddress.lastName == order.defaultShipment.shippingAddress.lastName)){
        billingGTCRes = shippingGTCResult.response;
    }

    return { isGTCApproved: generalCTGStatusApproved,
        shippingGTCResponse: shippingGTCRes,
        billingGTCResponse: billingGTCRes
    };
}

function isDealerPickupDelivery(order) {
    var dealerPickupMethodID = Site.current.getCustomPreferenceValue('mtdDealerPickupMethodId');
    if (!dealerPickupMethodID || dealerPickupMethodID == '') {
        return false;
    }

    if (order.defaultShipment && !empty(order.defaultShipment.shippingMethodID)) {
        var shippingMethodID = order.defaultShipment.shippingMethodID;
        if (shippingMethodID === dealerPickupMethodID) {
            return true;
        }
    }

    return false;
}

function sendReviewNotification(order,shippingGTCResponse,billingGTCResponse) {
    var system = require('dw/system/System');
    var Bytes = require('dw/util/Bytes');
    var Encoding = require('dw/crypto/Encoding');
    var orderNoBytes = Bytes(order.orderNo);
    var encodedOrderNo = Encoding.toBase64(orderNoBytes);

    var subjectPrefix = '';
    if (system.getInstanceType() !== system.PRODUCTION_SYSTEM) {
        subjectPrefix += '(TEST) - ';
    }
    subjectPrefix += Site.getCurrent().getName() + ' - ';
    var customerServiceEmail = Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com';

    var emailObj = {
        to: Site.current.getCustomPreferenceValue('GTCNotificationEmail'),
        subject: subjectPrefix + 'Compliance Check Request',
        from: customerServiceEmail
    };

    var customerInfo = JSON.stringify({
        customer:{
            Shipping:{
                Name: order.defaultShipment.shippingAddress.firstName +','+order.defaultShipment.shippingAddress.lastName,
                AddressLine1: order.defaultShipment.shippingAddress.address1,
                AddressLine2: order.defaultShipment.shippingAddress.address2,
                City: order.defaultShipment.shippingAddress.city,
                Province : order.defaultShipment.shippingAddress.stateCode,
                Zipcode: order.defaultShipment.shippingAddress.postalCode
            },
            Billing:{
                Name: order.billingAddress.firstName +','+order.billingAddress.lastName,
                AddressLine1: order.billingAddress.address1,
                AddressLine2: order.billingAddress.address2,
                City: order.billingAddress.city,
                Province : order.billingAddress.stateCode,
                Zipcode: order.billingAddress.postalCode
            }
        }
    });

    var template = 'mail/gtcNotification';
    var context = {
        orderId: order.orderNo,
        customerInfo: customerInfo,
        shippingGTCResponse: shippingGTCResponse,
        billingGTCResponse: billingGTCResponse,
        encodedOrderNo: encodedOrderNo,
        siteName : Site.getCurrent().getName()
    };

    Transaction.wrap(function () {
        emailHelpers.send(emailObj, template, context);
    });
}

exports.execute = execute;

