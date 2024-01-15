/* global request */
'use strict';

/**
 * Utility functions for Chase cartridge
 */

/* API Dependencies */
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var ArrayList = require('dw/util/ArrayList');

/**
 * Script dependencies
 */

/* Preference IDs */
var PREFERENCE = {

    /**
     * Enabled financing application
     *
     * @type {string}
     */
    ENABLED: 'financingTDapplicationEnabled',

    /**
     * Access Key
     *
     * @type {string}
     */
    ACCESS_KEY: 'financingTDaccessKey',

    /**
     * Application Domain
     *
     * @type {string}
     */
    APP_DOMAIN: 'financingTDapplicationDOMAIN',

    /**
     * Store ID
     *
     * @type {string}
     */
    STORE_ID: 'financingTDstoreID',

    /**
     * Store Number
     *
     * @type {string}
     */
    STORE_NUMBER: 'tdStoreNumber',

    /**
     * Finance Program
     *
     * @type {string}
     */
    FINANCE_PROGRAM: 'tdFinanceProgram'
};

exports.PREFERENCE = PREFERENCE;

/**
 * Convenience method to get a site custom preference
 *
 * @param {string} id -The Site Preference ID
 * @returns {*} - Value of custom site preference
 */
function getPreferenceValue(id) {
    return Site.getCurrent().getCustomPreferenceValue(id);
}

var VALUE = {
    /**
     * Site Preference value for enabling financing application
     * @type {string}
     */
    ENABLED: getPreferenceValue(PREFERENCE.ENABLED),

    /**
     * Site Preference value for access key
     * @type {string}
     */
    ACCESS_KEY: getPreferenceValue(PREFERENCE.ACCESS_KEY),

    /**
     * Site Preference value for app domain
     * @type {string}
     */
    APP_DOMAIN: getPreferenceValue(PREFERENCE.APP_DOMAIN),

    /**
     * Site Preference value for store ID
     * @type {string}
     */
    STORE_ID: getPreferenceValue(PREFERENCE.STORE_ID),

    /**
     * Site Preference value for Store Number
     * @type {string}
     */
    STORE_NUMBER: getPreferenceValue(PREFERENCE.STORE_NUMBER),

    /**
     * Site Preference value for Finance Program
     * @type {string}
     */
    FINANCE_PROGRAM: getPreferenceValue(PREFERENCE.FINANCE_PROGRAM),

    /**
     * Custom object ID that stores finance plans
     * @type {string}
     */
    FINANCE_PLANS_CO: 'TDFinancePlans',

    /**
     * URL Redirect Part
     * @type {string}
     */
    URL_REDIRECT_PART: '/cc/entry',

    /**
     * Finance Method ID
     * @type {string}
     */
    FINANCE_METHOD_ID: 'TD_FINANCE',

    /**
     * Estimation Content Asset Prefix ID
     * @type {string}
     */
    ESTIMATION_ASSET_PREFIX_ID: 'td-estimated-payment-'
};

exports.VALUE = VALUE;

/**
 * Shared Logger
 * @type {Log}
 */
var log = Logger.getLogger('financingApplication', 'financingApplication');

/**
 * Relate Logger
 * @type {Log}
 */
exports.log = log;

/**
 * Get User IP
 * @returns {string} - user IP address
 */
exports.getUserIp = function () {
    return request.httpHeaders.get('fastly-client-ip') ?
            request.httpHeaders.get('fastly-client-ip') : request.httpHeaders.get('x-is-remote_addr');
};

/**
 * Get Finance Plan Type
 * @param {dw.object.CustomObject} plan - plan object
 * @returns {string} - plan type: standard, deferred and apr
 */
