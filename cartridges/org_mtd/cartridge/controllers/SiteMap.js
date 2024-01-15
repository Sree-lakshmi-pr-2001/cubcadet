'use strict';
/* globals PIPELET_ERROR*/
var server = require('server');

server.get('Google', function (req, res, next) {
    var Pipelet = require('dw/system/Pipelet');
    var SendGoogleSiteMapResult = new Pipelet('SendGoogleSiteMap').execute({
        FileName: req.querystring.name
    });
    if (SendGoogleSiteMapResult.result === PIPELET_ERROR) {
        res.setStatusCode(404);
    } else {
        res.setStatusCode(200);
    }
    next();
});

module.exports = server.exports();
