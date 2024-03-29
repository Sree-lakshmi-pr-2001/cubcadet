'use strict';

/**
 * @module init/rest
 */

/**
 * Marketing Cloud Connector
 * REST API webservice
 * Documentation:
 *  https://developer.salesforce.com/docs/atlas.en-us.mc-apis.meta/mc-apis/index-api.htm
 *  https://developer.salesforce.com/docs/atlas.en-us.mc-apis.meta/mc-apis/routes.htm
 *
 * Production Env: https://mc.exacttarget.com
 * Sandbox Env: https://mc.test.exacttarget.com
 *
 * Production API: https://www.exacttargetapis.com
 * QA API: https://www.qa.exacttargetapis.com
 */

const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const Logger = require('dw/system/Logger');

/**
 * Inserts auth token into request header
 * @param {dw.svc.HTTPService} svc
 * @throws {Error} Throws error when no valid auth token is available (i.e.- service error, service down)
 */
function setAuthHeader(svc, siteId) {
    /**
     * @type {module:models/authToken~AuthToken}
     */
    var authToken = require('int_marketing_cloud').authToken(siteId);
    var token = authToken.getValidToken(siteId);

    if (empty(token) || !token.accessToken) {
        throw new Error('No auth token available!');
    }

    svc.setAuthentication('NONE');
    svc.addHeader('Authorization', 'Bearer ' + token.accessToken);
}

/**
 * Check if 401 due to expired token
 * @param {dw.net.HTTPClient} client
 * @returns {boolean} true if expired auth token
 */
function isValid401(client) {
    var is401 = (client.statusCode === 401);
    var isFailureFromBadToken = false;
    var authResHeader = client.getResponseHeader('WWW-Authenticate');

    if (is401 && authResHeader) {
        isFailureFromBadToken = /^Bearer\s.+?invalid_token/.test(authResHeader);
    }

    return isFailureFromBadToken;
}

/**
 * Check if response type is JSON
 * @param {dw.net.HTTPClient} client
 * @returns {boolean}
 */
function isResponseJSON(client) {
    var contentTypeHeader = client.getResponseHeader('Content-Type');
    return contentTypeHeader && contentTypeHeader.split(';')[0].toLowerCase() === 'application/json';
}

/**
 * Parses response JSON and wraps with an object containing additional helper properties
 * @param {dw.svc.HTTPService} svc
 * @param {dw.net.HTTPClient} client
 * @returns {{responseObj: Object, isError: boolean, isAuthError: boolean, isValidJSON: boolean, errorText: string}}
 */
function parseResponse(svc, client) {
    var isJSON = isResponseJSON(client);
    var parsedBody;

    if (isJSON) {
        try {
            parsedBody = JSON.parse(client.text);
        } catch (e) {
            parsedBody = client.text;
        }
    } else {
        parsedBody = client.text;
    }

    return {
        isValidJSON: isJSON,
        isError: client.statusCode >= 400,
        isAuthError: isValid401(client),
        responseObj: parsedBody,
        errorText: client.errorText
    };
}

/**
 * Documentation: https://developer.salesforce.com/docs/atlas.en-us.mc-getting-started.meta/mc-getting-started/requestToken.htm
 * Production Endpoint: https://auth.exacttargetapis.com/v1/requestToken
 * Test Endpoint: https://auth-test.exacttargetapis.com/v1/requestToken
 * Method: POST
 * Content Type: JSON
 * Request Headers: -
 * Request Args: clientId, clientSecret
 */
