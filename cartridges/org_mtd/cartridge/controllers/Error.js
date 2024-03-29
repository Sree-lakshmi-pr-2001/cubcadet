'use strict';

var server = require('server');
var system = require('dw/system/System');
var Resource = require('dw/web/Resource');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

server.use('Start', consentTracking.consent, function (req, res, next) {
    // Changed Status to show content
    res.setStatusCode(410);
    var showError = system.getInstanceType() !== system.PRODUCTION_SYSTEM
        && system.getInstanceType !== system.STAGING_SYSTEM;
    if (req.httpHeaders.get('x-requested-with') === 'XMLHttpRequest') {
        res.json({
            error: req.error || {},
            message: Resource.msg('subheading.error.general', 'error', null)
        });
    } else {
        res.render('error', {
            error: req.error || {},
            showError: showError,
            message: Resource.msg('subheading.error.general', 'error', null)
        });
    }
    next();
});

server.use('ErrorCode', consentTracking.consent, function (req, res, next) {
    res.setStatusCode(500);
    var errorMessage = 'message.error.' + req.querystring.err;

    res.render('error', {
        error: req.error || {},
        message: Resource.msg(errorMessage, 'error', null)
    });
    next();
});

module.exports = server.exports();
