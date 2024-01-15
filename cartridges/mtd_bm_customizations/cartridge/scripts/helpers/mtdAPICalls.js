const Logger = require('dw/system/Logger').getLogger('EPCOTORDER', 'mtdAPICalls.js');
const Site = require('dw/system/Site');
const net = require('dw/net');
const epcotOcapiHelper = require('./epcotOcapiHelper');
const requestHelper = require('./requestHelper');
const HashMap = require('dw/util/HashMap');

function serialize(obj) {
    var str = [];
    for (var p in obj)
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
      }
    return str.join('&');
}

function getMTDOAuthToken() {
    let username = epcotOcapiHelper.getSitePreference('mtdServicesUsername');
    let password = epcotOcapiHelper.getSitePreference('mtdServicesPassword');
    let clientId = epcotOcapiHelper.getSitePreference('mtdServicesClientID');
    let clientSecret = epcotOcapiHelper.getSitePreference('mtdServicesClientSecret');
    let mtdServicesOAUTHTokenHost = epcotOcapiHelper.getSitePreference('mtdServicesOAUTHTokenHost');

    let postData = 'grant_type=password&username=' + username + '&password=' + password + '&client_id=' + clientId + '&client_secret=' + clientSecret;
    let url = mtdServicesOAUTHTokenHost + '/as/token.oauth2';
    Logger.info('Get MTD AUth Token API url : ' + url);
    let httpResponse = requestHelper.sendRequest(url, null, postData, 'POST', true, 'application/x-www-form-urlencoded');
    let jsonRES = null;

    if (httpResponse.statusCode === 200) {
        jsonRES = JSON.parse(httpResponse.text);
        return jsonRES.access_token;
    } else {
        Logger.error('getMTDOAuthToken responseCode = ' + httpResponse.statusCode);
        return null;
    }
}

function getCommerceInventory(country, productIds) {
    let accessToken = getMTDOAuthToken();
    const hostName = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_HOST');
    const dataPrefix = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_DATA_URL');
    const mtdServicesHostname = epcotOcapiHelper.getSitePreference('mtdServicesHostname');

    Logger.info('getCommerceInventory, country : ' + country + ', productIds : ' + productIds);

    let url = mtdServicesHostname + '/rest/svc/sfcc-apis/inventory/getCommerceInventory';

    Logger.info('getCommerceInventory api url : ' + url);

    let postData = {
        'country': country,
        'productIds': productIds
    }

    let httpResponse = requestHelper.sendRequest(url, accessToken, postData, 'POST', false, 'application/json');
    let jsonRES = null;

    if (httpResponse.statusCode === 200) {
        jsonRES = JSON.parse(httpResponse.text);
        return jsonRES;
    } else {
        Logger.error('getCommerceInventory responseCode = ' + httpResponse.statusCode);
        return [];
    }
}