function getFinancePlanType(plan) {
    var type = 'standard';
    var repaymentFactorValue = plan.custom.repaymentFactor.value;
    if ((!plan.custom.APR || plan.custom.APR === 0)
        && (!plan.custom.processFee || plan.custom.processFee === 0)
        && (plan.custom.termLength && plan.custom.termLength > 0)) {
        type = 'deferred';
    } else if((!plan.custom.APR || plan.custom.APR === 0)
    && (plan.custom.processFee && plan.custom.processFee > 0) && repaymentFactorValue == null) {
        type = 'deferred-promoFee';
    }else if (plan.custom.APR >= 0 && plan.custom.termLength > 0 && plan.custom.repaymentFactor) {
        type = 'apr';
    }
    return type;
}
exports.getFinancePlanType = getFinancePlanType;

/**
 * Get Display PDP Preference
 * @param {dw.object.CustomObject} plan - plan object
 * @returns {boolean} pdpDisplayPreference - Plan display preference
 */
function getPdpDisplayPreference(plan) {
    var pdpDisplayPreference = plan.custom.displayPDP;
    return pdpDisplayPreference;
}
exports.getPdpDisplayPreference = getPdpDisplayPreference;

/**
 * Get Display Cart Preference
 * @param {dw.object.CustomObject} plan - plan object
 * @returns {boolean} cartDisplayPreference - Plan display preference
 */
function getCartDisplayPreference(plan) {
    var cartDisplayPreference = plan.custom.displayCart;
    return cartDisplayPreference;
}
exports.getCartDisplayPreference = getCartDisplayPreference;

/**
 * Get Display Certain Finance Plan on Cart
 * @returns {boolean} certainFinancePlanDisplay - Certain plan display on Cart
 */
function isCertainPlanDisplayOnCart() {
    var BasketMgr = require('dw/order/BasketMgr');
    var certainFinancePlanDisplay = false;

    var currentBasket = BasketMgr.getCurrentBasket();
    if (currentBasket && currentBasket.adjustedMerchandizeTotalNetPrice) {
        var financeTotal = currentBasket.adjustedMerchandizeTotalNetPrice.value;
        var plan = this.findPlansForEstimation(financeTotal);

        if (plan) {
            certainFinancePlanDisplay = this.getCartDisplayPreference(plan);
        }
    }
    return certainFinancePlanDisplay;
}
exports.isCertainPlanDisplayOnCart = isCertainPlanDisplayOnCart;

/**
 * Check If plan with specific products contains  at least one product from the productList
 * @returns {array} - array with product ids
 */
function getCartProductIdList() {
    var BasketMgr = require('dw/order/BasketMgr');
    var productCheckList = [];
    var currentBasket = BasketMgr.getCurrentBasket();
    if (currentBasket && currentBasket.allProductLineItems.length > 0) {
        for (var i = 0; i < currentBasket.allProductLineItems.length; i++) {
            productCheckList[i] = currentBasket.allProductLineItems[i].productID;
        }
    }

    return productCheckList;
}

/**
 * Check If plan with specific products contains at least one product from the productList
 * @param {dw.object.CustomObject} plan - plan
 * @param {array} productList - productList
 * @returns {boolean} - result
 */
function isProductsMeetThePlan(plan, productList) {
    var result = false;
    if (productList && productList.length > 0 && plan.custom.eligibleProducts && plan.custom.eligibleProducts.length > 0) {
        var eligibleProductList = new ArrayList(plan.custom.eligibleProducts);
        for (var i = 0; i < productList.length; i++) {
            var product = productList[i];
            if (eligibleProductList.contains(product)) {
                result = true;
                break;
            }
        }
    }

    return result;
}

/**
 * Check if plan is enable for showing in list of plans
 * @param {dw.object.CustomObject} plan - plan object
 * @param {number} total - total threshold
 * @returns {boolean} - result
 */
function isPlanApplicable(plan, total) {
    var isApplicable = false;
    var planMinimumSpend = plan.custom.minimumSpend ? plan.custom.minimumSpend : 0;
    if (plan.custom.isPlanProductSpecific) {
        var productCheckList = getCartProductIdList();
        if (isProductsMeetThePlan(plan, productCheckList) && total >= planMinimumSpend) {
            isApplicable = true;
        }
    } else if (!plan.custom.isPlanProductSpecific && total >= planMinimumSpend) {
        isApplicable = true;
    }
    return isApplicable;
}

