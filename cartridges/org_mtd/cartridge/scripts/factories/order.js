'use strict';
var OrderMgr = require('dw/order/OrderMgr');
var Logger = require('dw/system/Logger');
var formatMoney = require('dw/util/StringUtils').formatMoney;
var Money = require('dw/value/Money');
var ProductMgr = require('dw/catalog/ProductMgr');
var HashMap = require('dw/util/HashMap');

/**
 * get shipping method property details for ship method description from epcot
 * @param {string} shippingMethod shipping method description
 * @returns {string} code to look up status in property file
 */
function getShippingMethodPropertyFromEpcot(shippingMethod) {
    var shippingMethodProperty = 'checkout.factory.delivery.details';

    if (shippingMethod === 'Dealer Delivery') {
        shippingMethodProperty = 'checkout.dealer.delivery.details';
    }
    if (shippingMethod === 'Dealer Pickup') {
        shippingMethodProperty = 'checkout.dealer.pickup.details';
    }
    return shippingMethodProperty;
}

/**
 * Standardize order number for comparisons
 * @param {Integer} orderStatusId status code from Epcot DB
 * @returns {string} code to look up status in property file
 */
function getOrderStatusFromId(orderStatusId) {
    // default status will be "open"
    var orderStatusCode = 'label.order.status.OPEN';

    if (orderStatusId === 6 || orderStatusId === 13 || orderStatusId === 14 || orderStatusId === 23) {
        orderStatusCode = 'label.order.status.CANCELLED';
    }

    if (orderStatusId === 16) {
        orderStatusCode = 'label.order.shipping.status.PARTSHIPPED';
    }

    if (orderStatusId === 5) {
        orderStatusCode = 'label.order.shipping.status.SHIPPED';
    }

    if (orderStatusId === 26) {
        orderStatusCode = 'label.order.shipping.status.SENT_TO_DEALER';
    }

    return orderStatusCode;
}
/**
 * Standardize order number for comparisons
 * @param {Date} date - date in js format
 * @param {string} country - country US or CA
 * @returns {string} date in MM/DD/YYYY for US or DD/MM/YYYY
 */
function formatDate(date, country) {
    var month = '' + (date.getMonth() + 1);
    var day = '' + date.getDate();
    var year = date.getFullYear();
    if (month.length < 2) {
        month = '0' + month;
    }

    if (day.length < 2) {
        day = '0' + day;
    }
    if (country === 'US') {
        return [month, day, year].join('/');
    }
    return [day, month, year].join('/');
}


/**
 * Standardize order number for comparisons
 * @param {string} orderNumber - order number
 * @returns {string} order number formatted
 */
function normalizeOrderNumber(orderNumber) {
    if (!orderNumber) return null;
    return orderNumber.toUpperCase();
}

/**
 * Standardize email for comparisons
 * @param {string} emailAddress - email address
 * @returns {string} email formatted
 */
function normalizeEmailAddress(emailAddress) {
    if (!emailAddress) return null;
    return emailAddress.toLowerCase();
}

/**
 * Standardize postal code for comparisons
 * @param {string} iPostalCode - postal or zipcode
 * @returns {string} postal or zipcode formatted
 */
function normalizePostalCode(iPostalCode) {
    if (!iPostalCode) return null;
    var postalCode = iPostalCode.replace(' ', '').toUpperCase();
    var billingPostalArr = postalCode.split('-');
    return billingPostalArr[0];
}

/**
 * Take shipped date string YYYYMMDD and convert to a js date object
 * @param {string} shippedDate shipped date in YYYYMMDD format
 * @returns {Date} javascript Date
 */
function readShippedDate(shippedDate) {
    if (shippedDate.length === 8) {
        var dateObject = new Date();
        dateObject.setFullYear(shippedDate.substring(0, 4));
        dateObject.setMonth(shippedDate.substring(4, 6) - 1);
        dateObject.setDate(shippedDate.substring(6, 8));
        return dateObject;
    }

    return null;
}

/**
 * get order tracking information and clean up for display on the tracking result page
 * orders may get duplicate tracking numbers because we receive one tracking number per unique item in a box.
 * this function will loop through all the results and only return the unique tracking numbers
 * @param {string} trackings array of tracking details from epcot service
 * @param {string} country country for this order US or CA
 * @returns {Array} Array of tracking details
 */
