/* global session */
'use strict';

var server = require('server');
var Logger = require('dw/system/Logger');
var mtdAPICalls = require('../scripts/helpers/mtdAPICalls');
var epcotHelper = require('../scripts/helpers/epcotHelper');
var epcotOcapiShopCalls = require('../scripts/helpers/epcotOcapiShopCalls');
var epcotOcapiHelper = require('../scripts/helpers/epcotOcapiHelper');
var Site = require('dw/system/Site');

// var userValidation = require('*/cartridge/scripts/middleware/validateUser');

var siteId = Site.getCurrent().getID();
var country = epcotHelper.getCountry(siteId);

server.get('ManageUsers',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('Manage Users');
        var sfccUsers = mtdAPICalls.getSfccUsers(country);
        sfccUsers = epcotHelper.parseUsersList(sfccUsers);
        res.render('epcotAdmin/userMaintenance', {
            sfccUsers: sfccUsers
        });
        next();
    }
);

server.get('ManageRoles',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('Manage Roles');
        var sfccRoles = mtdAPICalls.getSfccRoles();
        res.render('epcotAdmin/roleMaintenance', {
            sfccRoles: sfccRoles
        });
        next();
    }
);

server.get('AjaxGetSfccUser',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('Get SFCC User');
        var email = req.querystring.email;
        var sfccUser = mtdAPICalls.getSfccUser(email, country);
        res.json(sfccUser);
        next();
    }
);

server.get('AjaxGetSfccRoles',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('Get SFCC Roles List');
        var sfccRoles = mtdAPICalls.getSfccRoles();
        res.json(sfccRoles);
        next();
    }
);

server.post('AjaxPostSfccUser',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('Create SFCC User');
        var response = mtdAPICalls.postSfccUser(req.form, country);
        res.json(response);
        next();
    }
);

server.post('AjaxPutSfccUser',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('Edit SFCC User');
        var response = mtdAPICalls.putSfccUser(req.form, country);
        res.json(response);
        next();
    }
);

server.get('NoChargeAudit',
    server.middleware.https,
    function (req, res, next) {
        // var sfccRoles = mtdAPICalls.getSfccRoles();
        Logger.info('Get List of No Charge Orders');
        var bmUser = session.custom.bmUser;
        var bmPassword = session.custom.bmPassword;
        var token = epcotOcapiHelper.getTokenBMGrant(bmUser, bmPassword);
        var noChargeOrders = epcotOcapiShopCalls.getNoChargeOrders(token);
        res.render('epcotAdmin/noChargeAudit', {
            noChargeOrders: noChargeOrders
        });
        next();
    }
);

server.post('AjaxPutRole',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('Updating SFCC Role Description');
        var response = mtdAPICalls.putRole(req.form);
        res.json(response);
        next();
    }
);

// Keep alive function gets called by js/footer/footer.js
// its called on a set timer to hopefully keep the session from timing out
server.get('KeepAlive',
    server.middleware.https,
    function (req, res, next) {
        var isUserLoggedIn = session.userAuthenticated;
        res.json({ loggedIn: isUserLoggedIn });
        next();
    }
);


module.exports = server.exports();