module.exports.getAuthService = function (serviceID, iSiteId) {
    var useSiteId = iSiteId;
    Logger.error('mtd = get Auth Service');
    return LocalServiceRegistry.createService(serviceID, {
        /**
         * Create request for service authentication
         * @param {dw.svc.HTTPService} svc
         * @throws {Error} Throws error when service credentials are missing
         */
        createRequest: function(svc /*, params*/) {
            var origCredentialID = svc.getCredentialID() || svc.getConfiguration().getID(),
                credArr = origCredentialID.split('-'),
                credArrSiteID = credArr[credArr.length-1],
                siteID = require('dw/system/Site').current.ID;

            if (useSiteId){
                try {
                    svc.setCredentialID(credArr[0] + '-' + useSiteId);
                } catch(e) {
                    // site-specific credential doesn't exist, reset
                    svc.setCredentialID(origCredentialID);
                }
            } else {
                if (credArrSiteID !== siteID) {
                    // Attempt to set to site-specific credential
                    try {
                        svc.setCredentialID(credArr[0] + '-' + siteID);
                    } catch(e) {
                        // site-specific credential doesn't exist, reset
                        svc.setCredentialID(origCredentialID);
                    }
                }
            }
            Logger.debug('MC Connector credential ID: {0}', svc.getCredentialID());

            var svcCredential = svc.getConfiguration().credential;
            if (empty(svcCredential.user) || empty(svcCredential.password)) {
                throw new Error('Service configuration requires valid client ID (user) and secret (password)');
            }

            var requestBody = {
                clientId: svcCredential.user,
                clientSecret: svcCredential.password
            };
            Logger.error('mtd auth - ' + JSON.stringify(requestBody));
            svc.setAuthentication('NONE');
            svc.addHeader('Accept', 'application/json');

            return JSON.stringify(requestBody);
        },
        /**
         * @param {dw.svc.HTTPService} svc
         * @param {dw.net.HTTPClient} client
         * @returns {Object}
         */
        parseResponse : function(svc, client) {
            var responseObj;

            try {
                responseObj = JSON.parse(client.text);
                if (responseObj && responseObj.accessToken && responseObj.expiresIn) {
                    var responseDate = new Date(client.getResponseHeader('Date') || null); // Ensure we pass valid string or null

                    // Set the millisecond timestamp values
                    responseObj.issued = responseDate.valueOf();
                    responseObj.expires = responseDate.valueOf() + (responseObj.expiresIn * 1000);
                }
            } catch(e) {
                responseObj = client.text;
                Logger.error('Unable to Authenticate: {0}', responseObj);
            }

            return responseObj;
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
        mockCall: function (/*svc, requestBody*/) {
            var obj = {
                "accessToken": "7Gcb2QiDuMUhuTpZ5kv88o4W",
                "expiresIn": 3479
            };
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: JSON.stringify(obj)
            };
        }
    });
};

/**
 * Section: Platform
 * Name: Get Endpoints
 * Documentation: https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/getendpoints.htm
 * Endpoint: /platform/v1/endpoints
 * Method: GET
 * Content Type: JSON
 * Request Headers: Authorization
 * Request Args: -
 */
module.exports.getPlatformEndpoints = function (serviceID) {
    return LocalServiceRegistry.createService('marketingcloud.rest.platform.endpoints', {
        createRequest: function(svc /*, params*/) {
            var svcURL = svc.getConfiguration().credential.URL,
                svcPath = '/platform/v1/endpoints';

            setAuthHeader(svc);

            svc.setRequestMethod('GET');
            svc.addHeader('Accept', 'application/json');
            Logger.error('SBD SFMC - svcURL + svcPath : ' + svcURL + svcPath);
            svc.setURL(svcURL + svcPath);
        },
        parseResponse : parseResponse,
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
        mockCall: function (/*svc*/) {
            var obj = {
                "count": 8,
                "page": 1,
                "pageSize": 8,
                "items": [
                    {
                        "type": "editorSupportAssetHandler",
                        "url": "https://editorsupport.s7.exacttarget.com/asset.aspx?ac={{context}}&mck={{key}}"
                    },
                    {
                        "type": "ftp",
                        "url": "ftp://ftp.s7.exacttarget.com"
                    },
                    {
                        "type": "rest",
                        "url": "https://restapi.s7.exacttarget.com"
                    },
                    {
                        "type": "restAuth",
                        "url": "https://auth.exacttargetapis.com"
                    },
                    {
                        "type": "restInternal",
                        "url": "https://www.exacttargetapis.com"
                    },
                    {
                        "type": "restProd",
                        "url": "https://www.exacttargetapis.com"
                    },
                    {
                        "type": "soap",
                        "url": "https://webservice.s7.exacttarget.com/Service.asmx"
                    },
                    {
                        "type": "spellcheck",
                        "url": "https://app.s7.exct.net/spellcheck"
                    }
                ]
            };
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: JSON.stringify(obj)
            };
        }
    });
};

