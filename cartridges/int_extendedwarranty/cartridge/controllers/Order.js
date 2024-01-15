'use strict';
/* global session */
var server = require('server');

var page = module.superModule;

server.prepend('Confirm', function(req, res, next){
    session.custom.orderNo = req.querystring.ID;
    res.setViewData({
        isOrderConfirmationPage: true
    })
    return next();
});

module.exports = server.exports();