function getCommerceOrders(searchRequest, country) {
    let accessToken = getMTDOAuthToken();
    const hostName = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_HOST');
    const dataPrefix = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_DATA_URL')
    const mtdServicesHostname = epcotOcapiHelper.getSitePreference('mtdServicesHostname');
    var orderSearchType = searchRequest.searchType;
    var url = '';

    Logger.info('Order Search by Type => ' + orderSearchType);

    if (orderSearchType == 'byOrderNumber') {
        var orderNumber = searchRequest.orderNumber;
        Logger.info('Search By OrderNumber : ' + orderNumber);
        url = mtdServicesHostname + '/rest/svc/sfcc-apis/orders/searchByOrderNumber?orderNumber=' + orderNumber;
    }
    else if (orderSearchType == 'byNameAndZip') {
        var customerName = searchRequest.customerName;
        var customerZip = searchRequest.customerZip;
        Logger.info('Search byNameAndZip : ' + customerName + ' : ' + customerZip);
        url = mtdServicesHostname + '/rest/svc/sfcc-apis/orders/searchByNameAndZip?customerName=' + customerName + '&customerZip=' + customerZip + (country === 'US'? '&country=' +country :'');
    }
    else if (orderSearchType == 'byPhoneNumber') {
        var phoneNumber = searchRequest.phoneNumber;
        Logger.info('Search byPhoneNumber : ' + phoneNumber);
        url = mtdServicesHostname + '/rest/svc/sfcc-apis/orders/searchByPhoneNumber?phoneNumber=' + phoneNumber + (country === 'US'? '&country=' +country :'');
    }
    else if (orderSearchType == 'byEmailAddress') {
        var emailAddress = searchRequest.emailAddress;
        Logger.info('Search byEmailAddress : ' + emailAddress);
        url = mtdServicesHostname + '/rest/svc/sfcc-apis/orders/searchByEmail?email=' + emailAddress + (country === 'US'? '&country=' +country :'');
    }
    else if (orderSearchType == 'byChaseAuthId') {
        var chaseAuthId = searchRequest.chaseAuthId;
        Logger.info('Order Search by chaseAuthId : ' + chaseAuthId);
        url = mtdServicesHostname + '/rest/svc/sfcc-apis/orders/searchByChaseAuthId?chaseAuthId=' + chaseAuthId;
    }
    
    Logger.info('Search API URL' + url);

    let postData = null;

    let httpResponse = requestHelper.sendRequest(url, accessToken, postData, 'GET', false, 'application/json');
    let jsonRES = null;
    Logger.info(httpResponse);
    if (httpResponse.statusCode === 200) {
        let orderJSON = {};

        jsonRES = JSON.parse(httpResponse.text);

        Logger.info('jsonRESponse of Search Orders API:');
        Logger.info(JSON.stringify(jsonRES));

        if (jsonRES.header) {
            orderJSON.orders = [jsonRES];
        }else if(jsonRES.length > 0){
            orderJSON.orders = jsonRES;
        } else {
            orderJSON = jsonRES;
        }

        return orderJSON;
    } else {
        Logger.error('Error while searching Orders, API responseCode = ' + httpResponse.statusCode);
        return [];
    }

}

function validateAddress(address){
    let accessToken = getMTDOAuthToken();
    const mtdServicesHostname = epcotOcapiHelper.getSitePreference('mtdServicesHostname');
    let url = mtdServicesHostname + '/rest/addressvalidation';

    let postData = address;

    let httpResponse = requestHelper.sendRequest(url, accessToken, postData, 'POST', false, 'application/json');

    if (httpResponse.statusCode === 200){
        let addressJSON = {};

        jsonRES = JSON.parse(httpResponse.text);
        Logger.info('Address validation Api response : ' + jsonRES);
        if (jsonRES.header){
            addressJSON.address = [ jsonRES ];
        } else {
            addressJSON = jsonRES;
        }
        return addressJSON;
    } else {
        Logger.error('validateAddress responseCode = ' + httpResponse.statusCode);
    }
}

function getSelectedOrder(searchRequest) {
    Logger.info('Fetching Details of Selected Order');
    let accessToken = getMTDOAuthToken();
    const hostName = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_HOST');
    const dataPrefix = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_DATA_URL')
    const mtdServicesHostname = epcotOcapiHelper.getSitePreference('mtdServicesHostname');
    var salesOrderId = searchRequest.salesOrderId;
    var url = mtdServicesHostname + '/rest/svc/sfcc-apis/orders/getFullOrderDetails?salesOrderId=' + salesOrderId;

    Logger.info('Get Selected Order Info API URL' + url);

    let postData = null;

    let httpResponse = requestHelper.sendRequest(url, accessToken, postData, 'GET', false, 'application/json');
    let jsonRES = null;
    Logger.info(httpResponse);
    if (httpResponse.statusCode === 200) {
        let orderJSON = {};

        jsonRES = JSON.parse(httpResponse.text);

        Logger.info('json Response of GetSelectedOrder:');
        Logger.info(JSON.stringify(jsonRES));

        return jsonRES;
    } else {
        Logger.error('Error while Fecthing details of selected order, API responseCode = ' + httpResponse.statusCode);
        return [];
    }
}

