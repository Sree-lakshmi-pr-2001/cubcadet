'use strict';

/* global request, session, empty */

var util = require('./TagManagerUtils');

var Site = require('dw/system/Site');

var TagMangerFactory = {

    /**
     * @param {Order} order - order object
     * @return {{id: string, affiliation: string, revenue: number, tax: number, shipping: number, coupon: (*|string)}} order confimation object
     */
    getConfirmationAction: function (order) {
        // mtds-404 determine pmethod (cc or td) and add to return
        return {
            id: order.orderNo,
            affiliation: Site.current.ID,
            customerType: order.customer.authenticated ? 'Existing' : 'New',
            customerId: order.customer.authenticated ? order.customerNo : order.customer.ID,
            revenue: order.totalGrossPrice.value.toFixed(2),
            subtotal: order.merchandizeTotalNetPrice.value.toFixed(2),
            tax: order.totalTax.value.toFixed(2),
            shipping: order.shippingTotalPrice.value.toFixed(2),
            discount: TagMangerFactory.getOrderDiscount(order),
            coupon: TagMangerFactory.getCouponList(order.couponLineItems.iterator()),
            pmethod: order.getPaymentInstruments()[0].paymentMethod === 'TD_FINANCE' ? 'tdfinancing' : 'cc'
        };
    },

    /**
     * Get order discount
     *
     * @param {dw.order.Order} order - Order object
     * @return {number} - amount of discount or zero
     */
    getOrderDiscount: function (order) {
        var discountAmount = 0;
        // order discounts
        if (order.merchandizeTotalNetPrice.value != order.adjustedMerchandizeTotalNetPrice.value) {
            discountAmount = order.merchandizeTotalNetPrice.subtract(order.adjustedMerchandizeTotalNetPrice).value;
        }
        // shipping discounts
        if (order.shippingTotalNetPrice.value != order.adjustedShippingTotalNetPrice.value) {
            discountAmount += order.shippingTotalNetPrice.subtract(order.adjustedShippingTotalNetPrice).value;
        }

        return discountAmount.toFixed(2);
    },

    /**
     * @param {Iterator.<CouponLineItem>} coupons - list of coupon
     * @return {string} - concatinated coupon codes
     */
    getCouponList: function (coupons) {
        var text = [];

        while (coupons.hasNext()) {
            var coupon = coupons.next();

            text.push(coupon.getCouponCode());
        }

        return text.join(',');
    },

    /**
     * @return {{sfccID: string, loggedInState: null}} customer object
     */
    getCustomer: function () {
        var customer = session.customer;
        var httpLocale = request.httpLocale;
        var customerId = (customer) ? customer.ID: '';
        customerId = decodeURIComponent(customerId);
        var regex = /[<>]/;
        if(regex.test(customerId)){
            customerId = customerId.split(/[<>]/)[0];
        }
        var obj = {
            sfccID: customerId,
            loggedInState: customer.authenticated
        };

        if (httpLocale) {
            obj.pageLanguage = httpLocale;
        }

        return obj;
    },

    /**
     * @param {Basket} basket - current basket
     * @param {string} step - checkout step
     * @return {{event: string, ecommerce: {checkout: {actionField: {step: string}, products: Array}}}} checkout layer object
     */
    getLayerCheckout: function (basket, step) {
        return {
            event: 'checkout',
            ecommerce: {
                checkout: {
                    actionField: {
                        step: step
                    },
                    products: util.getProductArrayFromList(basket.getProductLineItems().iterator(), this.getOrderProduct)
                }
            }
        };
    },

    /**
     * @param {Order} order - order object
     * @return {{ecommerce: {purchase: {actionField: (*|{id, affiliation, revenue, tax, shipping, coupon}), products: Array}}}} confirmation object
     */
    getLayerConfirmation: function (order) {
        return {
            ecommerce: {
                event: 'checkout',
                purchase: {
                    actionField: TagMangerFactory.getConfirmationAction(order),
                    products: util.getProductArrayFromList(order.productLineItems.iterator(), this.getOrderProduct)
                }
            }
        };
    },

    /**
     * @param {Iterator} listIterator - list iterator
     * @param {Function} objectCreationCallback - callback function
     * @return {{ecommerce: {impressions: Array}}} - impressions
     */
    getLayerImpressions: function (listIterator, objectCreationCallback) {
        return {
            ecommerce: {
                impressions: util.getProductArrayFromList(listIterator, objectCreationCallback)
            }
        };
    },

    /**
     * @param {Product} product - product object
     * @return {{ecommerce: {detail: {actionField: {list: String}, products: *[]}}}} pdp layer object
     */
    getLayerPdp: function (product) {
        // mtds-404 Only show PDP detail view in dataLayer if not dynosite page
        if (product.custom.dynosite == null || !product.custom.dynosite) {
            return {
                ecommerce: {
                    detail: {
                        actionField: { list: 'Product Detail Page' },
                        products: [TagMangerFactory.getProduct(product)],
                        dynosite: product.custom.dynosite
                    }
                }
            };
        }
    },

    /**
     * Data for a ProductLineItem
     * @param {ProductLineItem} productLineItem - product line item
     * @return {Object} - order product object
     */
    getOrderProduct: function (productLineItem) {
        var obj = TagMangerFactory.getProduct(productLineItem.product);

        obj.quantity = productLineItem.quantityValue;
        obj.price = productLineItem.proratedPrice.divide(productLineItem.quantityValue).value.toFixed(2);

        return obj;
    },

    /**
     * Gets shared product data
     * @param {Product} product - product object
     * @return {Object} - product id & name
     */
    getProduct: function (product) {
        return {
            id: product.ID,
            name: product.name,
            productType: product.custom['product-type'].value
        };
    }

};

module.exports = TagMangerFactory;
