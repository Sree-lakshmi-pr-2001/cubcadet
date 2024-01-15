'use strict';

var base = module.superModule;

var Resource = require('dw/web/Resource');

/**
 * @constructor
 * @classdesc CartModel class that represents the current basket
 *
 * @param {dw.order.Basket} basket - Current users's basket
 * @param {dw.campaign.DiscountPlan} discountPlan - set of applicable discounts
 */
function CartModel(basket) {
    base.call(this, basket);

    this.resources.calculatedTaxesLabel = Resource.msg('label.sales.tax', 'cart', null);
    this.resources.notCalculatedTaxesLabel = Resource.msg('label.notcalculated.sales.tax', 'cart', null);
}

module.exports = CartModel;
