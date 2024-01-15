'use strict';

var cache = require('*/cartridge/scripts/middleware/cache');
var server = require('server');
var page = module.superModule;
server.extend(page);

server.replace(
    'IncludeHeaderMenu',
    server.middleware.include,
    cache.applyDefaultCache,
    function (req, res, next) {
        var catalogMgr = require('dw/catalog/CatalogMgr');
        var Categories = require('*/cartridge/models/categories');
        var siteRootCategory = catalogMgr.getSiteCatalog().getRoot();
        var topLevelCategories = siteRootCategory.hasOnlineSubCategories() ?
                siteRootCategory.getOnlineSubCategories() : null;

        res.render('/components/header/menu', new Categories(topLevelCategories));
        next();
    }
);

server.get(
    'IncludeFooterMenu',
    server.middleware.include,
    cache.applyDefaultCache,
    function (req, res, next) {
        var catalogMgr = require('dw/catalog/CatalogMgr');
        var Categories = require('*/cartridge/models/categories');
        var siteRootCategory = catalogMgr.getSiteCatalog().getRoot();
        var topLevelCategories = siteRootCategory.hasOnlineSubCategories() ?
                siteRootCategory.getOnlineSubCategories() : null;

        res.render('/components/footer/menuFooter', new Categories(topLevelCategories));
        next();
    }
);

module.exports = server.exports();