function existingCustomerSearch(customerInfo){
    let accessToken = getMTDOAuthToken();
    const hostName = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_HOST');
    const dataPrefix = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_DATA_URL')
    const mtdServicesHostname = epcotOcapiHelper.getSitePreference('mtdServicesHostname');
    Logger.info('existingCustomerSearch customer info : ' + customerInfo);

    let url = mtdServicesHostname + '/rest/svc/sfcc-apis/orders/searchExistingCustomer?' + serialize(customerInfo);

    Logger.info('existingCustomerSearch api url : ' + url);

    let postData = null;

    let httpResponse = requestHelper.sendRequest(url, accessToken, postData, 'GET', false, 'application/json');
    let jsonRES = null;

    if (httpResponse.statusCode === 200){
        let customersJSON = {};

        jsonRES = JSON.parse(httpResponse.text);
        Logger.info('existingCustomerSearch api response : ' + jsonRES);
        if(!jsonRES.errorMessage) {
            customersJSON = jsonRES;
        } else {
            customersJSON = [];
        }

        return customersJSON;
    } else {
        Logger.error('existingCustomerSearch responseCode = ' + httpResponse.statusCode);
        return [];
    }

}

function getItemERPDetails(itemNumber, country) {
    let accessToken = getMTDOAuthToken();
    const hostName = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_HOST');
    const dataPrefix = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_DATA_URL')
    const mtdServicesHostname = epcotOcapiHelper.getSitePreference('mtdServicesHostname');
    Logger.info('getItemERPDetails : ' + itemNumber + ', country :  ' + country);

    let url = mtdServicesHostname + '/rest/svc/sfcc-apis/products/getItemERPDetails?itemNumber=' + itemNumber + '&country=' + country;

    Logger.info('getItemERPDetails api url : ' + url);

    let postData = null;

    let httpResponse = requestHelper.sendRequest(url, accessToken, postData, 'GET', false, 'application/json');
    let jsonRES = null;

    if (httpResponse.statusCode === 200){
        let customersJSON = {};

        jsonRES = JSON.parse(httpResponse.text);
        Logger.info('getItemERPDetails api response : ' + jsonRES);
        if(!jsonRES.errorMessage) {
            customersJSON = jsonRES;
        } else {
            customersJSON = [];
        }

        return customersJSON;
    } else {
        Logger.error('getItemERPDetails responseCode = ' + httpResponse.statusCode);
        return [];
    }

}
function getNextAuthOrderId() {
    let accessToken = getMTDOAuthToken();
    const mtdServicesHostname = epcotOcapiHelper.getSitePreference('mtdServicesHostname');
    let url = mtdServicesHostname + '/rest/svc/sfcc-apis/orders/getNextAuthOrderId';

    let postData = null;

    let httpResponse = requestHelper.sendRequest(url, accessToken, postData, 'GET', false, 'application/json');

    if (httpResponse.statusCode === 200){

        jsonRES = JSON.parse(httpResponse.text);
        Logger.info('getNextAuthOrderId api response : ' + jsonRES);
        return jsonRES.id;

    } else {
        Logger.error('getNextAuthOrderId responseCode = ' + httpResponse.statusCode);
        return null;
    }
}

function getSfccRoles(){
    let accessToken = getMTDOAuthToken();
    const hostName = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_HOST');
    const dataPrefix = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_DATA_URL')
    const mtdServicesHostname = epcotOcapiHelper.getSitePreference('mtdServicesHostname');
    Logger.info('Get Sfcc Roles');

    let url = mtdServicesHostname + '/rest/svc/sfcc-apis/sfccUsers/getSfccRoles';

    Logger.info('Get Sfcc Roles API url' + url);

    let postData = null;

    let httpResponse = requestHelper.sendRequest(url, accessToken, postData, 'GET', false, 'application/json');
    let jsonRES = null;

    if (httpResponse.statusCode === 200){
        let rolesJSON = {};

        jsonRES = JSON.parse(httpResponse.text);

        Logger.info('jsonRES:' + JSON.stringify(jsonRES));

        if(jsonRES.length > 0){
            rolesJSON.roles = jsonRES;
        } else {
            rolesJSON = jsonRES;
        }

        return rolesJSON;
    } else {
        Logger.error('Error while Getting sfcc roles, API responseCode = ' + httpResponse.statusCode);
        return [];
    }

}