/**
 * Get all enabled finance plans
 * @param {number} total - total threshold
 * @returns {array} - list of enabled finance plans
 */
function getEnabledFinancePlans(total, checkProductSpecific) {
    var StringUtils = require('dw/util/StringUtils');
    var financePlanIterator = CustomObjectMgr.queryCustomObjects(VALUE.FINANCE_PLANS_CO, 'custom.enabled = true', 'custom.termLength asc', total);
    var financePlans = financePlanIterator.asList();
    var productCheckList = getCartProductIdList();
    var plans = [];
    var startIndex = 0;
    for (var i = 0, l = financePlans.size(); i < l; i++) {
        var financePlan = financePlans[i];
        if (checkProductSpecific && financePlan.custom.isPlanProductSpecific && !isProductsMeetThePlan(financePlan, productCheckList)) {
            continue;
        }

        var totalpayment = total ? (Number(total) + Number(financePlan.custom.processFee)).toFixed(2) : null;
        var planType = getFinancePlanType(financePlan);
        var monthlyPayment = null;

        if (planType === 'deferred' || planType === 'deferred-promoFee') {
            monthlyPayment = Math.ceil(Number(totalpayment) / financePlan.custom.termLength);
        } else if (planType === 'apr') {
            monthlyPayment = Math.ceil(Number(totalpayment) * Number(financePlan.custom.repaymentFactor.value));
            if(financePlan.custom && financePlan.custom.APR != 0){
                totalpayment = Math.ceil(Number(monthlyPayment) * Number(financePlan.custom.termLength));
            }
        }

        var planModel = {
            planId: financePlan.custom.planID,
            name: financePlan.custom.planName,
            minimumSpend: financePlan.custom.minimumSpend,
            apr: financePlan.custom.APR,
            termLength: financePlan.custom.termLength,
            processFee: financePlan.custom.processFee,
            repaymentFactor: financePlan.custom.repaymentFactor.value,
            type: getFinancePlanType(financePlan),
            ss: financePlan.custom.superscriptNumber,
            totalPayment: "$" + StringUtils.formatNumber(Number(totalpayment), '#,###.00'),
            monthlyPayment: monthlyPayment ? "$" + StringUtils.formatNumber(Number(monthlyPayment), '#,###') + "/MO" : "",
            basketTotal: total,
            isPlanApplicable: isPlanApplicable(financePlan, total)
        };
        // If no term length add to the end of queue
        if (!financePlan.custom.termLength) {
            plans[financePlans.size() - 1] = planModel;
        } else {
            plans[startIndex] = planModel;
            startIndex++;
        }
    }
    plans = plans.filter(function (item) { return item; }); // clear array items that are null
    return new ArrayList(plans);
}
exports.getEnabledFinancePlans = getEnabledFinancePlans;

function getPlanMonthlyPayment(plan, total) {
    var monthlyPayment = null;
    if (!plan || !total) {
        return monthlyPayment;
    }

    var planType = getFinancePlanType(plan);
    var termLength = plan.custom.termLength || 0;
    var processFee = plan.custom.processFee || 0;
    var totalpayment = (Number(total) + Number(processFee)).toFixed(2);

    if (planType === 'deferred' || planType === 'deferred-promoFee') {
        monthlyPayment = Math.ceil(Number(totalpayment) / termLength);
    } else if (planType === 'apr') {
        monthlyPayment = Math.ceil(Number(totalpayment) * Number(plan.custom.repaymentFactor.value));
    }

    return monthlyPayment;
}

/**
 * Find finance plan with specific products
 * @param {number} total - total threshold
 * @param {string} pageType - pageType
 * @param {array} productList - productList
 * @returns {dw.object.CustomObject|null} - finance plan
 */
