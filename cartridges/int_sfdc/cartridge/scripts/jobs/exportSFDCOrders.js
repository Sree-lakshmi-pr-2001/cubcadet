'use strict';

var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');


var count = 0;

function execute(params) {
    Logger.info('Starting exportSFDCOrders job...');

    try {
        OrderMgr.processOrders(processSFDCOrders, 'custom.isSFDCSynced = {0}','N');

        if (count == 0) {
            Logger.info('No SFDC orders to be processed.');
            return new Status(Status.OK, 'No SFDC orders', 'exportSFDCOrders job finished with No SFDC orders');
        }

        return new Status(Status.OK, 'OK', 'exportSFDCOrders job finished.');

    } catch (e) {
        Logger.error('exportSFDCOrders error - ' + e.toString());
        return new Status(Status.ERROR, 'ERROR', e.toString());
    }
}

function processSFDCOrders(order) {
    var siteId = Site.current.ID;
    count++;

    try {

        // Process SFDC  Orders Pending for syncing
        if (siteId !== 'epcotca' && order.custom.isSFDCSynced == 'N') {
            var result = syncOrder(order);
            Logger.info('processSFDCOrders -Order Number : ' + order.currentOrderNo + ' updated with isOrderSynced : '+ result.isOrderSynced );

            Transaction.wrap(function () {
               order.custom.isSFDCSynced = result.isOrderSynced ? 'Y' : 'N';
            });
        }

    } catch (e) {
        Logger.error('processSFDCOrders - processSFDCOrders error - ' + e.toString());
    }
}

function syncOrder(order) {
    var SFDCStatusService = require('~/cartridge/scripts/services/SFDCServices');


    if (order.custom.SfdcCaseNumber) {
        updateSFDCResult = SFDCStatusService.updateSFDCStatus(
            order.custom.SfdcCaseNumber,
            order.currentOrderNo,
            order.totalGrossPrice.value,
            order.status.displayValue
        );
    }
    return {    isOrderSynced: updateSFDCResult.isOrderSynced
            }
       
}

exports.execute = execute;