function getSfccUsers(country){
    let accessToken = getMTDOAuthToken();
    const hostName = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_HOST');
    const dataPrefix = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_DATA_URL')
    const mtdServicesHostname = epcotOcapiHelper.getSitePreference('mtdServicesHostname');
    Logger.info('Get SFCC Users List for' + country);

    let url = mtdServicesHostname + '/rest/svc/sfcc-apis/sfccUsers/getSfccUsers' + (country === 'US'? '?country=' +country :'');

    Logger.info('URL of getSfccUsers API =' + url);

    let postData = null;

    let httpResponse = requestHelper.sendRequest(url, accessToken, postData, 'GET', false, 'application/json');
    let jsonRES = null;

    if (httpResponse.statusCode === 200){
        let usersJSON = {};

        jsonRES = JSON.parse(httpResponse.text);

        // TOO MUCH LOG SPAM 
        // Logger.error('jsonRES:');
        // Logger.error(JSON.stringify(jsonRES));

        if(jsonRES.length > 0){
            usersJSON.users = jsonRES;
        } else {
            usersJSON = jsonRES;
        }

        return usersJSON;
    } else {
        Logger.error('Error while Fetching SFCC Users,  API responseCode = ' + httpResponse.statusCode);
        return [];
    }

}

function getSfccUser(email, country){
    let accessToken = getMTDOAuthToken();
    const hostName = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_HOST');
    const dataPrefix = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_DATA_URL')
    const mtdServicesHostname = epcotOcapiHelper.getSitePreference('mtdServicesHostname');
    Logger.info('get SFCC User');

    // add country parameter for US Site only
    var countryChk = (country === 'US'? '&country=' +country :'');

    let url = mtdServicesHostname + '/rest/svc/sfcc-apis/sfccUsers/sfccUser?email=' + email + countryChk;

    Logger.info('Get SFCC User API Url =' + url);

    let postData = null;

    let httpResponse = requestHelper.sendRequest(url, accessToken, postData, 'GET', false, 'application/json');
    let jsonRES = null;

    if (httpResponse.statusCode === 200){

        jsonRES = JSON.parse(httpResponse.text);

        Logger.info('jsonRES:' + JSON.stringify(jsonRES));
        if(jsonRES.error) {
            jsonRES = {
                error: true,
                message: "user-doesnt-exist"
            };
            Logger.error(' user-doesnt-exist');
        }  else {
            jsonRES["error"] = false;
        }
        return jsonRES;
    } else {
        Logger.error('getSfccUser Error responseCode = ' + httpResponse.statusCode);
        return jsonRES = {
            error: true,
            message: "api-error"
        };
    }
}

function putRole(form) {
    let accessToken = getMTDOAuthToken();
    const hostName = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_HOST');
    const dataPrefix = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_DATA_URL');
    const mtdServicesHostname = epcotOcapiHelper.getSitePreference('mtdServicesHostname');
    Logger.info('Updating Roles description');

    var roleCode = form.role;
    var description = form.description;
    

    let url = mtdServicesHostname + '/rest/svc/sfcc-apis/sfccUsers/updateRole?roleCode=' + roleCode + '&description=' + description;

    Logger.info('Update Role Decsription API url :' + url);

    let postData = null;

    let httpResponse = requestHelper.sendRequest(url, accessToken, postData, 'PUT', false, 'application/json');
    let jsonRES = null;

    if (httpResponse.statusCode === 200){
        jsonRES = JSON.parse(httpResponse.text);
        Logger.info('Role description Updated Successfully , jsonRES:' + JSON.stringify(jsonRES));
        return jsonRES;
    } else {
        Logger.error('Error While Updating Role Description, API responseCode :' + httpResponse.statusCode);
        return [];
    }
}

