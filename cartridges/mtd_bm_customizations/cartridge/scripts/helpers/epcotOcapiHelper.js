const Logger = require('dw/system/Logger').getLogger('OCAPI', 'epcotOcapiHelper.js');
const Site = require('dw/system/Site');
const net = require('dw/net');
const requestHelper = require('./requestHelper');
var StringUtils = require('dw/util/StringUtils'); // base 64 encoding for passwords
const Base64 = requestHelper.Base64;

function getTokenClientCredentials() {
    const hostName = "https://account.demandware.com";
    Logger.info('hostname in getTokenClientCredentials: ' + hostName);
    let postData = "grant_type=client_credentials";
    const clientId = getSitePreference("EPCOT_OCAPI_CLIENT");
    let clientSecret = getSitePreference("EPCOT_OCAPI_CLIENT_SECRET");

    // Define the string
    var string = clientId + ":" + clientSecret;
    var encodedString = Base64.encode(string);

    //Logger.error("encoded string : " + encodedString);
    const url = hostName + '/dw/oauth2/access_token?client_id=' + clientId;
    Logger.info('OCAPI Call to getTokenClientCredentials: ' + url);

    let httpResponse = requestHelper.sendRequest(url, encodedString, postData, "POST", true, "application/x-www-form-urlencoded");

    if (httpResponse.statusCode == 200) {
        var jsonRES = JSON.parse(httpResponse.text);
        Logger.info('getTokenClientCredentials API response text : ' + httpResponse.text);
        var session = request.getSession();
        return jsonRES.access_token;
    } else {
        Logger.error('Error while getTokenClientCredentials , StatusCode: ' + httpResponse.statusCode);
        return null;
    }
}
function getTokenBMGrant(user, password) {
    const hostName = getSitePreference("EPCOT_OCAPI_HOST");
    Logger.info('EPCOT OCAPI HostName : ' + hostName);
    Logger.info("getTokenBMGrant, user : " + user);
    let postData = "grant_type=urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken";
    const clientId = getSitePreference("EPCOT_OCAPI_CLIENT");
    let clientSecret = getSitePreference("EPCOT_OCAPI_CLIENT_SECRET");

    // Define the string
    var string = user + ":" + password + ":" + clientSecret;
    var encodedString = Base64.encode(string);

    //Logger.error("encoded string : " + encodedString);
    const url = hostName + '/dw/oauth2/access_token?client_id=' + clientId;
    Logger.info('OCAPI URL to getTokenBMGrant ' + url);

    let httpResponse = requestHelper.sendRequest(url, encodedString, postData, "POST", true, "application/x-www-form-urlencoded");

    if (httpResponse.statusCode == 200) {
        var jsonRES = JSON.parse(httpResponse.text);
        Logger.info('Text Response from getTokenBMGrant OCAPI Call  : ' + httpResponse.text);
        var session = request.getSession();
        session.custom.bmUser = user;
        session.custom.bmPassword = password;
        return jsonRES.access_token;
    } else {
        return null;
        Logger.error('Getting Error Code from getTokenBMGrant OCAPI Call , StatusCode: ' + httpResponse.statusCode);
    }
}

function getSitePreference(key) {
    return Site.getCurrent().getCustomPreferenceValue(key);
}

function getDataOauthToken() {
    let postData = "grant_type=client_credentials";

    const clientId = getSitePreference("EPCOT_OCAPI_CLIENT");
    let clientSecret = getSitePreference("EPCOT_OCAPI_CLIENT_SECRET");


    let encodedString = StringUtils.encodeBase64(clientId + ":" + clientSecret);
    Logger.info("encoded clientId and Client Secret : " + encodedString);

    var url = 'https://account.demandware.com:443/dwsso/oauth2/access_token';
    let httpResponse = requestHelper.sendRequest(url, encodedString, postData, "POST", true, "application/x-www-form-urlencoded");

    Logger.info("Response status : " + httpResponse.statusCode)
    var jsonRES = JSON.parse(httpResponse.text);
    Logger.info('Response text : ' + httpResponse.text);
    return jsonRES.access_token;
}

