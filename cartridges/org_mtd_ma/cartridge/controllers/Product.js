/* global session request */
'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

var selectedDealer = require('*/cartridge/scripts/middleware/selectedDealer');
var ProductMgr = require('dw/catalog/ProductMgr');

/**
 * @typedef ProductDetailPageResourceMap
 * @type Object
 * @property {String} global_availability - Localized string for "Availability"
 * @property {String} label_instock - Localized string for "In Stock"
 * @property {String} global_availability - Localized string for "This item is currently not
 *     available"
 * @property {String} info_selectforstock - Localized string for "Select Styles for Availability"
 */

/**
 * Generates a map of string resources for the template
 *
 * @returns {ProductDetailPageResourceMap} - String resource map
 */
function getResources() {
    var Resource = require('dw/web/Resource');

    return {
        info_selectforstock: Resource.msg('info.selectforstock', 'product',
            'Select Styles for Availability')
    };
}

/**
 * Add custom data to product
 *
 * @param {Object} res - response object
 */
function addCustomDataToProduct(res) {
    var MTDHelper = require('*/cartridge/scripts/util/MTDHelper');
    var viewData = res.getViewData();

    var userLocale = request.locale;
    var language;
    if (userLocale !== 'default') {
        var localeParts = userLocale.split('_');
        language = localeParts[0];
    } else {
        language = 'en';
    }

    if (viewData.product.productType === 'set') {
        for (var i = 0; i < viewData.product.individualProducts.length; i++) {
            viewData.product.individualProducts[i].isWholeGood = MTDHelper.isWholeGoodProduct(viewData.product.individualProducts[i].raw);
            viewData.product.individualProducts[i].isParts = MTDHelper.isPartsProduct(viewData.product.individualProducts[i].raw);
            viewData.product.individualProducts[i].isAccessory = MTDHelper.isAccessoryProduct(viewData.product.individualProducts[i].raw);
            viewData.product.individualProducts[i].modelNumber = MTDHelper.getProductModelNumber(viewData.product.individualProducts[i].raw);
        }
    } else if (viewData.product.productType === 'bundle') {
        for (var j = 0; j < viewData.product.bundledProducts.length; j++) {
            viewData.product.bundledProducts[j].isWholeGood = MTDHelper.isWholeGoodProduct(viewData.product.bundledProducts[j].raw);
            viewData.product.bundledProducts[j].isParts = MTDHelper.isPartsProduct(viewData.product.bundledProducts[j].raw);
            viewData.product.bundledProducts[j].isAccessory = MTDHelper.isAccessoryProduct(viewData.product.bundledProducts[j].raw);
            viewData.product.bundledProducts[j].modelNumber = MTDHelper.getProductModelNumber(viewData.product.bundledProducts[j].raw);
        }
    }

    viewData.enabledARI = MTDHelper.isARIEnabled();
    viewData.ariBrandCode = MTDHelper.getARIBrandCode();
    viewData.ariLanguage = language;
    viewData.enabledManualSearch = MTDHelper.isManualSearchEnabled();
    viewData.product.isWholeGood = MTDHelper.isWholeGoodProduct(viewData.product.raw);
    viewData.product.isParts = MTDHelper.isPartsProduct(viewData.product.raw);
    viewData.product.isAccessory = MTDHelper.isAccessoryProduct(viewData.product.raw);
    viewData.product.modelNumber = MTDHelper.getProductModelNumber(viewData.product.raw);

    var ContentMgr = require('dw/content/ContentMgr');
    var ContentModel = require('*/cartridge/models/content');
    var apiContent;
    var content;
    var relatedContent = viewData.product.relatedContent;

    if (relatedContent.length > 0) {
        for (var k = 0; k < relatedContent.length; k++) {
            apiContent = ContentMgr.getContent(relatedContent[k]);
            content = new ContentModel(apiContent);
            content.raw = apiContent;
            relatedContent[k] = content;
        }
    }

    res.setViewData(viewData);
}


server.replace('Variation', function (req, res, next) {
    var priceHelper = require('*/cartridge/scripts/helpers/pricing');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

    var params = req.querystring;
    var product = ProductFactory.get(params);

    product.price.html = priceHelper.renderHtml(priceHelper.getHtmlContext(product.price));

    var attributeContext = { product: { attributes: product.attributes } };
    var attributeTemplate = 'product/components/attributesPre';
    product.attributesHtml = renderTemplateHelper.getRenderedHtml(
        attributeContext,
        attributeTemplate
    );

    var specificationContext = { product: { specification: product.specification }, isProductSet: product.productType === 'set' };
    var specificationTemplate = 'product/components/specificationsPre';
    product.specificationHtml = renderTemplateHelper.getRenderedHtml(
        specificationContext,
        specificationTemplate
    );

    res.json({
        product: product,
        resources: getResources()
    });

    next();
});

/**
 * Creates the breadcrumbs object
 * @param {string} cgid - category ID from navigation and search
 * @param {string} pid - product ID
 * @param {Array} breadcrumbs - array of breadcrumbs object
 * @returns {Array} an array of breadcrumb objects
 */
