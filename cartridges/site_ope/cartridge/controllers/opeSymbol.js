'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

// Landing page
server.get('Landing', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-landing');
    next();
}, pageMetaData.computedPageMetaData);

server.get('Home', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-landing');
    next();
}, pageMetaData.computedPageMetaData);

// Bosnian (scr)
server.get('Scr', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-scr');
    next();
}, pageMetaData.computedPageMetaData);

// Croatian (hr)
server.get('Hr', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-hr');
    next();
}, pageMetaData.computedPageMetaData);

// Czech (cs)
server.get('Cs', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-cs');
    next();
}, pageMetaData.computedPageMetaData);

// Danish (da)
server.get('Da', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-da');
    next();
}, pageMetaData.computedPageMetaData);

// Dutch (nl)
server.get('Nl', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-nl');
    next();
}, pageMetaData.computedPageMetaData);


// Swedish (SV)
server.get('SV', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-sv');
    next();
}, pageMetaData.computedPageMetaData);


// English (en)
server.get('En', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-en');
    next();
}, pageMetaData.computedPageMetaData);

// Estonian (et)
server.get('Et', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-et');
    next();
}, pageMetaData.computedPageMetaData);

// Finnish (fi)
server.get('Fi', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-fi');
    next();
}, pageMetaData.computedPageMetaData);

// French (fr)
server.get('Fr', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-fr');
    next();
}, pageMetaData.computedPageMetaData);

// German (De)
server.get('De', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-de');
    next();
}, pageMetaData.computedPageMetaData);

// Hungarian (hu)
server.get('Hu', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-hu');
    next();
}, pageMetaData.computedPageMetaData);

// Italian (it)
server.get('It', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-it');
    next();
}, pageMetaData.computedPageMetaData);

// Latvian (lv)
server.get('Lv', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-lv');
    next();
}, pageMetaData.computedPageMetaData);

// Lithuanian (lt)
server.get('Lt', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-lt');
    next();
}, pageMetaData.computedPageMetaData);

// Norwegian (no)
server.get('No', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-no');
    next();
}, pageMetaData.computedPageMetaData);

// Polish (pl)
server.get('Pl', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-pl');
    next();
}, pageMetaData.computedPageMetaData);

// Russian (ru)
server.get('Ru', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-ru');
    next();
}, pageMetaData.computedPageMetaData);

// Serbian - see Bosnian (scr) or Croatian (hr)

// Slovak (sk)
server.get('Sk', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-sk');
    next();
}, pageMetaData.computedPageMetaData);

// Slovenian (sl)
server.get('Sl', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-sl');
    next();
}, pageMetaData.computedPageMetaData);

// Spanish (es)
server.get('Es', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-es');
    next();
}, pageMetaData.computedPageMetaData);

// Ukrainian (uk)
server.get('Uk', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/opeSymbol/opeSymbol-uk');
    next();
}, pageMetaData.computedPageMetaData);

// 404
server.get('ErrorNotFound', function (req, res, next) {
    res.setStatusCode(404);
    res.render('error/notFound');
    next();
});

module.exports = server.exports();
