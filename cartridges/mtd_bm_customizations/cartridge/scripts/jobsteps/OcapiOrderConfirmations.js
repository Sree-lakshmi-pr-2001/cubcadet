/**
 * Job Step Type Sends Order Confirmations for Epcot US / CA
 */
'use strict';
const Logger = require('dw/system/Logger');
const Status = require('dw/system/Status');
const OrderMgr = require('dw/order/OrderMgr');
const Site = require('dw/system/Site');
const Transaction = require('dw/system/Transaction');
const emailHelper = require('../helpers/emailHelper');
const HashMap = require('dw/util/HashMap');

/**
 * Bootstrap function for the Job
 *
 * @return {dw.system.Status} Exit status for a job run
 */
var run = function () {
    Logger.error('\n\nOcapiOrderConfirmations.js start');
    var siteMap = getSitesBySiteIdMap();
    var queryString = 'custom.orderConfirmationEmailSent = {0}';
    var orderItr = OrderMgr.queryOrders(queryString, 'orderNo ASC', 'N', true);
    const orderCount = orderItr.count
    Logger.error('# of orders found => ' + orderCount);
    while (orderItr.hasNext()) {
        var order = orderItr.next();
        let orderNumber = order.orderNo;
        let commerceBrandUsedByOrder = order.custom.commerceStore;
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var keyPrefixObj = CustomObjectMgr.getCustomObject('epcotReplacementCustomObj',order.custom.commerceStore);

        if (siteMap.containsKey(commerceBrandUsedByOrder)) {
            let siteObject = siteMap.get(commerceBrandUsedByOrder);
            Logger.error('order #' + orderNumber + ' is using site: ' + commerceBrandUsedByOrder + ' and IS in SFCC');
            Transaction.wrap(function () {
                order.custom.orderConfirmationEmailSent = 'W';
            });
            emailHelper.sendOrderConfirmation(orderNumber, siteObject);

        } else if(keyPrefixObj && keyPrefixObj.custom.siteId && siteMap.containsKey(keyPrefixObj.custom.siteId) ){
            var siteObject = siteMap.get(keyPrefixObj.custom.siteId);
            Logger.error('order #' + orderNumber + ' is using site: ' + commerceBrandUsedByOrder + ' and IS in SFCC');
            Transaction.wrap(function () {
                order.custom.orderConfirmationEmailSent = 'W';
            });
            var sendEmailFromSFCC = Site.current.getCustomPreferenceValue('sendEmailsFromSFCC');
                if(sendEmailFromSFCC){
                    var isMailSent = emailHelper.sendOrderConfirmationFromSFCC(orderNumber);
                    if(isMailSent.error == false && isMailSent.code == 'OK'){
                        Transaction.wrap(function() {
                            order.custom.orderConfirmationEmailSent = 'Y';
                        });
                    } else {
                        Transaction.wrap(function() {
                            order.custom.orderConfirmationEmailSent = 'N';
                        });
                    }
                } else {
                    emailHelper.sendOrderConfirmation(orderNumber, siteObject);
                }
        } else {
            Logger.error('order #' + orderNumber + ' is using site: ' + commerceBrandUsedByOrder + ' and that is not an site in SFCC');
        }
    }
    Logger.error('OcapiOrderConfirmations.js done\n\n');
    Logger.error('--------');
    return new Status(Status.OK);
}

function getSitesBySiteIdMap() {
    var siteMap = new HashMap();
    var sitesList = Site.getAllSites();
    while (sitesList.length > 0) {
        let siteObject = sitesList.shift();
        let commerceBrandCode = siteObject.getCustomPreferenceValue('commerceStore');
        var siteId = siteObject.ID;
        // this commerceStore/commerceBrandCode stores MTDPartsDotCom, MTDPartsDotCa, etc code that is used by the order service
        if(commerceBrandCode){
            siteMap.put(commerceBrandCode,siteObject);
        } else {
            siteMap.put(siteId,siteObject);
        }
    }
    return siteMap;
}

exports.Run = run;
