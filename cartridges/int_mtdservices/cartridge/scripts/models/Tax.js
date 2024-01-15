'use strict';

/**
 * API dependencies
 */
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var Money = require('dw/value/Money');

/**
 * Include dependencies
 */
var Util = require('~/cartridge/scripts/helpers/Util');
var TaxHelper = require('~/cartridge/scripts/helpers/TaxHelper');
var TaxRequest = require('~/cartridge/scripts/helpers/TaxRequest');
var OAuthModel = require('~/cartridge/scripts/models/OAuth');
var RestServices = require('~/cartridge/scripts/services/RestServices');
var collections = require('*/cartridge/scripts/util/collections');

/**
 * Export Values of Util script
 */
exports.VALUE = Util.VALUE;

/**
 * Get tax object
 *
 * @param {Object} taxRequest - request object
 * @returns {dw.system.Status} - return status of tax API call
 */
exports.get = function (taxRequest) {
    var status;
    var code;
    var responseObject;
    try {
        // Verify if we have a tax request param
        if (!taxRequest) {
            throw new Error('No required parameters passed');
        }

        // Make API call
        var token = OAuthModel.getToken();
        var result = RestServices.TaxService.call({
            method: 'POST',
            request: taxRequest,
            authorization: Util.VALUE.AUTH_TYPE + ' ' + token
        });
        responseObject = result.object;
        if (result.ok) {
            status = Status.OK;
            code = 'OK';
        } else {
            status = Status.ERROR;
            code = result.error;
        }
    } catch (e) {
        // var exception = e;
        Util.log.error('{0} - {1}', e, e.stack);
        status = Status.ERROR;
        code = 'SYSTEM_ERROR';
    }

    var responseStatus = new Status(status, code);
    // Add redirect URL data to Status
    if (!responseStatus.isError()) {
        responseStatus.addDetail('response', responseObject);
    }
    return responseStatus;
};

/**
 * Calculate taxes on basket
 *
 * @param {dw.order.Basket} basket - basket object
 * @param {boolean} forceApiCall - force API call any way
 */
