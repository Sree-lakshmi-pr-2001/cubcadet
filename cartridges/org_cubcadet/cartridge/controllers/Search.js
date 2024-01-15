'use strict';

var page = module.superModule;
var server = require('server');

var selectedDealer = require('*/cartridge/scripts/middleware/selectedDealer');
var cache = require('*/cartridge/scripts/middleware/cache');
var blogHelpers = require('*/cartridge/scripts/helpers/blogHelpers');
var Site = require('dw/system/Site');
var ContentMgr = require('dw/content/ContentMgr');
var blogRootFolderID = Site.current.getCustomPreferenceValue('blogRootFolder');
var rootBlogFolder = ContentMgr.getFolder(blogRootFolderID);

server.extend(page);

server.get('ShowSearchContent', cache.applyPromotionSensitiveCache, function (req, res, next) {
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var isAjax = Object.hasOwnProperty.call(req.httpHeaders, 'x-requested-with')
        && req.httpHeaders['x-requested-with'] === 'XMLHttpRequest';
    var isShowMore = req.querystring.showMore ? req.querystring.showMore : false;
    var routeName = 'Search-ShowContent';
    var Resource = require('dw/web/Resource');
    var contentSearchRequest;

    var contentSearch = searchHelper.setupContentSearch(req.querystring, routeName);
    if (contentSearch.contentCount < 1) {
        return next();
    }

    contentSearchRequest = true;

    var viewData = searchHelper.updateContentViewData(contentSearch, isShowMore, isAjax, res.getViewData());
    var breadcrumbs = blogHelpers.getBreadcrumbs(rootBlogFolder);

    breadcrumbs.push({
        htmlValue: Resource.msg('breadcrumb.searchresults', 'search', null),
        url: ''
    });

    res.setViewData(viewData);
    res.render(
        viewData.renderingTemplate, {
            breadcrumbs: breadcrumbs,
            contentSearchRequest: contentSearchRequest
        });
    return next();
});

server.append('Refinebar', selectedDealer.check, function (req, res, next) {
    var viewData = res.getViewData();
    var showDealerSectionCLP = req.querystring.showDealerSection === 'true';
    viewData.showDealerSectionCLP = showDealerSectionCLP;
    res.setViewData(viewData);
    next();
});

server.prepend('Show',selectedDealer.check, function(req,res,next){
    var URLUtils = require('dw/web/URLUtils');
    var searchString = req.querystring.q ? req.querystring.q : (req.querystring.cgid ? req.querystring.cgid :'');
    var regex = /[<>]/;
    if(regex.test(searchString)){
        res.redirect(URLUtils.url('Home-Show'));
        return next();
    }
    next();
});

server.append('Show', selectedDealer.check, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var viewData = res.getViewData();
    var showDealerSection = false;
    var currentBasket = BasketMgr.getCurrentBasket();
    var shipment;
    var deliverymethod;
    var currentShippingMethod;

    if (viewData.category) {
        var categoryBooleanValue = viewData.category.custom.dealerSectionOnCategory;

        if (categoryBooleanValue) {
            showDealerSection = true;
        } else if (currentBasket) {
            shipment = currentBasket.getDefaultShipment();
            deliverymethod = shipment.getShippingMethod();
            if (deliverymethod) {
                currentShippingMethod = deliverymethod.ID;
                if (currentShippingMethod === 'dealer-pickup' || currentShippingMethod === 'dealer-delivery') {
                    showDealerSection = true;
                }
            }
        }
    } else {
        showDealerSection = false;
        if (viewData.productSearch.apiProductSearch.category) {
            if (viewData.productSearch.apiProductSearch.category.custom.dealerSectionOnCategory) {
                showDealerSection = true;
            }
        }

        if (currentBasket) {
            shipment = currentBasket.getDefaultShipment();
            deliverymethod = shipment.getShippingMethod();
            if (deliverymethod) {
                currentShippingMethod = deliverymethod.ID;
                if (currentShippingMethod === 'dealer-pickup' || currentShippingMethod === 'dealer-delivery') {
                    showDealerSection = true;
                }
            }
        }
    }

    viewData.refineurl.append('showDealerSection', showDealerSection);
    viewData.showDealerSection = showDealerSection;
    res.setViewData(viewData);

    next();
});

module.exports = server.exports();