/**
 * Section: Platform
 * Name: Get Token Context
 * Documentation: https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/gettokencontext.htm
 * Endpoint: /platform/v1/tokenContext
 * Method: GET
 * Content Type: JSON
 * Request Headers: Authorization
 * Request Args: -
 */
module.exports.getTokenContext = function (serviceID) {
    return LocalServiceRegistry.createService('marketingcloud.rest.platform.tokenContext', {
        /**
         * @param {dw.svc.HTTPService} svc
         */
        createRequest: function(svc /*, params*/) {
            var svcURL = svc.configuration.credential.URL,
                svcPath = '/platform/v1/tokenContext';

            setAuthHeader(svc);

            svc.setRequestMethod('GET');
            svc.addHeader('Accept', 'application/json');

            svc.setURL(svcURL + svcPath);
        },
        parseResponse : parseResponse,
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
        mockCall: function (/*svc*/) {
            var obj = {
                "enterprise": {
                    "id": 1081365
                },
                "organization": {
                    "id": 1081365
                },
                "user": {
                    "id": 1093240
                }
            };
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: JSON.stringify(obj)
            };
        }
    });
};

/**
 * Section: Messaging
 * Name: Send Email
 * Documentation: https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/messageDefinitionSends.htm
 * Endpoint: /messaging/v1/messageDefinitionSends/{key}/send
 * Method: POST
 * Content Type: JSON
 * Request Headers: Authorization
 * Request Args: SendID, key
 */
