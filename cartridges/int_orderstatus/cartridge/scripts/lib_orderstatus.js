'use strict';


var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');

/**
 * Validates the credentials provided in the request Auth header with the saved credentials in
 * site preference.
 */
 
function CheckAuthRequest (request) {
    var oms_credentials_uname = Site.getCurrent().getCustomPreferenceValue('OMSPushService_Username');
    var oms_credentials_pswd = Site.getCurrent().getCustomPreferenceValue('OMSPushService_Password');
    var baHeader : String = request.httpHeaders["authorization"];
    var basicPrefix : String = "Basic";
    if(!empty(baHeader) && baHeader.indexOf(basicPrefix) == 0){
        var base64Credentials : String = baHeader.substring(basicPrefix.length).trim();
        var credentials : String = StringUtils.decodeBase64(base64Credentials);
        var values : Array = credentials.split(":",2);
        return (values[0] == oms_credentials_uname && values[1] == oms_credentials_pswd);
         
    }else{
        return false;
    }
}

module.exports = {
        CheckAuthRequest: CheckAuthRequest
};
