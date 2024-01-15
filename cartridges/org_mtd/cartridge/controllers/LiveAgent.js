'use strict';

var server = require('server');

var cache = require('*/cartridge/scripts/middleware/cache');

/**
 * Print live chat code
 */
server.get('Show', cache.applyDefaultCache, function (req, res, next) {
    res.render('components/footer/liveChat');
    next();
});

module.exports = server.exports();