function postSfccUser(form, country) {
    let accessToken = getMTDOAuthToken();
    const hostName = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_HOST');
    const dataPrefix = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_DATA_URL');
    const mtdServicesHostname = epcotOcapiHelper.getSitePreference('mtdServicesHostname');
    Logger.info('Creating new User');

    var email = form.email;
    var activeStatus = form.activeStatus;
    var roles = form.roles;
    var settingName = form.settingName;
    var settingValue = form.settingValue;

    // add country parameter for US Site only
    var countryChk = (country === 'US'? '&country=' +country :'');
    let updateUserRolesUrl = null;

    let createUserUrl = mtdServicesHostname + '/rest/svc/sfcc-apis/sfccUsers/sfccUser?email=' + email + '&active=' + activeStatus + countryChk;
    if (roles === 'removeRoles') {
        updateUserRolesUrl = mtdServicesHostname + '/rest/svc/sfcc-apis/sfccUsers/sfccUser?email=' + email + '&active=' + activeStatus + countryChk;
        Logger.info('Remove User Roles API URL : ' + updateUserRolesUrl);
    } else {
        updateUserRolesUrl = mtdServicesHostname + '/rest/svc/sfcc-apis/sfccUsers/sfccUser?email=' + email + '&active=' + activeStatus + roles + countryChk;
        Logger.info('Update User Roles API URL : ' + updateUserRolesUrl);
    }
    let getUserUrl = mtdServicesHostname + '/rest/svc/sfcc-apis/sfccUsers/sfccUser?email=' + email + countryChk;
  
    Logger.info('Create New User API url : ' + createUserUrl);
    Logger.info('Update Roles of New User API url : ' + updateUserRolesUrl);
    Logger.info('Get User API url : ' + getUserUrl);

    let postData = {};

    let httpResponse1 = requestHelper.sendRequest(createUserUrl, accessToken, postData, 'POST', false, 'application/json');
    let httpResponse2 = requestHelper.sendRequest(updateUserRolesUrl, accessToken, postData, 'PUT', false, 'application/json');
    let httpResponse3 = requestHelper.sendRequest(getUserUrl, accessToken, postData, 'GET', false, 'application/json');

    let response = JSON.parse(httpResponse3.text);
    newUserId = response.id;

    Logger.info('User ID created : ' + newUserId);

    let createNewUserSettingUrl = mtdServicesHostname + '/rest/svc/sfcc-apis/sfccUsers/sfccUserSettings?sfccUserId=' + newUserId + '&name=' + settingName + '&value=' + settingValue;
    Logger.info('Create New User Settings API url : ' + createNewUserSettingUrl);
    let httpResponse4 = requestHelper.sendRequest(createNewUserSettingUrl, accessToken, postData, 'POST', false, 'application/json');

    let jsonRES = null;

    // TODO: Handle both errors
    if (httpResponse1.statusCode === 200) {
        Logger.info('User Created Successfully');
        jsonRES = JSON.parse(httpResponse1.text);
        return jsonRES;
    } else {
        Logger.error('Error while Creating User, responseCode = ' + httpResponse1.statusCode);
        return [];
    }
}

function putSfccUser(form, country) {
    let accessToken = getMTDOAuthToken();
    const hostName = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_HOST');
    const dataPrefix = epcotOcapiHelper.getSitePreference('EPCOT_OCAPI_DATA_URL');
    const mtdServicesHostname = epcotOcapiHelper.getSitePreference('mtdServicesHostname');
    var email = form.email;
    var activeStatus = form.activeStatus;
    var roles = form.roles;
    var id = form.id;
    var settingNames = form.settingNames;
    var settingValues = form.settingValues;

    // add country parameter for US Site only
    var countryChk = (country === 'US'? '&country=' +country :'');

    if (roles === 'removeRoles') {
        var url = mtdServicesHostname + '/rest/svc/sfcc-apis/sfccUsers/sfccUser?email=' + email + '&active=' + activeStatus + countryChk;
        Logger.info('Remove User Roled API URL : ' + url);
    } else {
        var url = mtdServicesHostname + '/rest/svc/sfcc-apis/sfccUsers/sfccUser?email=' + email + '&active=' + activeStatus + roles + countryChk;
        Logger.info('Update User Roled API URL : ' + url);
    }
    
    let updateUserSettingUrl = mtdServicesHostname + '/rest/svc/sfcc-apis/sfccUsers/sfccUserSettings?sfccUserId=' + id + settingNames + settingValues;

    Logger.info('Update User Settings API URL : ' + updateUserSettingUrl);

    let postData = {};

    let httpResponse = requestHelper.sendRequest(url, accessToken, postData, 'PUT', false, 'application/json');
    let httpResponse2 = requestHelper.sendRequest(updateUserSettingUrl, accessToken, postData, 'PUT', false, 'application/json');

    let jsonRES = null;

    if (httpResponse.statusCode === 200) {
        Logger.info('User Roles Updated Successfully');
        jsonRES = JSON.parse(httpResponse.text);
        return jsonRES;
    } else {
        Logger.error('Error While Updating User Role ,responseCode = ' + httpResponse.statusCode);
        return [];
    }

    return null;
}