module.exports.getMsgService = function (serviceID, iSiteId) {
    var siteId = iSiteId;
    var Site = require('dw/system/Site');
    return LocalServiceRegistry.createService(serviceID, {
    /**
     * Create request for sending an email
     * @param {dw.svc.HTTPService} svc
     * @param {module:models/message~Message} message A message model instance to be sent to Marketing Cloud
     * @returns {string} Request body
     */
     createRequest: function(svc, message) {
        var svcURL = svc.getConfiguration().credential.URL,
            svcPath = '/messaging/v1/messageDefinitionSends/{key}/send';

        var site = null;
        Logger.error('mtd - rest iSiteId=> ' + iSiteId);
        if (!empty(siteId)) {
            var sitesList = Site.getAllSites();

            while (sitesList.length > 0) {
                let tempSite = sitesList.shift();
                let tempSiteId = tempSite.getID();
                Logger.debug('checking ' + tempSiteId + ' vs passed in site ' + siteId );
                if (siteId == tempSiteId) {
                    site = tempSite;
                }
            }
        }
        if (site) {
            var keyPrefix = site.getCustomPreferenceValue('mcMessageKeyPrefix') ? site.getCustomPreferenceValue('mcMessageKeyPrefix') : '';
            Logger.debug('keyPrefix : ' + keyPrefix);
            svcPath = svcPath.replace('{key}', 'key:' + keyPrefix + message._private.sendKey);
        } else if (!empty(message._private.sendID)) {
            svcPath = svcPath.replace('{key}', message._private.sendID);
        } else if (!empty(message._private.sendKey)) {
            var keyPrefix = Site.current.getCustomPreferenceValue('mcMessageKeyPrefix') ? Site.current.getCustomPreferenceValue('mcMessageKeyPrefix') : '';
            svcPath = svcPath.replace('{key}', 'key:' + keyPrefix + message._private.sendKey);
        }

        setAuthHeader(svc, siteId);

        svc.addHeader('Accept', 'application/json');
        Logger.error('mtd - svcURL + svcPath : ' + svcURL + svcPath);
        svc.setURL(svcURL + svcPath);

        return JSON.stringify(message);
    },
    /**
     * @param {dw.svc.HTTPService} svc
     * @param {dw.net.HTTPClient} client
     * @returns {{responseObj, isAuthError: boolean, isValidJSON: boolean}}
     */
    parseResponse : function(svc, client){
        var obj = parseResponse(svc, client);
        // Location value is used for deliveryRecord check
        obj.location = client.getResponseHeader('Location');
        obj.requestId = client.getResponseHeader('X-Mashery-Message-ID');
        Logger.error('mtd - Message response: {0}', JSON.stringify(obj));
        return obj;
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
    mockCall: function (/*svc, requestBody*/) {
        var obj = {
            "requestId": "f04952b5-49ae-4d66-90a4-c65be553db1f",
            "responses": [
                {
                    "recipientSendId": "f04952b5-49ae-4d66-90a4-c65be553db1f",
                    "hasErrors": false,
                    "messages": [
                        "Queued"
                    ]
                }
            ]
        };
        return {
            statusCode: 202,
            statusMessage: 'Accepted',
            text: JSON.stringify(obj)
        };
    }
    });
};

/**
 * Section: Messaging
 * Name: Get Email Delivery Details
 * Documentation: https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/messageDefinitionSendsDeliveryRecords.htm
 * Endpoint: /messaging/v1/messageDefinitionSends/{key}/deliveryRecords/{recipientSendID}
 * Method: GET
 * Content Type: JSON
 * Request Headers: Authorization
 * Request Args: SendID, key, RecipientSendID
 */
module.exports.getDeliveryRecordsSvc = function (serviceID) {
    return LocalServiceRegistry.createService('marketingcloud.rest.messaging.deliveryRecords', {
        /**
         * Create request for viewing delivery records
         * @param {dw.svc.HTTPService} svc
         * @param {string} sendID
         * @param {string} customerKey
         * @param {string} recipientSendID
         */
        createRequest: function(svc, sendID, customerKey, recipientSendID) {
            var svcURL = svc.getConfiguration().credential.URL,
                svcPath = '/messaging/v1/messageDefinitionSends/{key}/deliveryRecords/{recipientSendID}';

            if (!empty(sendID)) {
                svcPath = svcPath.replace('{key}', sendID);
            } else if (!empty(customerKey)) {
                svcPath = svcPath.replace('{key}', 'key:'+ customerKey);
            }

            svcPath = svcPath.replace('{recipientSendID}', recipientSendID);

            setAuthHeader(svc);

            svc.setRequestMethod('GET');
            svc.addHeader('Accept', 'application/json');

            svc.setURL(svcURL + svcPath);
        },
        parseResponse : parseResponse,
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
        mockCall: function (/*svc*/) {
            var obj = {
                "deliveryTime": "2014-09-18T07:38:34.943",
                "id": "bd52a488-2f5c-de11-92ee-001cc494ae9e",
                "messageId": "a7038ea5-51b7-4574-ac22-183654378dd2",
                "status": "Sent",
                "to": {
                    "address": "example@example.com",
                    "id": 195711367,
                    "key": "example@example.com"
                }
            };
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: JSON.stringify(obj)
            };
        }
    });
};

/**
 * Section: Interaction
 * Name: Post Event
 * Documentation: https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/postEvent.htm
 * Endpoint: /interaction/v1/events
 * Method: POST
 * Content Type: JSON
 * Request Headers: Authorization
 * Request Args: -
 */
module.exports.getDeliveryRecordsSvc = function (serviceID) {
    return LocalServiceRegistry.createService('marketingcloud.rest.interaction.events', {
        /**
         * Create request for posting an event
         * @param {dw.svc.HTTPService} svc
         * @param {module:models/event~Event} event An event model instance to be sent to Marketing Cloud
         * @returns {string} Request body
         */
        createRequest: function(svc, event) {
            var svcURL = svc.getConfiguration().credential.URL,
                svcPath = '/interaction/v1/events';

            setAuthHeader(svc);

            svc.addHeader('Accept', 'application/json');

            svc.setURL(svcURL + svcPath);

            return JSON.stringify(event);
        },
        parseResponse : parseResponse,
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
        mockCall: function (/*svc, requestBody*/) {
            var obj = {
                "requestId": "f04952b5-49ae-4d66-90a4-c65be553db1f",
                "responses": [
                    {
                        "eventInstanceId": "f04952b5-49ae-4d66-90a4-c65be553db1f"
                    }
                ]
            };
            return {
                statusCode: 202,
                statusMessage: 'Accepted',
                text: JSON.stringify(obj)
            };
        }
    });
};