function findPlansWithSpecificProducts(total, pageType, productList, useNewPriorityRule, useNewPlanListRule) {
    var financePlanIterator = null;
    var productCheckList = [];
    var firstPlan = null;

    if (pageType === 'pdp') {
        // PDP
        if (productList && productList.length > 0) {
            productCheckList = productList;
        }
    } else {
        // Cart and Billing Checkout
        productCheckList = getCartProductIdList();
    }

    if (!productCheckList || productCheckList.length === 0) {
        return firstPlan;
    }

    if (useNewPlanListRule) {
        financePlanIterator = CustomObjectMgr.queryCustomObjects(VALUE.FINANCE_PLANS_CO, 'custom.enabled = true AND custom.minimumSpend <= {0}', 'custom.termLength desc', total); // eslint-disable-line
    } else {
        financePlanIterator = CustomObjectMgr.queryCustomObjects(VALUE.FINANCE_PLANS_CO, 'custom.enabled = true AND custom.isPlanProductSpecific = true AND custom.minimumSpend <= {0}', 'custom.termLength desc', total); // eslint-disable-line
    }

    // find plan with the highest term and the highest minimum spend within the highest term
    while (financePlanIterator.hasNext()) {
        var currentPlan = financePlanIterator.next();
        // Check if at least one product meets the eligible products in plan
        if (!currentPlan.custom.isPlanProductSpecific || (currentPlan.custom.isPlanProductSpecific && isProductsMeetThePlan(currentPlan, productCheckList))) {
            if (!firstPlan) {
                // use this plan if first plan does not exists
                firstPlan = currentPlan;
            } else {
                var currentPlanTermLength = currentPlan.custom.termLength ? currentPlan.custom.termLength : 0;
                var currentPlanMinimumSpend = currentPlan.custom.minimumSpend ? currentPlan.custom.minimumSpend : 0;
                var currentPlanMonthlyPayment = getPlanMonthlyPayment(currentPlan, total) || 0;

                var firstPlanTermLength = firstPlan.custom.termLength ? firstPlan.custom.termLength : 0;
                var firstPlanMinimumSpend = firstPlan.custom.minimumSpend ? firstPlan.custom.minimumSpend : 0;
                var firstPlanMonthlyPayment = getPlanMonthlyPayment(firstPlan, total) || 0;

                if (useNewPriorityRule) {
                    if (currentPlanMonthlyPayment != 0 && currentPlanMonthlyPayment < firstPlanMonthlyPayment) {
                        // use current plan if its monthly payment is less than existing plan
                        firstPlan = currentPlan;
                    } else if (currentPlanMonthlyPayment != 0 && currentPlanMonthlyPayment == firstPlanMonthlyPayment && currentPlanTermLength < firstPlanTermLength) {
                        // if the monthly payments are equal
                        // use current plan if term of current plan is lesser then the term of existing plan
                        firstPlan = currentPlan;
                    } else if (currentPlanMonthlyPayment != 0 && currentPlanMonthlyPayment == firstPlanMonthlyPayment && currentPlanTermLength === firstPlanTermLength && currentPlanMinimumSpend > firstPlanMinimumSpend) {
                        // use current plan if term of current plan equals the term of existing plan
                        // and minimumSpend of current plan is higher than minimumSpend of existing plan
                        firstPlan = currentPlan;
                    } else if (firstPlanMonthlyPayment == 0 && currentPlanMonthlyPayment > 0) {
                        // in case the first plan assigned has 0 monthly payment we want to change that for any plan that has monthly payment different than 0
                        firstPlan = currentPlan;
                    }
                } else {
                    if (currentPlanTermLength > firstPlanTermLength) {
                        // use current plan if term of current plan is higher the term of existing plan
                        firstPlan = currentPlan;
                    } else if (currentPlanTermLength === firstPlanTermLength && currentPlanMinimumSpend > firstPlanMinimumSpend) {
                        // use current plan if term of current plan equals the term of existing plan
                        // and minimumSpend of current plan is higher than minimumSpend of existing plan
                        firstPlan = currentPlan;
                    } else {
                        // break loop in case if the term of current plan is less than term of existing plan
                        break;
                    }
                }
            }
        }
    }

    // Closes all system resources associated with this iterator.
    financePlanIterator.close();

    return firstPlan;
}

