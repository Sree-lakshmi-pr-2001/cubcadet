'use strict';

var page = module.superModule;
var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');

server.get('Show', cache.applyPromotionSensitiveCache, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
   
    res.render('storeLocator/utilityVehicleTemplate');

    next();
});

module.exports = server.exports();