function getAllBreadcrumbs(cgid, pid, breadcrumbs) {
    var URLUtils = require('dw/web/URLUtils');
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');

    var category;
    var product;
    if (pid) {
        product = ProductMgr.getProduct(pid);
        category = product.variant
            ? product.masterProduct.primaryCategory
            : product.primaryCategory;
    } else if (cgid) {
        category = CatalogMgr.getCategory(cgid);
    }

    if (product) {
        breadcrumbs.push({
            htmlValue: product.name,
            url: URLUtils.url('Product-Show', 'pid', product.ID)
        });
    }

    if (category) {
        breadcrumbs.push({
            htmlValue: category.displayName,
            url: URLUtils.url('Search-Show', 'cgid', category.ID),
            categoryID: category.ID
        });

        if (category.parent && category.parent.ID !== 'root') {
            return getAllBreadcrumbs(category.parent.ID, null, breadcrumbs);
        }
    }

    return breadcrumbs;
}

/**
 * Renders the Product Details Page
 * @param {Object} querystring - query string parameters
 * @param {Object} reqPageMetaData - request pageMetaData object
 * @param {Object} res - response object
 */
function showProductPage(querystring, reqPageMetaData, res) {
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var MTDHelper = require('*/cartridge/scripts/util/MTDHelper');
    var params = querystring;
    var product = ProductFactory.get(params);
    var addToCartUrl = URLUtils.url('Cart-AddProduct');
    var breadcrumbs = getAllBreadcrumbs(null, product.id, []).reverse();
    var isDynosite = MTDHelper.isDynosite(product.raw, querystring);
    var dynositeAllPartsCategory = isDynosite ? MTDHelper.VALUE.DYNOSITE_ALL_PARTS_CATEGORY_ID : '';
    var template = isDynosite ? 'product/dynoProductDetails' : 'product/productDetails';
 
    if (product.productType === 'bundle') {
        template = 'product/bundleDetails';
    } else if (product.productType === 'set') {
        template = 'product/setDetails';
    }
 
    var fitsOnModelProduct;
    if(params.fitsOnModel && params.fitsOnModel != 'false') {
        if(!params.willNotFitModel) {
            fitsOnModelProduct = {
                isVerified: true,
                message: Resource.msg('fits.on.model.product.is.verified', 'partFitment', null),
                fitsOnModel: Resource.msgf('fits.on.model.product.no', 'partFitment', null, params.fitsOnModel),
                resetURL: URLUtils.url('Product-Show', 'pid', product.id)
            }
        } else {
            fitsOnModelProduct = {
                isVerified: false,
                message: 'willNotFit',
                fitsOnModel: Resource.msgf('fits.on.model.product.no', 'partFitment', null, params.fitsOnModel),
                resetURL: URLUtils.url('Product-Show', 'pid', product.id)
            }
        }
    }
 
    pageMetaHelper.setPageMetaData(reqPageMetaData, product);
    pageMetaHelper.setPageMetaTags(reqPageMetaData, product);

    var schemaData = require('*/cartridge/scripts/helpers/structuredDataHelper').getProductSchema(product);
 
    var productType = product.raw && product.raw.custom['product-type'].value
    var siteId = Site.getCurrent().getID();
    var licensed = product.raw && product.raw.custom.IsLicensedProduct;
    var lPFindStoreUrl = product.raw && product.raw.custom.FindAStoreUrl; // LicensedProduct find store url
    var ga4Data = {
        event: 'view_item',
        value: product.price.sales.value,
        currency: product.price.sales.currency,
        items: [
            {
                item_id : product.id,
                item_name : product.productName,                    
                price : product.price.sales.value
            }
        ]          
    }
    res.render(template, {
        product: product,
        addToCartUrl: addToCartUrl,
        resources: getResources(),
        breadcrumbs: breadcrumbs,
        dynositeAllPartsCategory: dynositeAllPartsCategory,
        fitsOnModelProduct: fitsOnModelProduct,
        fitsOnModelPDPEnable: productType === 'PARTS' || productType === 'ACCESSORY' || false,
        licensedProduct:licensed,
        lPFindStoreUrl:lPFindStoreUrl,
        siteId:siteId,
        schemaData: schemaData,
        ga4Data: JSON.stringify(ga4Data)
    });
}

/**
 * Append additional data to render PDP
 */
server.append('Show', selectedDealer.check, function (req, res, next) {
    showProductPage(req.querystring, req.pageMetaData, res);
    addCustomDataToProduct(res);
    next();
});

/**
 * Append additional data to render PDP
 */
server.append('ShowInCategory', function (req, res, next) {
    showProductPage(req.querystring, req.pageMetaData, res);
    addCustomDataToProduct(res);
    next();
});

server.append('ShowQuickView', function (req, res, next) {
    var MTDHelper = require('*/cartridge/scripts/util/MTDHelper');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var product = ProductMgr.getProduct(req.querystring.pid);
    var autoShip = (product.custom['edealer-product-type'].value === 'AUTO_WG' || product.custom['edealer-product-type'].value === 'PT_ACC');
    var viewData = res.getViewData();
    addCustomDataToProduct(res);

    viewData.auto_Ship = autoShip;
    viewData.product.isParts = MTDHelper.isPartsProduct(viewData.product.raw);

    res.setViewData(viewData);

    next();
});

module.exports = server.exports();
