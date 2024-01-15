'use strict';

var CatalogMgr = require('dw/catalog/CatalogMgr');
var page = module.superModule;
var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var productFactory = require('*/cartridge/scripts/factories/product');
var CompareAttributesModel = require('*/cartridge/models/compareAttributes');

server.extend(page);

/**
 * Creates the breadcrumbs object
 * @param {string} cgid - category ID from navigation and search
 * @param {Array} breadcrumbs - array of breadcrumbs object
 * @param {string} query - search query string
 * @returns {Array} an array of breadcrumb objects
 */
function getAllBreadcrumbs(cgid, breadcrumbs) {
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');

    var category;
    if (cgid) {
        category = CatalogMgr.getCategory(cgid);
    }

    if (category) {
        breadcrumbs.push({
            htmlValue: category.displayName,
            url: URLUtils.url('Search-Show', 'cgid', category.ID)
        });

        if (category.parent && category.parent.ID !== 'root') {
            return getAllBreadcrumbs(category.parent.ID, breadcrumbs);
        }
    }

    breadcrumbs.unshift({
        htmlValue: Resource.msg('label.compareproducts', 'product', null),
        url: ''
    });

    return breadcrumbs;
}

server.append('Show', cache.applyDefaultCache, function (req, res, next) {
    var compareProductsForm = req.querystring;
    var category = CatalogMgr.getCategory(compareProductsForm.cgid);
    var pids = Object.keys(compareProductsForm)
        .filter(function (key) { return key.indexOf('pid') === 0; })
        .map(function (pid) { return compareProductsForm[pid]; }).reverse();
    var products = pids.map(function (pid) {
        return productFactory.get({ pid: pid });
    });
    var breadcrumbs = getAllBreadcrumbs(compareProductsForm.cgid, []).reverse();

    res.render('product/comparison', {
        breadcrumbs: breadcrumbs,
        category: {
            name: category.displayName,
            imgUrl: category.custom.slotBannerImage ? category.custom.slotBannerImage.getURL() : null,
            mobileImgUrl: category.custom.slotBannerImageMobile ? category.custom.slotBannerImageMobile.getURL() : null
        },
        pids: pids,
        attributes: (new CompareAttributesModel(products)).slice(0)
    });

    next();
});

module.exports = server.exports();
