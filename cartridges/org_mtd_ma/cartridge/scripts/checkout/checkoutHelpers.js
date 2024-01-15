'use strict';
/* global session, empty */

var base = module.superModule;

var Transaction = require('dw/system/Transaction');

/**
 * Clear saved td account number
 */
function clearSavedTDAccountNumber() {
    session.custom.tdAccountNumber = null;
}

/**
 * Get saved td account number
 * @returns {string} newly stored payment Instrument
 */
function getSavedTDAccountNumber() {
    return session.custom.tdAccountNumber;
}

/**
 * Copy tdAccountNumber into session and remove it from payment instrument to exclude
 * tdAccountNumber from the order and bm
 * @param {dw.order.Order} order - created order
 */
function saveTDAccountNumber(order) {
    // clear saved td account number
    clearSavedTDAccountNumber();

    for (var i = 0; i < order.paymentInstruments.length; i++) {
        var pi = order.paymentInstruments[i];
        if (!empty(pi.custom.tdAccountNumber)) {
            Transaction.begin();
            var maskedTDAccountNumber = '**** **** **** ' + pi.custom.tdAccountNumber.substr(pi.custom.tdAccountNumber.length - 4);
            session.custom.tdAccountNumber = maskedTDAccountNumber;
            pi.custom.tdAccountNumber = maskedTDAccountNumber;
            Transaction.commit();
        }
    }
}

function sendOrderConfirmationEmailFromSFCC(order){
    var ProductMgr = require('dw/catalog/ProductMgr');
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var formatMoney = require('dw/util/StringUtils').formatMoney;
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var TotalsModel = require('*/cartridge/models/totals');
    var template = '/checkout/confirmation/confirmationEmail';
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');
    var products = [];
    var product;
    var email = order.customerEmail;
    var param ={};
    for each(var lineItem in order.allProductLineItems){
        param.pid = lineItem.productID
        var product = ProductFactory.get(param);
        var productImgUrl = product.images.large[0].url;
        product = {
            productName: lineItem.lineItemText,
            productNo: lineItem.productID,
            quantity: lineItem.quantity.value.toFixed(),
            price: lineItem.price.value,
            productImgUrl : productImgUrl,
            productSalePrice: product.price.sales.formatted
        }
        products.push(product);
    }

    var totalsModel = new TotalsModel(order);
    var emailOrderObj = {
        orderNo: order.orderNo,
        customerFirstName: order.defaultShipment.shippingAddress.firstName,
        orderDate: order.creationDate,
        shippingAddress: order.defaultShipment.shippingAddress,
        billingAddress: order.billingAddress,
        products: products,
        shippingMethod: order.defaultShipment.shippingMethod.displayName
        }

        if(totalsModel.subTotal){
            emailOrderObj.subTotal = totalsModel.subTotal;
        }
        
        if(totalsModel.totalShippingCost){
            emailOrderObj.shippingCost = totalsModel.totalShippingCost;
        }

        if(totalsModel.totalTax){
            emailOrderObj.salesTax = totalsModel.totalTax;
        }

        if(totalsModel.orderLevelDiscountTotal){
            emailOrderObj.orderLevelDiscount =  totalsModel.orderLevelDiscountTotal.formatted;
        }

        if(totalsModel.shippingLevelDiscountTotal){
            emailOrderObj.shippingLevelDiscount =  totalsModel.shippingLevelDiscountTotal.formatted;
        }

    if(order.paymentInstrument.paymentMethod == 'CREDIT_CARD') {
        emailOrderObj.payment = {
            paymentMethod: order.paymentInstrument.paymentMethod,
            paymentMethodName: 'Credit Card',
            amountPaid: totalsModel.grandTotal,
            orderTotalAmount: totalsModel.grandTotal
        }

    } else if(order.paymentInstrument.paymentMethod == 'TD_FINANCE' ){
        var TDFinanceDisclosure = Site.current.getCustomPreferenceValue('TDFinanceDisclosure');
        var TDFinanceDisclosureObj = JSON.parse(TDFinanceDisclosure);
        var termsAndDisclosure = TDFinanceDisclosureObj[order.paymentInstrument.custom.tdPlanID];
        emailOrderObj.payment = {
            paymentMethod :order.paymentInstrument.paymentMethod,
            paymentMethodName: 'Cub Cadet Financing',
            accountNumber: order.paymentInstrument.custom.tdAccountNumber,
            amountFinanced: order.custom.TDFinanceOrderTotal,
            planId: order.paymentInstrument.custom.tdPlanID,
            orderTotalAmount: order.custom.TDFinanceOrderTotal,
            terms: termsAndDisclosure.terms,
            disclosure: termsAndDisclosure.fulldisclosure,
            disclaimer: termsAndDisclosure.disclaimer,
         }
         if(Site.current.ID == 'cubcadet'){
            emailOrderObj.payment.paymentMethodName = 'Cub Cadet Financing'
         } else if (Site.current.ID == 'troybilt'){
            emailOrderObj.payment.paymentMethodName = 'Troy Bilt Financing'
         }
    }
    

    var emailObj = {
        to: email,
        subject: Resource.msg('email.msg.subject.order.confirmation', 'email', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
    };

    var mailSent =  emailHelpers.send(emailObj, template, emailOrderObj);
    return mailSent;
}

var exports = base;
exports.getSavedTDAccountNumber = getSavedTDAccountNumber;
exports.saveTDAccountNumber = saveTDAccountNumber;
exports.sendOrderConfirmationEmailFromSFCC = sendOrderConfirmationEmailFromSFCC;
module.exports = exports;
