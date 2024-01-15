/* global webreferences2 webreferences */
'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var SecureEncoder = require('dw/util/SecureEncoder');

exports.OAuthService = LocalServiceRegistry.createService('mtd.rest.oauth', {
    /**
     * Create Request
     *
     * @param {dw.svc.HTTPService} svc - HTTPService object
     * @param {Object} args - arguments
     * @returns {null} - result
     */
    createRequest: function (svc, args) {
        svc.addHeader('Content-Type', 'application/json');
        svc.setRequestMethod('POST');

        // Set URL with authentication params
        var url = svc.configuration.credential.URL;
        url += '?client_id=' + SecureEncoder.forUriComponent(args.clientId);
        url += '&client_secret=' + SecureEncoder.forUriComponent(args.clientSecret);
        url += '&username=' + SecureEncoder.forUriComponent(args.username);
        url += '&password=' + SecureEncoder.forUriComponent(args.password);
        url += '&grant_type=' + SecureEncoder.forUriComponent(args.grantType);
        svc.setURL(url);

        return null;
    },
    /**
     * Parse Response
     *
     * @param {dw.svc.HTTPService} svc - SVC object
     * @param {dw.net.HTTPClient} client - client response
     * @returns {Object} - response object
     */
    parseResponse: function (svc, client) {
        return JSON.parse(client.text);
    },
    /**
     * Get Request Log Message
     *
     * @param {Object} request - request
     * @returns {Object} - request object to log
     */
    getRequestLogMessage: function (request) {
        return request;
    },
    /**
     * Get Response Log Message
     *
     * @param {Object} response - response object
     * @returns {string} result to log
     */
    getResponseLogMessage: function (response) {
        try {
            var msg = '';
            var headers = response.getResponseHeaders();
            var keySetArray = headers.keySet().toArray();
            for (var i = 0, keyLength = keySetArray.length; i < keyLength; i++) {
                var header = keySetArray[i];
                msg += header + ':';
                var specificHeaders = headers.get(header);
                for (var j = 0, headerLength = specificHeaders.length; j < headerLength; j++) {
                    var headerValue = specificHeaders[j];
                    msg += headerValue + ((j === headerLength - 1) ? '\n' : '');
                }
            }
            msg += 'statusMessage:' + response.statusMessage + '\n';
            msg += 'statusCode:' + response.statusCode + '\n';
            msg += 'text:' + response.text + '\n';
            msg += 'errorText:' + response.errorText + '\n';
            return msg;
        } catch (e) {
            return response;
        }
    },
    /**
     * Sample Response
     */
    mockCall: function () {
    }
});