exports.calculate = function (basket, forceApiCall) {
    // Verify that we have shipping address
    if (!basket.defaultShipment
        || !basket.defaultShipment.shippingAddress
        || !basket.defaultShipment.shippingAddress.address1
        || (basket.productLineItems.size() === 0 && basket.giftCertificateLineItems.size() === 0)
    ) {
        // otherwise reset taxes to null
        var lineItems = basket.getAllLineItems();
        collections.forEach(lineItems, function (lineItem) {
            lineItem.updateTax(null);
        });
        return;
    }

    // Verify if can used cached response
    var skipTaxCalculation = TaxHelper.skipTaxCalculation(basket);
    // Get tax response: from API call or from basket attribute
    var taxResponse;
    if (forceApiCall || !skipTaxCalculation || !basket.custom.mtdTaxResponse) {
        var taxRequest = TaxRequest.getRequest(basket);
        var taxResult = this.get(taxRequest);
        if (!taxResult.error) {
            taxResponse = taxResult.getDetail('response');
            // Save response to custom attribute
            Transaction.wrap(function () {
                basket.custom.mtdTaxResponse = JSON.stringify(taxResponse); // eslint-disable-line no-param-reassign
            });
        } else {
            Transaction.wrap(function () {
                basket.custom.mtdTaxResponse = null; // eslint-disable-line no-param-reassign
            });
            return;
        }
    } else {
        // Get data from custom attribute
        taxResponse = JSON.parse(basket.custom.mtdTaxResponse);
    }

    // Get shipping and discount values
    var shippingTax = {
        rate: 0,
        amount: 0
    };
    var disountTax = {
        rate: 0,
        amount: 0
    };
    if ('returnedSpecialCharges' in taxResponse) {
        taxResponse.returnedSpecialCharges.forEach(function (сharge) {
            if (сharge.salesTaxAmount < 0) {
                disountTax.rate = сharge.salesTaxRate;
                disountTax.amount = сharge.salesTaxAmount;
            } else {
                shippingTax.rate = сharge.salesTaxRate;
                shippingTax.amount = сharge.salesTaxAmount;
            }
        });
    }

    // Group items taxes by sequence number
    var itemTaxes = [];
    if (taxResponse && 'returnedItemDetails' in taxResponse) {
        taxResponse.returnedItemDetails.forEach(function (itemDetail) {
            itemTaxes[itemDetail.returnedItemSequence] = itemDetail;
        });
    }

    // Calculate taxes on basket
    Transaction.wrap(function () {
        // Update items tax
        collections.forEach(basket.allLineItems, function (lineItem) {
            var className = lineItem.constructor.name;
            if (className === 'dw.order.ProductLineItem') {
                var itemTax = itemTaxes[lineItem.position];
                if (itemTax) {
                    var productTaxAmount = itemTax.salesTaxAmount;
                    var productTaxAmountMoney = new Money(productTaxAmount, basket.currencyCode);
                    lineItem.updateTaxAmount(productTaxAmountMoney);
                    lineItem.setTaxRate(itemTax.salesTaxRate);
                }
            } else if (className === 'dw.order.ShippingLineItem') {
                var shippingTaxAmount = (lineItem.adjustedNetPrice.value > 0 && shippingTax) ? shippingTax.amount : 0;
                var shippingTaxAmountMoney = new Money(shippingTaxAmount, basket.currencyCode);
                lineItem.updateTaxAmount(shippingTaxAmountMoney);
                lineItem.setTaxRate(shippingTax.rate);
            } else if (className === 'dw.order.ProductShippingLineItem') {
                // Make it zero, taxes applied to shipping line item
                lineItem.updateTax(0.00);
                lineItem.setTaxRate(0);
            } else {
                // price adjustments...
                lineItem.updateTax(0.00);
                lineItem.setTaxRate(0);
            }
        });

        // Update order price adjustments and shipping price adjustment
        if (!basket.getPriceAdjustments().empty || !basket.getShippingPriceAdjustments().empty) {
            var totalExcludingOrderDiscount = basket.getAdjustedMerchandizeTotalPrice(false);
            var totalIncludingOrderDiscount = basket.getAdjustedMerchandizeTotalPrice(true);
            var orderDiscountAmount = totalExcludingOrderDiscount.subtract(totalIncludingOrderDiscount);
            var basketPriceAdjustments = basket.getPriceAdjustments();
            var basketPriceAdjustmentsLength = basketPriceAdjustments.size();
            var subtractedDiscount = 0;
            for (var i = 0; i < basketPriceAdjustmentsLength; i++) {
                var basketPriceAdjustment = basketPriceAdjustments[i];
                var taxAmount;
                if (i === basketPriceAdjustmentsLength - 1) {
                    taxAmount = disountTax.amount - subtractedDiscount;
                } else {
                    var lineItemCoefficient = Math.abs(basketPriceAdjustment.price.value) / orderDiscountAmount.value;
                    taxAmount = disountTax.amount * lineItemCoefficient;
                    subtractedDiscount += taxAmount;
                }
                var adjustementTaxRate = taxAmount / Math.abs(basketPriceAdjustment.price.value);
                var taxAmountMoney = new Money(taxAmount, basket.currencyCode);
                basketPriceAdjustment.updateTaxAmount(taxAmountMoney);
                basketPriceAdjustment.setTaxRate(adjustementTaxRate);
            }

            var basketShippingPriceAdjustments = basket.getShippingPriceAdjustments().iterator();
            while (basketShippingPriceAdjustments.hasNext()) {
                var basketShippingPriceAdjustment = basketShippingPriceAdjustments.next();
                basketShippingPriceAdjustment.updateTax(0.00);
                basketShippingPriceAdjustment.setTaxRate(0);
            }
        }
    });
};
