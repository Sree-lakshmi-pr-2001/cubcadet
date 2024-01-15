'use strict';

var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');

/**
 * Execute a job that ping failed Chase servers.
 * If failed server is available again we mark it like available.
 *
 * @param {Object} args - arguments
 * @returns {dw.system.Status} - Status of the job
 */
exports.execute = function () {
    /**
     * Include dependencies within current function to have access to site custom preferences
     */
    var Util = require('~/cartridge/scripts/helpers/Util');
    var SoapServices = require('~/cartridge/scripts/services/SoapServices');

    // This data is used to have a decline but it will show that endpoint works fine
    var testPaymentData = {
        cardType: 'Visa',
        customerRefNum: null,
        cardNumber: '4111111111111111',
        cardExpiration: '201801',
        cvv: '111',
        fullName: 'Tester Payer',
        address1: '1913 Sherman Ave',
        address2: 'Apt D2',
        city: 'Evanston',
        state: 'IL',
        zip: '60201',
        countryCode: 'US',
        phone: '3333-333-333',
        amount: '1',
        orderId: '0000001'
    };
    try {
        var serverCOs = CustomObjectMgr.queryCustomObjects(Util.VALUE.CONNECTIVITY_STATE_CO, 'custom.isFailed = true', 'custom.serverID asc');
        if (serverCOs.count > 0) {
            var serverList = serverCOs.asList();
            for (var i = 0, count = serverCOs.count; i < count; i++) {
                var server = serverList[i];
                // Make API call
                var result = SoapServices.ChaseService.call({
                    data: testPaymentData,
                    url: server.custom.serverURL,
                    type: 'authorize'
                });
                if (result.ok) {
                    Transaction.wrap(function () { // eslint-disable-line no-loop-func
                        server.custom.isFailed = false; // eslint-disable-line no-param-reassign
                        server.custom.failedTime = null; // eslint-disable-line no-param-reassign
                    });
                }
            }
        }
    } catch (e) {
        Util.log.error('PING JOB ERROR: {0} - {1}', e, e.stack);
        return new Status(Status.ERROR, 'ERROR');
    }
    return new Status(Status.OK, 'OK');
};
