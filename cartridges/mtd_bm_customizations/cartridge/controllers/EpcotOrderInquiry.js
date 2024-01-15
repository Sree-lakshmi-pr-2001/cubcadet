/* global session */
'use strict';

var server = require('server');
var Logger = require('dw/system/Logger');
var mtdAPICalls = require('../scripts/helpers/mtdAPICalls');
var epcotHelper = require('../scripts/helpers/epcotHelper');
// var epcotOcapiHelper = require('../scripts/helpers/epcotOcapiHelper.js');
var Site = require('dw/system/Site');
var siteId = Site.getCurrent().getID();
var country = epcotHelper.getCountry(siteId);

server.get('Home',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('Order Enquiry Home Page');

        res.render('epcotAdmin/orderInquiry', {
            country:country
        });
        next();
    }
);

server.post('AJAXOrderSearch',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('Get Commerce Orders');
        var orders = mtdAPICalls.getCommerceOrders(req.form, country);
        res.json(orders);
        next();
    }
);

server.post('AJAXGetSelectedOrder',
    server.middleware.https,
    function (req, res, next) {
        Logger.info('Get Selected Order Info');
        var orderHeader = mtdAPICalls.getSelectedOrder(req.form);
        res.json(orderHeader);
        next();
    }
);


module.exports = server.exports();