var commonRestMethods = {
    /**
     * Create Request
     *
     * @param {dw.svc.HTTPService} svc - HTTPService object
     * @param {Object} args - arguments
     * @returns {Object|null} - result
     */
    createRequest: function (svc, args) {
        svc.addHeader('Content-Type', 'application/json');
        svc.addHeader('Authorization', args.authorization);
        svc.setRequestMethod(args.method);

        if (args.method === 'POST') {
            return JSON.stringify(args.request);
        } else if (args.method === 'GET') {
            var url = svc.configuration.credential.URL;
            if (svc.configuration.ID === 'mtd.manuals') {
                url += '?modelNo=' + SecureEncoder.forUriComponent(args.modelNo);
                url += '&inclNotAvailOnline=no';
                if (args.serialNo && args.serialNo !== '') {
                    url += '&serialNo=' + SecureEncoder.forUriComponent(args.serialNo);
                }
                if (args.brandCode) {
                    url += '&brandCode=' + SecureEncoder.forUriComponent(args.brandCode);
                }
            }
            if (svc.configuration.ID === 'mtd.orderinquiry') {
                url += '?orderNumber=' + SecureEncoder.forUriComponent(args.trackOrderNumber);
            }

            if (svc.configuration.ID === 'mtd.rest.aftermarketlookup') {
                url += '?sourceSystem=' + SecureEncoder.forUriComponent(args.sourceSystem) + "&" +  'sourceOrderSiteId=' + SecureEncoder.forUriComponent(args.sourceOrderSiteId)  + "&" +  'countryCode=' + SecureEncoder.forUriComponent(args.countryCode) + "&" + 'serialNumber=' + SecureEncoder.forUriComponent(args.serialNumber);
            } //sourceSystem, sourceOrderSiteId, serialNumber
            svc.setURL(url);
        }
        return null;
    },
    /**
     * Parse Response
     *
     * @param {dw.svc.HTTPService} svc - SVC object
     * @param {dw.net.HTTPClient} client - client response
     * @returns {Object} - response object
     */
    parseResponse: function (svc, client) {
        return JSON.parse(client.text);
    },
    /**
     * Get Request Log Message
     *
     * @param {Object} request - request
     * @returns {Object} - request object to log
     */
    getRequestLogMessage: function (request) {
        return request;
    },
    /**
     * Get Response Log Message
     *
     * @param {Object} response - response object
     * @returns {string} result to log
     */
    getResponseLogMessage: function (response) {
        try {
            var msg = '';
            var headers = response.getResponseHeaders();
            var keySetArray = headers.keySet().toArray();
            for (var i = 0, keyLength = keySetArray.length; i < keyLength; i++) {
                var header = keySetArray[i];
                msg += header + ':';
                var specificHeaders = headers.get(header);
                for (var j = 0, headerLength = specificHeaders.length; j < headerLength; j++) {
                    var headerValue = specificHeaders[j];
                    msg += headerValue + ((j === headerLength - 1) ? '\n' : '');
                }
            }
            msg += 'statusMessage:' + response.statusMessage + '\n';
            msg += 'statusCode:' + response.statusCode + '\n';
            msg += 'text:' + response.text + '\n';
            msg += 'errorText:' + response.errorText + '\n';
            return msg;
        } catch (e) {
            return response;
        }
    },
    /**
     * Sample Response
     */
    mockCall: function () {
        /* return {
            statusCode: 200,
            statusMessage: "OK",
            text: '{"dealerAvailability":{"origin":{"postalCode":"64601","cityName":"Chillicothe","stateProvinceCode":"MO","countryCode":"US"},"dealerGroup":{"anyDealerAbleToDeliver":"YES","numberOfDealersInGroup":20,"dealers":[{"customerNumber":"1286901","dealerId":"12869","proximityToConsumer":61.565167078055296,"proximityToConsumerUnit":"m","ableToDeliver":"NO","dealerAddress":{"firstName":null,"lastName":null,"companyName":"JERRY\'S OUTDOOR EQUIPMENT","phone":"(816) 873-3000","address1":"206 NORTH 169 HIGHWAY","address2":null,"address3":null,"postalCode":"64089","city":"SMITHVILLE","state":"MO","countryCode":"US"},"dealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","quantity":1}]}]},"mtddealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","authorizedToOrder":"Y","itemWarehouse":"37E","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1}]}]}},{"customerNumber":"1231401","dealerId":"12314","proximityToConsumer":65.25560325628697,"proximityToConsumerUnit":"m","ableToDeliver":"NO","dealerAddress":{"firstName":null,"lastName":null,"companyName":"FAMILY CENTER FARM & HOME","phone":"(816) 749-7178","address1":"1301 SOUTH RIVERSIDE ROAD","address2":null,"address3":null,"postalCode":"64507","city":"ST JOSEPH","state":"MO","countryCode":"US"},"dealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","quantity":1}]}]},"mtddealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","authorizedToOrder":"Y","itemWarehouse":"37E","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1}]}]}},{"customerNumber":"901901","dealerId":"9019","proximityToConsumer":84.17263458774129,"proximityToConsumerUnit":"m","ableToDeliver":"NO","dealerAddress":{"firstName":null,"lastName":null,"companyName":"JERRY\'S OUTDOOR EQUIPMENT","phone":"(913) 721-1353","address1":"5333 NORTH 139TH STREET","address2":null,"address3":null,"postalCode":"66109","city":"KANSAS CITY","state":"KS","countryCode":"US"},"dealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","quantity":1}]}]},"mtddealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","authorizedToOrder":"Y","itemWarehouse":"37E","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1}]}]}},{"customerNumber":"226101","dealerId":"2261","proximityToConsumer":90.67717704086894,"proximityToConsumerUnit":"m","ableToDeliver":"NO","dealerAddress":{"firstName":null,"lastName":null,"companyName":"FAMILY CENTER & HOME","phone":"(816) 884-6100","address1":"2601 CANTRELL ROAD","address2":null,"address3":null,"postalCode":"64701","city":"HARRISONVILLE","state":"MO","countryCode":"US"},"dealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","quantity":1}]}]},"mtddealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","authorizedToOrder":"Y","itemWarehouse":"37E","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1}]}]}},{"customerNumber":"384001","dealerId":"3840","proximityToConsumer":95.09615042724073,"proximityToConsumerUnit":"m","ableToDeliver":"NO","dealerAddress":{"firstName":null,"lastName":null,"companyName":"OLATHE TURF & TRACTOR INC","phone":"(913) 782-0470","address1":"15484 SOUTH 169 HIGHWAY","address2":null,"address3":null,"postalCode":"66062","city":"OLATHE","state":"KS","countryCode":"US"},"dealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","quantity":2}]}]},"mtddealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","authorizedToOrder":"Y","itemWarehouse":"37E","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1}]}]}},{"customerNumber":"573401","dealerId":"5734","proximityToConsumer":110.63481709084816,"proximityToConsumerUnit":"m","ableToDeliver":"NO","dealerAddress":{"firstName":null,"lastName":null,"companyName":"FAMILY CENTER FARM & HOME","phone":"(913) 294-4800","address1":"808 BAPTISTE DRIVE","address2":null,"address3":null,"postalCode":"66071","city":"PAOLA","state":"KS","countryCode":"US"},"dealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","quantity":1}]}]},"mtddealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","authorizedToOrder":"Y","itemWarehouse":"37E","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1}]}]}},{"customerNumber":"1157401","dealerId":"11574","proximityToConsumer":1.3495305158235054,"proximityToConsumerUnit":"m","ableToDeliver":"YES","dealerAddress":{"firstName":null,"lastName":null,"companyName":"THE CARR SHOPPE  LLC","phone":"(660) 646-5999","address1":"70 CHERRY STREET","address2":null,"address3":null,"postalCode":"64601","city":"CHILLICOTHE","state":"MO","countryCode":"US"},"dealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","quantity":0}]}]},"mtddealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","authorizedToOrder":"Y","itemWarehouse":"37E","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1}]}]}},{"customerNumber":"197001","dealerId":"1970","proximityToConsumer":45.210026412439184,"proximityToConsumerUnit":"m","ableToDeliver":"NO","dealerAddress":{"firstName":null,"lastName":null,"companyName":"CROWN POWER & EQUIPMENT CO.","phone":"(660) 388-6425","address1":"WEST 103 STREET ROUTE 24","address2":null,"address3":null,"postalCode":"65281","city":"SALISBURY","state":"MO","countryCode":"US"},"dealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","quantity":0}]}]},"mtddealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","authorizedToOrder":"Y","itemWarehouse":"37E","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1}]}]}},{"customerNumber":"316201","dealerId":"3162","proximityToConsumer":51.96679184002276,"proximityToConsumerUnit":"m","ableToDeliver":"NO","dealerAddress":{"firstName":null,"lastName":null,"companyName":"LAFAYETTE COUNTY TRK & TRACTOR","phone":"(660) 584-3683","address1":"2810 HIGHWAY 13","address2":null,"address3":null,"postalCode":"64037","city":"HIGGINSVILLE","state":"MO","countryCode":"US"},"dealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","quantity":0}]}]},"mtddealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","authorizedToOrder":"Y","itemWarehouse":"37E","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1}]}]}},{"customerNumber":"496901","dealerId":"4969","proximityToConsumer":66.94603459554003,"proximityToConsumerUnit":"m","ableToDeliver":"NO","dealerAddress":{"firstName":null,"lastName":null,"companyName":"VETTER EQUIPMENT COMPANY","phone":"(641) 872-2000","address1":"2503 HIGHWAY 2","address2":null,"address3":null,"postalCode":"50060","city":"CORYDON","state":"IA","countryCode":"US"},"dealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","quantity":0}]}]},"mtddealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","authorizedToOrder":"Y","itemWarehouse":"21D","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1}]}]}},{"customerNumber":"496601","dealerId":"4966","proximityToConsumer":73.0222665583745,"proximityToConsumerUnit":"m","ableToDeliver":"NO","dealerAddress":{"firstName":null,"lastName":null,"companyName":"VETTER EQUIPMENT COMPANY","phone":"(641) 464-3268","address1":"1703 WEST SOUTH STREET","address2":null,"address3":null,"postalCode":"50854","city":"MT. AYR","state":"IA","countryCode":"US"},"dealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","quantity":0}]}]},"mtddealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","authorizedToOrder":"Y","itemWarehouse":"21D","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1}]}]}},{"customerNumber":"615801","dealerId":"6158","proximityToConsumer":85.38176740162682,"proximityToConsumerUnit":"m","ableToDeliver":"NO","dealerAddress":{"firstName":null,"lastName":null,"companyName":"CROWN POWER & EQUIPMENT  INC.","phone":"(573) 443-4541","address1":"1881 PRATHERSVILLE ROAD","address2":null,"address3":null,"postalCode":"65202","city":"COLUMBIA","state":"MO","countryCode":"US"},"dealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","quantity":0}]}]},"mtddealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","authorizedToOrder":"Y","itemWarehouse":"37E","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1}]}]}},{"customerNumber":"1127901","dealerId":"11279","proximityToConsumer":101.3291596717749,"proximityToConsumerUnit":"m","ableToDeliver":"NO","dealerAddress":{"firstName":null,"lastName":null,"companyName":"VETTER EQUIPMENT","phone":"(712) 542-5147","address1":"1020 SOUTH 12TH STREET","address2":null,"address3":null,"postalCode":"51632","city":"CLARINDA","state":"IA","countryCode":"US"},"dealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","quantity":0}]}]},"mtddealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","authorizedToOrder":"Y","itemWarehouse":"21D","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1}]}]}},{"customerNumber":"226401","dealerId":"2264","proximityToConsumer":101.58340821844305,"proximityToConsumerUnit":"m","ableToDeliver":"NO","dealerAddress":{"firstName":null,"lastName":null,"companyName":"FAMILY CTR. OF VERSAILLES","phone":"(573) 378-4533","address1":"13359 HIGHWAY 52","address2":null,"address3":null,"postalCode":"65084","city":"VERSAILLES","state":"MO","countryCode":"US"},"dealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","quantity":0}]}]},"mtddealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","authorizedToOrder":"Y","itemWarehouse":"37E","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1}]}]}},{"customerNumber":"255501","dealerId":"2555","proximityToConsumer":103.62655060835816,"proximityToConsumerUnit":"m","ableToDeliver":"NO","dealerAddress":{"firstName":null,"lastName":null,"companyName":"GREINER IMPLEMENT CO","phone":"(641) 683-1691","address1":"10845 73RD STREET","address2":null,"address3":null,"postalCode":"52501","city":"OTTUMWA","state":"IA","countryCode":"US"},"dealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","quantity":0}]}]},"mtddealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","authorizedToOrder":"Y","itemWarehouse":"21D","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1}]}]}},{"customerNumber":"497101","dealerId":"4971","proximityToConsumer":107.3387685916308,"proximityToConsumerUnit":"m","ableToDeliver":"NO","dealerAddress":{"firstName":null,"lastName":null,"companyName":"VETTER EQUIPMENT COMPANY","phone":"(515) 961-2541","address1":"9983 HIGHWAY 92","address2":null,"address3":null,"postalCode":"50125","city":"INDIANOLA","state":"IA","countryCode":"US"},"dealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","quantity":0}]}]},"mtddealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","authorizedToOrder":"Y","itemWarehouse":"21D","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1}]}]}},{"customerNumber":"196801","dealerId":"1968","proximityToConsumer":111.492789254602,"proximityToConsumerUnit":"m","ableToDeliver":"NO","dealerAddress":{"firstName":null,"lastName":null,"companyName":"CROWN POWER & EQUIPMENT CO.","phone":"(573) 392-0230","address1":"3369 HIGHWAY 52 WEST","address2":null,"address3":null,"postalCode":"65026","city":"ELDON","state":"MO","countryCode":"US"},"dealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","quantity":0}]}]},"mtddealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","authorizedToOrder":"Y","itemWarehouse":"37E","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1}]}]}},{"customerNumber":"196901","dealerId":"1969","proximityToConsumer":112.98005735719931,"proximityToConsumerUnit":"m","ableToDeliver":"NO","dealerAddress":{"firstName":null,"lastName":null,"companyName":"CROWN POWER & EQUIPMENT CO.","phone":"(573) 636-5281","address1":"3621 ROCKPORT HILLS ROAD","address2":null,"address3":null,"postalCode":"65101","city":"JEFFERSON CITY","state":"MO","countryCode":"US"},"dealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","quantity":0}]}]},"mtddealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","authorizedToOrder":"Y","itemWarehouse":"37E","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1}]}]}},{"customerNumber":"857301","dealerId":"8573","proximityToConsumer":114.02884000245851,"proximityToConsumerUnit":"m","ableToDeliver":"NO","dealerAddress":{"firstName":null,"lastName":null,"companyName":"HANNIBAL FARM & HOME SUPPLY","phone":"(573) 221-8444","address1":"2959 PALMYRA ROAD","address2":null,"address3":null,"postalCode":"63401","city":"HANNIBAL","state":"MO","countryCode":"US"},"dealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","quantity":0}]}]},"mtddealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","authorizedToOrder":"Y","itemWarehouse":"21D","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1}]}]}},{"customerNumber":"222101","dealerId":"2221","proximityToConsumer":115.05024970734854,"proximityToConsumerUnit":"m","ableToDeliver":"NO","dealerAddress":{"firstName":null,"lastName":null,"companyName":"ENNIS IMPLEMENT COMPANY","phone":"(573) 594-6473","address1":"1100 SOUTH MAIN STREET","address2":null,"address3":null,"postalCode":"63382","city":"VANDALIA","state":"MO","countryCode":"US"},"dealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","quantity":0}]}]},"mtddealerInventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","authorizedToOrder":"Y","itemWarehouse":"37E","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1}]}]}}]},"mtdConsumerInventory":{"mtdinventory":{"itemGroup":[{"label":"12AE76M8010","items":[{"itemNumber":"12AE76M8010","itemWarehouse":"33A","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1},{"itemNumber":"12AE76M8010","itemWarehouse":"37A","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1},{"itemNumber":"12AE76M8010","itemWarehouse":"37D","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1},{"itemNumber":"12AE76M8010","itemWarehouse":"37E","subToExists":"N","subToNumber":"","availableQuantity":0,"packageQuantity":1}]}]}}},"status":null}',
            timeout: 30000
        };*/
    }
};

exports.TaxService = LocalServiceRegistry.createService('mtd.rest.salestax', commonRestMethods);
exports.AddressService = LocalServiceRegistry.createService('mtd.rest.address', commonRestMethods);
exports.ManualsService = LocalServiceRegistry.createService('mtd.manuals', commonRestMethods);
exports.OrderInquiry = LocalServiceRegistry.createService('mtd.orderinquiry', commonRestMethods);
exports.DealerFulfillmentService = LocalServiceRegistry.createService('mtd.rest.dealerservice', commonRestMethods);
exports.AftermarketLookup = LocalServiceRegistry.createService('mtd.rest.aftermarketlookup', commonRestMethods);

