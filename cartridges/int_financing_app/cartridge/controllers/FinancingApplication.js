'use strict';

var server = require('server');

/**
 * Get Estimation Content
 * @param {dw.object.CustomObject} req - req
 * @returns {string} content - content
 */
function getEstimationContent(req) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Util = require('~/cartridge/scripts/helpers/Util');
    var content = '';

    // check if we have enabled payment
    if (Util.financeEnabled()) {
        // get params
        var pageType = req.querystring.pageType; // pdp, cart or billing
        var total;
        var currentBasket;
        var totalMoney;
        var productList;
        if (pageType === 'pdp') {
            total = Number(req.querystring.total);
            if (req.querystring.productList) {
                productList = req.querystring.productList.split(',');
            }
        } else {
            currentBasket = BasketMgr.getCurrentBasket();
            totalMoney = Util.getBasketTotal(currentBasket);

            total = totalMoney.value;
        }

        // find plan for estimation
        var financePlan = Util.findPlansForEstimation(total, pageType, productList);
        if (financePlan) {
            var financePlanType = Util.getFinancePlanType(financePlan);
            // get right finance plan and show contents asset
            var contentAssetId = Util.VALUE.ESTIMATION_ASSET_PREFIX_ID + pageType + '-' + financePlanType;
            var bodyHtml = Util.getContentAssetBody(contentAssetId);
            content = Util.parseHtmlWithFinancePlan(bodyHtml, financePlan, financePlanType, total.toFixed(2));
        }
    }

    return content;
}

/**
 * Get Financing Application URL
 */
server.get('GetURL', function (req, res, next) {
    var Status = require('dw/system/Status');
    var AccessTokenModel = require('~/cartridge/scripts/models/AccessToken');
    var Util = require('~/cartridge/scripts/helpers/Util');

    var jsonResponse = {
        success: false
    };

    if (!Util.VALUE.ENABLED) {
        res.json(jsonResponse);
        next();
        return;
    }

    var prequal = req.querystring.prequal;
    var result = AccessTokenModel.getToken(prequal);
    if (result.status === Status.OK) {
        jsonResponse.success = true;
        jsonResponse.url = result.getDetail('url');
    } else {
        var ContentMgr = require('dw/content/ContentMgr');
        var ContentModel = require('*/cartridge/models/content');

        var msg = '';
        var asset = ContentMgr.getContent('error-page-financing-application');
        if (asset) {
            var assetModel = new ContentModel(asset);
            msg = assetModel.body.markup;
        }
        jsonResponse.msg = msg;
    }

    res.json(jsonResponse);

    next();
});

/**
 * Get Payment Estimation
 */
server.get('Estimation', function (req, res, next) {
    var content = getEstimationContent(req);

    // render template
    res.render('finance/estimation', {
        content: content
    });
    next();
});

/**
 * Update Payment Estimation For Cart Dinamicaly
 */
server.get('UpdateCartEstimation', function (req, res, next) {
    var HashMap = require('dw/util/HashMap');
    var Template = require('dw/util/Template');
    var Util = require('~/cartridge/scripts/helpers/Util');

    var content = getEstimationContent(req);

    var template = new Template('finance/estimation');
    var result = new HashMap();

    result.put('content', content);
    var html = template.render(result).text;

    res.json({
        isDisplay: Util.isCertainPlanDisplayOnCart(),
        content: html
    });

    return next();
});

/**
 * Get Disclosure
 */
server.get('Disclosure', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Util = require('~/cartridge/scripts/helpers/Util');
    var orderId = req.querystring.orderId;
    var order;
    var bodyHtml;

    if (orderId) {
        order = OrderMgr.getOrder(orderId);
    }

    if (order) {
        var financePIs = order.getPaymentInstruments(Util.VALUE.FINANCE_METHOD_ID);
        if (financePIs.size() > 0) {
            var financePI = financePIs[0]; // eslint-disable-line
            bodyHtml = '';
        }
    } else {
        bodyHtml = Util.getContentAssetBody('td-plan-disclosure');
    }

    // render template
    res.render('finance/details', {
        content: bodyHtml
    });
    next();
});