/**
 * Find finance plan for estimation
 * @param {number} total - total threshold
 * @returns {dw.object.CustomObject|null} - finance plan
 */
function findPlansByMinimumSpend(total) {
    // Issue that this request return fist item without termLength instead of highest
    var financePlanIterator = CustomObjectMgr.queryCustomObjects(VALUE.FINANCE_PLANS_CO, 'custom.enabled = true AND (NOT custom.isPlanProductSpecific = true) AND custom.minimumSpend <= {0}', 'custom.termLength desc', total);
    if (financePlanIterator.count > 0) {
        var firstPlan = financePlanIterator.next();
        if (financePlanIterator.count === 1 || firstPlan.custom.termLength > 0) {
            return firstPlan;
        }
        return financePlanIterator.next(); // return second plan with highest term
    }
    return null;
}

/**
 * Find finance plan for estimation
 * @param {number} total - total threshold
 * @param {string} pageType - pageType
 * @param {array} productList - productList
 * @returns {dw.object.CustomObject|null} - finance plan
 */
exports.findPlansForEstimation = function (total, pageType, productList, useNewPriorityRule, useNewPlanListRule) {
    // Check plans with specific products at first
    var planWithSpecificProducts = findPlansWithSpecificProducts(total, pageType, productList, useNewPriorityRule, useNewPlanListRule);
    if (planWithSpecificProducts) {
        return planWithSpecificProducts;
    }

    // Check plans with not specific products and minimum spend
    var planByMinimumSpend = findPlansByMinimumSpend(total);
    if (planByMinimumSpend) {
        return planByMinimumSpend;
    }

    // If any plan was not found
    return null;
};

/**
 * Check if finance is enabled as payment method
 * @returns {boolean} - flag if payment is enabled or not
 */
exports.financeEnabled = function () {
    var PaymentMgr = require('dw/order/PaymentMgr');

    var financePaymentMethod = PaymentMgr.getPaymentMethod(VALUE.FINANCE_METHOD_ID);

    return financePaymentMethod && financePaymentMethod.active;
};

/**
 * Get Content Asset Body
 *
 * @param {string} assetId - content asset ID
 * @returns {string} - return body of content asset
 */
exports.getContentAssetBody = function (assetId) {
    var ContentMgr = require('dw/content/ContentMgr');
    var ContentModel = require('*/cartridge/models/content');

    var html = '';
    var asset = ContentMgr.getContent(assetId);
    if (asset && asset.online) {
        var assetModel = new ContentModel(asset);
        html = assetModel.body.markup;
    }
    return html;
};

/**
 * Parse HTML with Finance plan data
 * @param {string} html - content asset html content
 * @param {dw.object.CustomObject} plan - plan object
 * @param {string} planType - finance plan type
 * @param {string} total - total paymetns
 * @returns {string} - final content
 */