function generateSFCCTrackingDetails(trackings, country) {
    var trackingDetails = [];

    var uniqueTrackingNumber = new HashMap();
    for (var i = 0; i < trackings.length; i++) {
        var tracking = trackings[i];
        var trackingDetail = {};
        if (!uniqueTrackingNumber.containsKey(tracking.trackingNumber)) {
            uniqueTrackingNumber.put(tracking.trackingNumber, true);

            trackingDetail.country = country;
            trackingDetail.carrierName = tracking.carrierName;
            trackingDetail.carrierType = tracking.carrierType;
            trackingDetail.trackingNumber = tracking.trackingNumber;

            if (tracking.shippedDate) {
                var shippedDate = readShippedDate(tracking.shippedDate);

                if (shippedDate) {
                    trackingDetail.shippedDate = formatDate(shippedDate, country);
                }
            }
            if (tracking.url) {
                trackingDetail.url = tracking.url;
            }
            trackingDetails.push(trackingDetail);
        }
    }

    return trackingDetails;
}
/**
 * get order from epcot (MTD's internal CSR application) datbase service
 * @param {string} iOrderNumber order number
 * @param {string} iEmailAddress email address on the order
 * @param {string} iPostalCode billing postal/zip code on the order
 * @returns {Object} Order object representing the order from the service. the error field will be added true/false if it is successful
 */
function getOrderFromEpcot(iOrderNumber, iEmailAddress, iPostalCode) {
    var OrderInquiry = require('int_mtdservices/cartridge/scripts/models/OrderInquiry');
    var ImageModel = require('*/cartridge/models/product/productImages');

    var orderNumber = normalizeOrderNumber(iOrderNumber);
    var email = normalizeEmailAddress(iEmailAddress);
    var postalCode = normalizePostalCode(iPostalCode);

    var orderInquiryResult = OrderInquiry.orderInquiry(orderNumber);
    var orderFromEpcot = orderInquiryResult.getDetail('response');

    if (!orderFromEpcot || orderFromEpcot.errorMessage) {
        Logger.error(orderNumber + ' not found in epcot');

        return {
            error: true
        };
    }

    var orderEmail = normalizeEmailAddress(orderFromEpcot.header.email);
    var orderPostalCode = normalizePostalCode(orderFromEpcot.address.billing.zipcode);

    if (orderEmail !== email || orderPostalCode !== postalCode) {
        Logger.error(orderNumber + ' exists in epcot but email or postal code do not match');
        return {
            error: true
        };
    }
    var currency = orderFromEpcot.header.currency;

    if (!currency) currency = 'USD';
    var targetCountry = 'US';

    if (!currency) currency = 'USD';
    if (currency === 'CAD') targetCountry = 'CA';

    var orderModel = {};
    orderModel.orderStatusId = getOrderStatusFromId(orderFromEpcot.header.orderStatusId);
    orderModel.error = false;
    var billing = {};
    orderModel.billing = {
        billingAddress: {
            address: billing
        }
    };

    orderModel.header = {};
    orderModel.orderNumber = orderNumber;
    orderModel.creationDate = formatDate(new Date(orderFromEpcot.header.orderDate), targetCountry);

    orderModel.shipping = [];
    var shipping = {};
    orderModel.shipping.push(shipping);
    shipping.selectedShippingMethod = {};
    shipping.selectedShippingMethod.ID = '';
    shipping.methodProperty = getShippingMethodPropertyFromEpcot(orderFromEpcot.header.shippingMethodDescription);
    shipping.selectedShippingMethod.displayName = orderFromEpcot.header.shippingMethodDescription;
    shipping.selectedShippingMethod.shippingCost = formatMoney(new Money(orderFromEpcot.totals.shipping, currency));
    orderModel.orderEmail = orderEmail;
    billing.postalCode = orderFromEpcot.address.billing.zipcode;
    billing.stateCode = orderFromEpcot.address.billing.state;
    billing.city = orderFromEpcot.address.billing.city;
    billing.address1 = orderFromEpcot.address.billing.address1;
    billing.address2 = orderFromEpcot.address.billing.address2;
    billing.lastName = orderFromEpcot.address.billing.name;
    orderModel.billing.payment = null;
    shipping.shippingAddress = {};
    shipping.shippingAddress.postalCode = orderFromEpcot.address.shipping.zipcode;
    shipping.shippingAddress.stateCode = orderFromEpcot.address.shipping.state;
    shipping.shippingAddress.city = orderFromEpcot.address.shipping.city;
    shipping.shippingAddress.address1 = orderFromEpcot.address.shipping.address1;
    shipping.shippingAddress.address2 = orderFromEpcot.address.shipping.address2;
    shipping.shippingAddress.lastName = orderFromEpcot.address.shipping.name;

    if (orderFromEpcot.address.dealer.name !== null) {
        orderModel.dealerInfo = {
            companyName: orderFromEpcot.address.dealer.name,
            address1: orderFromEpcot.address.dealer.address1,
            address2: orderFromEpcot.address.dealer.address2,
            city: orderFromEpcot.address.dealer.city,
            state: orderFromEpcot.address.dealer.state,
            postalCode: orderFromEpcot.address.dealer.zipcode,
            phone: orderFromEpcot.address.dealer.phone
        };
    }

    if (orderFromEpcot.tracking && orderFromEpcot.tracking.length > 0) {
        orderModel.trackingDetails = generateSFCCTrackingDetails(orderFromEpcot.tracking, targetCountry);
    } else {
        orderModel.trackingDetails = [];
    }

    var totals = {};
    orderModel.totals = totals;

    totals.subTotal = formatMoney(new Money(orderFromEpcot.totals.orderSubtotal, currency));
    totals.orderLevelDiscountTotal = {
        formatted: formatMoney(new Money(orderFromEpcot.totals.orderDiscount, currency)),
        value: orderFromEpcot.totals.orderDiscount
    };
    totals.totalShippingCost = formatMoney(new Money(orderFromEpcot.totals.shipping, currency));
    totals.totalTax = formatMoney(new Money(orderFromEpcot.totals.salesTax, currency));
    totals.grandTotal = formatMoney(new Money(orderFromEpcot.totals.grandTotal, currency));

    totals.shippingLevelDiscountTotal = {
        formatted: 0,
        value: 0
    };

    orderModel.items = [];

    var IMAGE_SIZE = 'small';
    var totalQuantity = 0;
    for (var i = 0; i < orderFromEpcot.items.length; i++) {
        var epcotProduct = orderFromEpcot.items[i];

        if (epcotProduct.basePrice) {
            epcotProduct.basePrice = formatMoney(new Money(epcotProduct.basePrice, currency));
        }

        if (epcotProduct.sellingPrice) {
            epcotProduct.sellingPrice = formatMoney(new Money(epcotProduct.sellingPrice, currency));
        }

        if (epcotProduct.extendedPrice) {
            epcotProduct.extendedPrice = formatMoney(new Money(epcotProduct.extendedPrice, currency));
        }

        totalQuantity += epcotProduct.quantity;
        var epcotProductId = epcotProduct.itemNumber;
        var productFromSFCC = ProductMgr.getProduct(epcotProductId);
        if (productFromSFCC) {
            var imageData = new ImageModel(productFromSFCC, { types: [IMAGE_SIZE], quantity: 'single' });
            if (imageData && imageData[IMAGE_SIZE] && imageData[IMAGE_SIZE].length > 0) {
                var image1 = imageData[IMAGE_SIZE][0];
                if (image1) {
                    epcotProduct.imageData = image1;
                }
            }
            if (productFromSFCC.getName()) {
                epcotProduct.name = productFromSFCC.getName();
            } else {
                epcotProduct.name = epcotProductId;
            }
            epcotProduct.sfccProduct = productFromSFCC;
        } else {
            epcotProduct.name = epcotProductId;
        }

        orderModel.items.push(epcotProduct);
    }

    orderModel.totalQuantity = totalQuantity;
    orderModel.isEpcotOrder = true;
    return orderModel;
}

