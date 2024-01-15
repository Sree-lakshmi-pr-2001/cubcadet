'use strict';

var server = require('server');

server.get('GetSessionData', server.middleware.include, function (req, res, next) {
    var data = JSON.stringify(require('*/cartridge/scripts/google/TagManagerModel').getSessionData());
    res.render('components/gtmSessionData', {
        GTMSessionData: data
    });
    next();
});

module.exports = server.exports();
