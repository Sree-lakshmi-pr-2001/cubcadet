'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

server.append('Show', function(req, res, next){
    var Site = require('dw/system/Site').getCurrent();
    var ewEnabled = Site.getCustomPreferenceValue('enableEWNewSales');
    if(!ewEnabled && req.querystring.cid === ('EW-Info-Intermediate-Page' || 'ew-info-page')) {
        res.setStatusCode(404);
        res.render('error/notFound');
    }
    return next();

});

module.exports = server.exports();