function saveUserInformationInSession(userInformation) {
    Logger.info('Saving user information to session');
    var session = request.getSession();

    // first check to make sure there wasn't an issue with the api
    // if there was, store that information
    if (userInformation.error && userInformation.message === 'user-doesnt-exist') {
        Logger.info('No user information was passed to this function - user doesnt exist');
        session.custom.bmUserDetails = JSON.stringify({
            active: null,
            permissions: null,
            userSettings: null,
            apiError: false
        });
        return;
    }
    else if (userInformation.error && userInformation.message === 'api-error') {
        Logger.error('No user information was passed to this function - issue with api');
        session.custom.bmUserDetails = JSON.stringify({
            active: null,
            permissions: null,
            userSettings: null,
            apiError: true
        });
        return;
    } else {
        // Get active status
        var activeStatus = userInformation.active;

        // Determine the user's max role
        Logger.info('Determining users max role');
        var roles = userInformation.roles;
        Logger.info('Users Roles are :' + roles);

        if (roles.length > 0) {
            var maxRoleValue = Math.max.apply(Math, roles.map(function (role) { return role.id; }));
            // Math.max(...roles.map(role => role.id)) why doesnt this work for getting the max id???
            var maxRole = roles.filter(function (object) { return object.id == maxRoleValue })[0];
        } else {
            Logger.error('User has no roles');
        }

        var permissions = null;
        if (roles.length > 0) {
            permissions = maxRole.permissions;
        }

        // // set permissions from all roles role
        // // instead of pulling the max permissions, we will pull all permissions from each
        // var allPermissions = [];
        // while(roles.length > 0) {
        //     currentRole = roles.shift();
        //     currentRole.permissions.forEach(function (permission){
        //         allPermissions.push({
        //             code: permission.code,
        //             description: permission.description
        //         })
        //     });
        // }

        // Logger.error('Unique Roles');
        // var permissions = [];

        // set user settings from user information
        var settingsJson = [];
        userInformation.settings.forEach(function (setting) {
            var userSetting = {};
            userSetting.name = setting.name;
            userSetting.value = setting.value;
            settingsJson.push(userSetting);
        });

        // assign to session
        session.custom.bmUserDetails = JSON.stringify({
            active: activeStatus,
            permissions: permissions,
            userSettings: settingsJson,
            apiError: false
        });

        return;
    }
}

function getVisibilityFromPermission(userDetails, permissionRequired) {
    if (userDetails.apiError === true) {
        return null;
    }
    else if (!userDetails.permissions || userDetails.permissions.length == 0) {
        Logger.error('User does not have permission for : ' + permissionRequired);
        return false;
    } else {
        Logger.info('Determining if user has access to : ' + permissionRequired);
        var hasPermission = false;
        userDetails.permissions.forEach(function (userPermission) {
            if (userPermission.code === permissionRequired) {
                hasPermission = true;
                Logger.info('user has access to : ' + permissionRequired);
            }
        });

        return hasPermission;
    }
}

function getUserSetting(userDetails, settingToFind) {
    // iterate through all of the settings until we find the one passed into the function
    Logger.info('User details passed => ');
    Logger.info(userDetails);
    Logger.info('Setting to find = > ' + settingToFind);

    var userSettings = JSON.parse(JSON.stringify(userDetails.userSettings));
    Logger.info('SETTINGS => ');
    Logger.info(userSettings);

    // {"active":1,"hasRoles":true,"roles":[{"code":"csr-trainee","hasRole":true},{"code":"csr-third-party","hasRole":true},{"code":"csr-user","hasRole":true},{"code":"csr-supervisor","hasRole":true},{"code":"business-admin","hasRole":true}],"hasError":false,"userSettings":[{"name":"extension","value":"3042"}]}
    var settingValue = '';
    userDetails.userSettings.forEach(function (setting) {
        if (setting.name === settingToFind) {
            settingValue = setting.value;
        }
    })
    Logger.info('Setting ' + settingToFind + ' found => ' + settingValue);
    return settingValue;
}

module.exports.getUserSetting = getUserSetting;
module.exports.getVisibilityFromPermission = getVisibilityFromPermission;
module.exports.saveUserInformationInSession = saveUserInformationInSession;
module.exports.getSitePreference = getSitePreference;
module.exports.getTokenBMGrant = getTokenBMGrant;
module.exports.getDataOauthToken = getDataOauthToken;
module.exports.getTokenClientCredentials = getTokenClientCredentials;
