'use strict';

/**
 * Removed public controllers for testing
 *
 */

var page = module.superModule;
var server = require('server');

server.extend(page);

server.replace('Product', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    res.redirect(URLUtils.url('Home-Show'));
    next();
});

server.replace('NewGrid', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    res.redirect(URLUtils.url('Home-Show'));
    next();
});

server.replace('Form', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    res.redirect(URLUtils.url('Home-Show'));
    next();
});

server.replace('Submit', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    res.redirect(URLUtils.url('Home-Show'));
    next();
});

module.exports = server.exports();
