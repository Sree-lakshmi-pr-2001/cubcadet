'use strict';
/* global session request empty */
var server = require('server');
var Logger = require('dw/system/Logger');

server.post('HandleFraudReview', function (req, res) {
    var xmlHelper = require('~/cartridge/scripts/helpers/xmlHelper');
    var parameterMap = request.httpParameterMap;
    var xmlEntries = xmlHelper.parseXml(parameterMap.requestBodyAsString);

    Logger.error('welcome to HandleFraudReview : ' + parameterMap.requestBodyAsString);
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var chaseSecurityHelper = require('~/cartridge/scripts/helpers/chaseSecurityHelper');
    var Transaction = require('dw/system/Transaction');
    var apiKey = parameterMap.apiKey.stringValue;
    var success = false;
    if (xmlEntries && xmlEntries.events && xmlEntries.events.event) {
        var events = xmlEntries.events.event;
        Logger.error('events = ' + JSON.stringify(events));

        if (!Array.isArray(events)) {
            events = [events];
        }
        for (var i = 0; i < events.length; i++) {
            var event = events[i];
            Logger.error('event => ' + JSON.stringify(event));
            var eventKey = event.key;
            var orderNo = eventKey.order_number;
            var newValue = event.new_value;
            var responseSiteID = eventKey.site;

            if (chaseSecurityHelper.validateEndpoint(apiKey, responseSiteID)) {
                success = true;

                var order = !empty(orderNo) ? OrderMgr.getOrder(orderNo) : null;

                if (!empty(order)) {
                    if (newValue == 'A') { // eslint-disable-line
                        if (order.custom.fraudManualReviewStatus == 'reviewApproved') { // eslint-disable-line
                            Logger.error('in HandleFraudReview endpoint, orderNo = ' + orderNo + ' trying to approve an order that was already approved');
                        } else {
                            Logger.error('in HandleFraudReview endpoint, orderNo = ' + orderNo + ' approving order => ' + order.custom.fraudManualReviewStatus);
                            Transaction.wrap(function () { // eslint-disable-line
                                // order.setExportStatus(Order.EXPORT_STATUS_READY); // Ready for Export status is set under Global Trade Compliance Job
                                order.custom.fraudManualReviewStatus = 'reviewApproved';
                                order.custom.orderConfirmationEmailSent = 'N';
                                var orderGTCStatus = order.custom.globalComplianceCheckStatus;
                                if(orderGTCStatus != 'MANULA' && orderGTCStatus != 'APPROVED' && orderGTCStatus != 'NOT_APPROVED' && orderGTCStatus != 'NOT_APPLICABLE' && orderGTCStatus == 'PENDING' ){
                                    order.custom.globalComplianceCheckStatus = 'PENDING';
                                }
                                order.setStatus(4);
                            });
                        }
                        // Logger.error('Review to Approve flow for order {0} and site {1} ', orderNo, responseSiteID);
                    } else if (newValue == 'D') { // eslint-disable-line
                        if (order.custom.fraudManualReviewStatus == 'reviewDeclinedProcessed') { // eslint-disable-line
                            Logger.error('in HandleFraudReview endpoint, orderNo = ' + orderNo + ' trying to decline an order that was already declined');
                        } else {
                            Logger.error('in HandleFraudReview endpoint, orderNo = ' + orderNo + ' declining order => ' + order.custom.fraudManualReviewStatus);
                            Transaction.wrap(function () { // eslint-disable-line
                                order.custom.fraudManualReviewStatus = 'reviewDeclinedNotProcessed';
                            });
                            // Logger.error('Review to Decline flow for order {0} and site {1} ', orderNo, responseSiteID);
                        }
                    } else {
                        Logger.error('order #' + orderNo + ' new Value ' + newValue + ' not handled');
                    }
                } else {
                    Logger.error('order #' + orderNo + ' not found');
                }
            } else {
                Logger.error('could not validate apiKey : ' + apiKey + ', to responseSiteID : ' + responseSiteID);
            }
        }
    } else {
        Logger.error('no events');
    }

    if (success) {
        Logger.error('sending 200 for HandleFraudReview');
        res.setStatusCode(200);
    } else {
        Logger.error('sending 400 for HandleFraudReview');
        res.setStatusCode(400);
    }
});

module.exports = server.exports();
