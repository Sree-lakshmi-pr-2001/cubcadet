/* global session */
'use strict';

var server = require('server');
var Logger = require('dw/system/Logger');
var URLUtils = require('dw/web/URLUtils');
var mtdAPICalls = require('../scripts/helpers/mtdAPICalls.js');
var epcotOcapiHelper = require('../scripts/helpers/epcotOcapiHelper.js');
var epcotHelper = require('../scripts/helpers/epcotHelper');
var Site = require('dw/system/Site');
var siteId = Site.getCurrent().getID();
var country = epcotHelper.getCountry(siteId);

server.get(
    'Start',
    server.middleware.https,
    function (req, res, next) {
        var bmPassword = session.custom.bmPassword;
        // Logger.info('MTD startRoute => ' + bmPassword);

        if (bmPassword != null) {
            Logger.info('password fetched from session ,redirection to welcome page ');
            var redirectUrl = URLUtils.url('Epcot-Welcome',
                'basketId', null
            );
            res.redirect(redirectUrl);
        } else {
            Logger.info('Session is null , Redirection to Login Page');
            res.render('epcot/loginPage', {
            });
        }
        next();
    }
);

server.post('Login',
    server.middleware.https,
    function (req, res, next) {
        var login = req.form.username;
        var password = req.form.password;
        var token = epcotOcapiHelper.getTokenBMGrant(login, password);

        if (token) {
            // session.custom.bmToken = token;
            Logger.info('Login token :' + token);
            var redirectUrl = URLUtils.url('Epcot-Welcome',
                'basketId', null
            );
            Logger.info('redirecting to Welcome page ' + redirectUrl);
            res.redirect(redirectUrl);
        } else {
            Logger.error('Login/Password is incorrect as unable to get token');
            res.render('epcot/loginPage', {
                username: login,
                errorMessage: 'Login/password incorrect'
            });
        }
        next();
    }
);

server.get('Welcome',
    server.middleware.https,
    function (req, res, next) {
        var userName = session.userName;
        var accessToken = epcotOcapiHelper.getDataOauthToken();
        Logger.info('oauth => ' + accessToken);

        // retrieve the user information
        // returns:
        var userInformation = mtdAPICalls.getSfccUser(userName, country);
        epcotOcapiHelper.saveUserInformationInSession(userInformation);
        var storedUserDetails = JSON.parse(session.custom.bmUserDetails);

        var isUserActive = null;
        var apiError = null;
        if (storedUserDetails.active !== null) {
            isUserActive = storedUserDetails.active;
        }
        if (storedUserDetails.apiError) {
            apiError = storedUserDetails.apiError;
            Logger.error('api Error' + apiError );
        }
        var canPlaceOrders = epcotOcapiHelper.getVisibilityFromPermission(storedUserDetails, 'place-orders');
        var canManageUsers = epcotOcapiHelper.getVisibilityFromPermission(storedUserDetails, 'user-management');
        var canAuditNoCharges = epcotOcapiHelper.getVisibilityFromPermission(storedUserDetails, 'no-charge-audit');
        res.render('epcot/welcome', {
            isUserActive: isUserActive,
            canPlaceOrders: canPlaceOrders,
            canManageUsers: canManageUsers,
            canAuditNoCharges: canAuditNoCharges,
            apiError: apiError
        });
        next();
    }
);

module.exports = server.exports();