exports.parseHtmlWithFinancePlan = function (html, plan, planType, total) {
    var StringUtils = require('dw/util/StringUtils');

    var resultHtml = html;
    var apr = plan.custom.APR || 0;
    var termLength = plan.custom.termLength || 0;
    var processFee = plan.custom.processFee || 0;
    var totalpayment = (Number(total) + Number(processFee)).toFixed(2);
    var sprScrptInt = plan.custom.superscriptNumber || 0;
    var minPurchase;
    var monthlyPayment;

    if (planType === 'deferred' || planType === 'deferred-promoFee') {
        monthlyPayment = Math.ceil(Number(totalpayment) / termLength);
        if(plan.custom.minimumSpend){
            minPurchase = plan.custom.minimumSpend;
        }
    } else if (planType === 'apr') {
        monthlyPayment = Math.ceil(Number(totalpayment) * Number(plan.custom.repaymentFactor.value));
        if(apr !== 0){
            totalpayment = Math.ceil(Number(monthlyPayment) * Number(termLength));
        }
    }

    if (monthlyPayment) {
        resultHtml = resultHtml.replace('{monthlypayment}', monthlyPayment.toFixed(), 'g');
    }

    if(minPurchase){
        resultHtml = resultHtml.replace('{minPurchase}', minPurchase.toFixed(), 'g'); 
    }

    resultHtml = resultHtml.replace('{totalpayment}', StringUtils.formatNumber(Number(totalpayment), '#,###.00'), 'g');
    resultHtml = resultHtml.replace('{apr}', StringUtils.formatNumber(apr, '#,###.##'), 'g');
    resultHtml = resultHtml.replace('{termlength}', termLength.toFixed(), 'g');
    resultHtml = resultHtml.replace('{processfee}', StringUtils.formatNumber(processFee, '#,###.##'), 'g');
    resultHtml = resultHtml.replace('{superscriptnumber}', sprScrptInt.toFixed(), 'g');

    return resultHtml;
};

/**
 * Get Finance Payment Instrument
 * @param {dw.order.Basket} basket - basket object
 * @returns {string|null} - selected plan id or null
 */
exports.getFinancePaymentInstrument = function (basket) {
    var financePI = null;
    var financePIs = basket.getPaymentInstruments(VALUE.FINANCE_METHOD_ID);
    if (financePIs.size() > 0) {
        financePI = financePIs[0];
    }
    return financePI;
};

/**
 * Get Plan Object by ID
 * @param {string} planId - plan ID
 * @returns {obj} - plan object
 */
exports.getPlanObject = function (planId) {
    var financePlan = CustomObjectMgr.queryCustomObject(VALUE.FINANCE_PLANS_CO, 'custom.planID = {0}', String(planId));
    var obj;
    if (financePlan) {
        obj = {
            apr: financePlan.custom.APR,
            minimumSpend: financePlan.custom.minimumSpend,
            planID: financePlan.custom.planID,
            planName: financePlan.custom.planName,
            processFee: financePlan.custom.processFee,
            repaymentFactor: financePlan.custom.repaymentFactor.value,
            termLength: financePlan.custom.termLength,
            superscriptNumber: financePlan.custom.superscriptNumber
        };

        return obj;
    }
    return '';
};

/**
 * Get Basket Total including tax and shipping
 * @param {dw.order.Basket} basket - basket object
 * @returns {dw.value.Money} - return total money object of the basekt
 */
exports.getBasketTotal = function (basket) {
    var financeTotal = basket.adjustedMerchandizeTotalNetPrice;
    if (basket.adjustedShippingTotalNetPrice.available) {
        financeTotal = financeTotal.add(basket.adjustedShippingTotalNetPrice);
    }
    if (basket.totalTax.available) {
        financeTotal = financeTotal.add(basket.totalTax);
    }

    return financeTotal;
};

exports.getDisClosureContentAssetBody = function (assetId, plan) {
    var ContentMgr = require('dw/content/ContentMgr');
    var ContentModel = require('*/cartridge/models/content');
    var html = '';
    var asset = ContentMgr.getContent(assetId);
    if (asset && asset.online) {
        var assetModel = new ContentModel(asset);
        html = assetModel.body.markup;
        if(plan.type === 'deferred') {
            html = html.replace('{0}', plan.minimumSpend);
        } else if(plan.type === 'deferred-promoFee') {
            html = html.replace('{0}', plan.processFee).replace('{1}', plan.minimumSpend);
        } else if(plan.type === 'apr') {
            html = html.replace('{0}', plan.minimumSpend).replace('{1}', plan.processFee);
        } else if(plan.type === 'standard') {
            html = html.replace('{0}', plan.apr)
        }
    }
    return html;
};