function reverseChaseAuthorization(postData){
    const mtdServicesHostname = epcotOcapiHelper.getSitePreference('mtdServicesHostname');
    let accessToken = getMTDOAuthToken();

    Logger.info('reverseChaseAuthorization');

    let url = mtdServicesHostname + '/rest/consumer-credit-service/consumer-credit-service/auth-reversal-request';

    Logger.info('reverseChaseAuthorization url : ' + url);
    Logger.info('postData : ' + JSON.stringify(postData));

    let httpResponse = requestHelper.sendRequest(url, accessToken, postData, 'POST', false, 'application/json');
    let jsonRES = null;

    if (httpResponse.statusCode === 200){
        let rolesJSON = {};

        jsonRES = JSON.parse(httpResponse.text);

        Logger.info('reverseChaseAuthorization api response:');
        Logger.info(JSON.stringify(jsonRES));

        if(jsonRES.length > 0){
            rolesJSON.roles = jsonRES;
        } else {
            rolesJSON = jsonRES;
        }

        return rolesJSON;
    } else {
        Logger.error('reverseChaseAuthorization responseCode = ' + httpResponse.statusCode);
        return [];
    }

}

function getPCIPalSettings(storeName){
    const mtdServicesHostname = epcotOcapiHelper.getSitePreference('mtdServicesHostname');
    let accessToken = getMTDOAuthToken();

    Logger.info('getPCIPalSettings : ' + storeName);

    let url = mtdServicesHostname + '/rest/svc/sfcc-apis/settings/sfccStoreSettings?storeName=' + storeName;

    Logger.info('getPCIPalSettings url : ' + url);

    let httpResponse = requestHelper.sendRequest(url, accessToken, null, 'GET', false, 'application/json');
    Logger.info('in store settings httpResponse.text : ' + httpResponse.text);
    let jsonRES = null;
    let settingsMap = new HashMap();
    if (httpResponse.statusCode === 200){
        Logger.info('store settings code ' + httpResponse.statusCode);

        jsonRES = JSON.parse(httpResponse.text);
        if (jsonRES){
            // forEach(function (role) 
            jsonRES.forEach(function (jsonElement){
                let attributeName = jsonElement.attributeName;
                let attributeValue = jsonElement.attributeValue;
                Logger.error(attributeName + ' : ' + attributeValue);
                settingsMap.put(attributeName, attributeValue);
            });
        }
        Logger.info(' getPCIPalSettings Response:');
        Logger.info(JSON.stringify(jsonRES));


        return settingsMap;

    } else {
        Logger.error('getPCIPalSettings responseCode = ' + httpResponse.statusCode);
        return settingsMap;
    }

}

module.exports.putSfccUser=putSfccUser;
module.exports.postSfccUser=postSfccUser;
module.exports.getSfccUser=getSfccUser;
module.exports.putRole=putRole;

module.exports.getSfccUsers=getSfccUsers;
module.exports.getSfccRoles=getSfccRoles;
module.exports.getCommerceInventory=getCommerceInventory;
module.exports.getCommerceOrders=getCommerceOrders;
module.exports.validateAddress=validateAddress;
module.exports.existingCustomerSearch=existingCustomerSearch;
module.exports.getNextAuthOrderId=getNextAuthOrderId;
module.exports.getSelectedOrder= getSelectedOrder;
module.exports.getItemERPDetails=getItemERPDetails;
module.exports.reverseChaseAuthorization=reverseChaseAuthorization;
module.exports.getPCIPalSettings=getPCIPalSettings;