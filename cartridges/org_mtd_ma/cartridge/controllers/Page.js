'use strict';

var cache = require('*/cartridge/scripts/middleware/cache');
var server = require('server');
var page = module.superModule;
server.extend(page);

/**
 * Gets the active parent category
 * @param {string} cgid - category ID from navigation and search
 * @returns {string} category - the active parent category
 */
function getActiveParentCategory(cgid) {
    var catalogMgr = require('dw/catalog/CatalogMgr');
    var category;
    if (cgid) {
        category = catalogMgr.getCategory(cgid);
    }

    if (category) {
        if (category.parent && category.parent.ID !== 'root') {
            category = getActiveParentCategory(category.parent.ID);
        }
    }

    return category;
}

server.replace(
    'Include',
    server.middleware.include,
    cache.applyDefaultCache,
    function (req, res, next) {
        var ContentMgr = require('dw/content/ContentMgr');
        var Logger = require('dw/system/Logger');
        var ContentModel = require('*/cartridge/models/content');

        var apiContent = ContentMgr.getContent(req.querystring.cid);
        var renderingTemplate = req.querystring.nowrap ? '/components/content/contentAssetIncNoWrapper' : '/components/content/contentAssetInc';

        if (apiContent) {
            var content = new ContentModel(apiContent, renderingTemplate);
            if (content.template) {
                res.render(content.template, { content: content });
            } else {
                Logger.warn('Content asset with ID {0} is offline', req.querystring.cid);
                res.render('/components/content/offlineContent');
            }
        } else {
            Logger.warn('Content asset with ID {0} was included but not found',
                    req.querystring.cid);

            res.render('/components/content/offlineContent');
        }
        next();
    }
);

server.replace('SetLocale', function (req, res, next) {
    var URLAction = require('dw/web/URLAction');
    var URLUtils = require('dw/web/URLUtils');
    var Currency = require('dw/util/Currency');
    var Site = require('dw/system/Site');
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var System = require('dw/system/System');
    var countryLocales = System.preferences.custom.countryLocales ? JSON.parse(System.preferences.custom.countryLocales) : [];

    var currentBasket = BasketMgr.getCurrentBasket();

    var QueryString = server.querystring;
    var currency;
    var currentSite = Site.getCurrent();
    var allowedCurrencies = currentSite.allowedCurrencies;
    var queryStringObj = new QueryString(req.querystring.queryString || '');

    if (Object.hasOwnProperty.call(queryStringObj, 'lang')) {
        delete queryStringObj.lang;
    }

    var localeCode = req.querystring.code;
    var currentSiteID = currentSite.ID;
    var siteName = currentSiteID;
    for (var i = 0, l = countryLocales.length; i < l; i++) {
        var locale = countryLocales[i];
        if (locale.id === localeCode && locale.allowedSites.indexOf(currentSiteID) !== -1) {
            siteName = locale.site;
            break;
        }
    }

    // If request site equals current site we need to setup locale and currency
    var action = req.querystring.action;
    if (siteName === currentSiteID) {
        req.setLocale(localeCode);
        currency = Currency.getCurrency(req.querystring.CurrencyCode);

        if (allowedCurrencies.indexOf(req.querystring.CurrencyCode) > -1
            && (req.querystring.CurrencyCode !== req.session.currency.currencyCode)) {
            req.session.setCurrency(currency);

            if (currentBasket && currency && currentBasket.currencyCode !== currency.currencyCode) {
                Transaction.wrap(function () {
                    currentBasket.updateCurrency();
                });
            }
        }
    } else {
        action = 'Home-Show';
        queryStringObj = new QueryString('');
    }

    var urlAction = new URLAction(action, siteName, localeCode);
    var redirectUrl = URLUtils.https(urlAction).toString();
    var qsConnector = redirectUrl.indexOf('?') >= 0 ? '&' : '?';

    redirectUrl = Object.keys(queryStringObj).length === 0
        ? redirectUrl += queryStringObj.toString()
        : redirectUrl += qsConnector + queryStringObj.toString();

    res.json({
        success: true,
        redirectUrl: redirectUrl
    });

    next();
});

server.replace(
    'IncludeHeaderMenu',
    server.middleware.include,
    cache.applyDefaultCache,
    function (req, res, next) {
        var catalogMgr = require('dw/catalog/CatalogMgr');
        var Categories = require('*/cartridge/models/categories');
        var siteRootCategory = catalogMgr.getSiteCatalog().getRoot();
        // eslint-disable-next-line no-undef
        var cgid = request.httpParameterMap.cgid.value;
        // eslint-disable-next-line no-undef
        var pid = request.httpParameterMap.pid.value;
        var activeParent;

        if (cgid) {
            activeParent = getActiveParentCategory(cgid);
        } else if (pid) {
            var productMgr = require('dw/catalog/ProductMgr');
            var product = productMgr.getProduct(pid);
            var cats = product.getCategories();
            if (cats.length === 1) {
                cgid = cats[0].ID;
            } else {
                cgid = product.getClassificationCategory() ? product.getClassificationCategory().ID : null;
            }
            if (cgid) {
                activeParent = getActiveParentCategory(cgid);
            }
        }

        var topLevelCategories = siteRootCategory.hasOnlineSubCategories() ?
                siteRootCategory.getOnlineSubCategories() : null;

        var categories = new Categories(topLevelCategories);

        res.render('/components/header/menu', {
            categories: categories.categories,
            activeParent: activeParent ? activeParent.ID : ''
        });
        next();
    }
);

module.exports = server.exports();