/**
 * Get Financing Plans for billing page
 */
server.get('Plans', function (req, res, next) {
    var Util = require('~/cartridge/scripts/helpers/Util');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var BasketMgr = require('dw/order/BasketMgr');

    var currentBasket = BasketMgr.getCurrentBasket();
    var financePlans = [];
    var selectedFinancePlanId = null;
    var billingForm = null;
    var useNewRules = req.querystring.useNewRules && req.querystring.useNewRules == "true" ? true : false;
    if (currentBasket && Util.financeEnabled()) {
        var financeTotal = Util.getBasketTotal(currentBasket);
        financePlans = Util.getEnabledFinancePlans(financeTotal.value, useNewRules);
        var financePlan = Util.findPlansForEstimation(financeTotal.value, null, null, useNewRules, useNewRules);
        selectedFinancePlanId = financePlan.custom.planID;
        billingForm = COHelpers.prepareBillingForm(currentBasket);
    }

    // render template
    res.render('checkout/billing/paymentOptions/financingPlans', {
        financePlans: financePlans,
        selectedFinancePlanId: selectedFinancePlanId,
        forms: {
            billingForm: billingForm
        }
    });
    next();
});

/**
 * Get Order Lookup form
 */
server.get('AccountLookup', function (req, res, next) {
    var Util = require('~/cartridge/scripts/helpers/Util');
    var lookupInfo = Util.getContentAssetBody('td-account-lookup');

    var lookupForm = server.forms.getForm('accountLookup');
    lookupForm.clear();

    var currentYear = new Date().getFullYear();
    var startYear = currentYear - 100;
    var endYear = currentYear - 16;
    var financeYears = [];

    for (var j = startYear; j <= endYear; j++) {
        financeYears.push(j);
    }

    var financeDays = [];
    for (var i = 1; i <= 31; i++) {
        financeDays.push(i);
    }

    // render template
    res.render('finance/accountLookup', {
        lookupForm: lookupForm,
        financeYears: financeYears,
        financeDays: financeDays,
        lookupInfo: lookupInfo
    });
    next();
});

/**
 * Submit Account Lookup
 */
server.post('SubmitAccountLookup', function (req, res, next) {
    var Status = require('dw/system/Status');
    var Resource = require('dw/web/Resource');
    var Util = require('~/cartridge/scripts/helpers/Util');
    var LookupRequest = require('~/cartridge/scripts/helpers/LookupRequest');
    var CardholderModel = require('~/cartridge/scripts/models/Cardholder');

    var form = server.forms.getForm('accountLookup');
    var lastSSN = form.lastSSN.value;
    var postalCode = form.postalCode.value;
    var day = form.day.value;
    var month = form.month.value;
    var year = form.year.value;

    var lookupData = LookupRequest.prepareData(lastSSN, postalCode, year, month, day);
    var result = CardholderModel.getCardNumber(lookupData);
    var resultInfo;
    var resultTitle;
    var accountNumber;
    var accountNumberFormatted;
    var success = true;
    // Check if result status is ok and we have found account number
    if (result.status === Status.OK) {
        accountNumber = result.getDetail('accountNumber');
        // Account is not found
        if (!accountNumber) {
            res.json({
                error: true,
                accountNotFound: true
            });
            return next();
        }
        accountNumberFormatted = accountNumber.match(new RegExp('.{1,4}', 'g')).join('-');
        resultInfo = Util.getContentAssetBody('td-account-lookup-success');
        resultTitle = Resource.msg('finance.lookup.title.success', 'checkout', null);
    } else {
        resultInfo = Util.getContentAssetBody('td-account-lookup-error');
        resultTitle = Resource.msg('finance.lookup.title.error', 'checkout', null);
        success = false;
    }

    // render template
    res.render('finance/accountLookupResult', {
        resultInfo: resultInfo,
        resultTitle: resultTitle,
        accountNumber: accountNumber,
        accountNumberFormatted: accountNumberFormatted,
        success: success
    });
    return next();
});

module.exports = server.exports();