/**
 * get order from commerce cloud system
 * @param {string} iOrderNumber order number
 * @param {string} iEmailAddress email address on the order
 * @param {string} iPostalCode billing postal/zip code on the order
 * @param {dw/util/Locale} currentLocale locale for the user
 * @returns {Object} Order object representing the order from the service. the error field will be added true/false if it is successful
 */
function getOrderFromSFCC(iOrderNumber, iEmailAddress, iPostalCode, currentLocale) {
    var OrderModel = require('*/cartridge/models/order');
    var orderNumber = normalizeOrderNumber(iOrderNumber);
    var email = normalizeEmailAddress(iEmailAddress);
    var postalCode = normalizePostalCode(iPostalCode);

    var orderFromSFCC = OrderMgr.getOrder(orderNumber);
    if (!orderFromSFCC) {
        Logger.error(orderNumber + ' not found in SFCC');

        return {
            error: true
        };
    }

    var config = {
        numberOfLineItems: '*'
    };

    var orderModel = new OrderModel(
        orderFromSFCC,
        { config: config, countryCode: currentLocale.country, containerView: 'order' }
    );

    var orderEmail = normalizeEmailAddress(orderModel.orderEmail);
    var orderPostalCode = normalizePostalCode(orderModel.billing.billingAddress.address.postalCode);

    if (orderEmail !== email || orderPostalCode !== postalCode) {
        Logger.error(orderNumber + ' exists but email or postal code do not match');
        return {
            error: true
        };
    }
    orderModel.error = false;
    return orderModel;
}

module.exports.getOrderFromEpcot = getOrderFromEpcot;
module.exports.getOrderFromSFCC = getOrderFromSFCC;
