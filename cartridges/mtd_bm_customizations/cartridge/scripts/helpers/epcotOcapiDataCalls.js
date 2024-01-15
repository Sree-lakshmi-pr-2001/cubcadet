const Logger = require('dw/system/Logger').getLogger('OCAPI', 'epcotOcapiDataCalls.js');
const Site = require('dw/system/Site');
const net = require('dw/net');
const epcotOcapiHelper = require('./epcotOcapiHelper');
const requestHelper = require('./requestHelper');


function updateOrderStatus(accessToken, site, orderNumber, status, clientId) {
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const dataPrefix = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_DATA_URL")

    Logger.info("updateOrderStatus, site : " + site + ", accessToken : " + accessToken);

    let url = hostName + dataPrefix + "sites/" + site + "/orders/" + orderNumber +"/status?client_id=" + clientId;

    Logger.info('OCAPI url to update order status: ' + url);

    let postData = {
        "status" : status
    };

    let httpResponse = requestHelper.sendRequest(url, accessToken, postData, "PUT", false, 'application/json');
    Logger.info(' httpResponse.statusCode ' + httpResponse.statusCode);
    if (httpResponse.statusCode === 204 || httpResponse.statusCode === '204'){
        Logger.info('Order status updated successfully for Order: ' + orderNumber);
        return true;
    } else {
        Logger.error('Order status not updated for Order: ' + orderNumber);
        return false;
    }
}

function patchOrderPaymentTransaction(accessToken, site, orderNumber, paymentInstrumentId, payload, clientId) {
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const dataPrefix = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_DATA_URL")

    Logger.error("updateOrderExportStatus, site : " + site + ", accessToken : " + accessToken);
    // https://{{sfcc_ocapi_host}}/s/-/dw/data/{{sfcc_ocapi_version}}/sites/{{sfcc_ocapi_site}}/orders/{{sfcc_ocapi_order_number}}/payment_instruments/{{sfcc_ocapi_payment_instrument_id}}/transaction?client_id={{sfcc_ocapi_client_id}}
    let url = hostName + dataPrefix + "sites/" + site + "/orders/" + orderNumber +"/payment_instruments/" + paymentInstrumentId + "/transaction?client_id=" + clientId;

    Logger.error(url);

    let httpResponse = requestHelper.sendRequest(url, accessToken, payload, "PATCH", false, 'application/json');
    Logger.error('httpResponse.statusCode ' + httpResponse.statusCode);
    if (httpResponse.statusCode === 204 || httpResponse.statusCode === '204'){
        return true;
    } else {
        return false;
    }
}

function updateOrderExportStatus(accessToken, site, orderNumber, status, clientId) {
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const dataPrefix = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_DATA_URL")

    Logger.info("updateOrderExportStatus, site : " + site + ", accessToken : " + accessToken);

    let url = hostName + dataPrefix + "sites/" + site + "/orders/" + orderNumber +"/export_status?client_id=" + clientId;

    Logger.info('OCAPI url to update order export status: ' + url);

    let postData = {
        "status" : status
    };

    let httpResponse = requestHelper.sendRequest(url, accessToken, postData, "PUT", false, 'application/json');
    Logger.info('updateOrderExportStatus httpResponse statusCode ' + httpResponse.statusCode);
    if (httpResponse.statusCode === 204 || httpResponse.statusCode === '204'){
        Logger.info('Export Order status updated successfully for Order: ' + orderNumber);
        return true;
    } else {
        Logger.error('Error while updating Export Order status ' + orderNumber);
        return false;
    }
}

function productSearch(accessToken, site, searchTerm) {
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const dataPrefix = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_DATA_URL")

    Logger.info("productSearch, site : " + site + ", accessToken : " + accessToken);

    let url = hostName + dataPrefix + "product_search?site_id=" + site;

    Logger.info("Product search OCAPI url :" + url);

    let postData = {
        "query": {
            "text_query": {
                "fields": ["id","c_replaces-parts"],
                "search_phrase": searchTerm
            }
        },
        "expand": ["images", "availability", "prices"],
        "select": "(**)"
    };

    let httpResponse = requestHelper.sendRequest(url, accessToken, postData, "POST", false, 'application/json');
    let jsonRES = JSON.parse(httpResponse.text);
    if (jsonRES) {
        jsonRES.commerceSite = site;
    }

    return jsonRES;
}

function userByUserName(accessToken, username) {
    const hostName = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_HOST");
    const dataPrefix = epcotOcapiHelper.getSitePreference("EPCOT_OCAPI_DATA_URL")

    Logger.info("userByUserName, username : " + username);

    let url = hostName + dataPrefix + "users/" + username;

    Logger.info(url);

    let postData = null

    let httpResponse = requestHelper.sendRequest(url, accessToken, postData, "GET", false, 'application/json');
    let jsonRES = JSON.parse(httpResponse.text);

    return jsonRES;
}

module.exports.productSearch = productSearch;
module.exports.userByUserName = userByUserName;
module.exports.updateOrderExportStatus= updateOrderExportStatus;
module.exports.updateOrderStatus= updateOrderStatus;
module.exports.patchOrderPaymentTransaction=patchOrderPaymentTransaction;
