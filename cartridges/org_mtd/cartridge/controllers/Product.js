/* global session request */
'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

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
    var Site = require('dw/system/Site');
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

    var ariDiagramLinkPartTypes = Site.current.getCustomPreferenceValue('ariPdpLink');
    var showAriDiagramLink = false;

    ariDiagramLinkPartTypes.forEach(function (type) {
        if (type.value === viewData.product.raw.custom['product-type'].value) {
            showAriDiagramLink = true;
            return;
        }
    });

    viewData.enabledARI = MTDHelper.isARIEnabled();
    viewData.ariBrandCode = MTDHelper.getARIBrandCode();
    viewData.ariLanguage = language;
    viewData.showAriDiagramLink = showAriDiagramLink;
    viewData.enabledManualSearch = MTDHelper.isManualSearchEnabled();
    viewData.product.isWholeGood = MTDHelper.isWholeGoodProduct(viewData.product.raw);
    viewData.product.isAccessory = MTDHelper.isAccessoryProduct(viewData.product.raw);
    viewData.product.isParts = MTDHelper.isPartsProduct(viewData.product.raw);
    viewData.product.modelNumber = MTDHelper.getProductModelNumber(viewData.product.raw);
    viewData.schemaData = require('*/cartridge/scripts/helpers/structuredDataHelper').getProductSchema(viewData.product);

    res.setViewData(viewData);
}

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
            url: URLUtils.url('Search-Show', 'cgid', category.ID)
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
    if (params.fitsOnModel && params.fitsOnModel != 'false') {
        if (!params.willNotFitModel) {
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

    var productType = product.raw && product.raw.custom['product-type'].value

    res.render(template, {
        product: product,
        addToCartUrl: addToCartUrl,
        resources: getResources(),
        breadcrumbs: breadcrumbs,
        dynositeAllPartsCategory: dynositeAllPartsCategory,
        fitsOnModelProduct: fitsOnModelProduct,
        fitsOnModelPDPEnable: productType === 'PARTS' || productType === 'ACCESSORY' || false
    });
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

    var specificationContext = { product: { specification: product.specification } };
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
 * Append additional data to render PDP
 */
server.append('Show', function (req, res, next) {
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
    var viewData = res.getViewData();

    viewData.product.isWholeGood = MTDHelper.isWholeGoodProduct(viewData.product.raw);
    viewData.product.isAccessory = MTDHelper.isAccessoryProduct(viewData.product.raw);
    viewData.product.isParts = MTDHelper.isPartsProduct(viewData.product.raw);

    res.setViewData(viewData);

    next();
});

module.exports = server.exports();
