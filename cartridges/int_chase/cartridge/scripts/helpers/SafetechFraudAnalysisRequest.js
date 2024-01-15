/* global session empty */
'use strict';

/**
 * Include Modules
 */
var Util = require('~/cartridge/scripts/helpers/Util');

/**
 * Get Request Object
 *
 * @param {string} paymentData - Payment Data in JSON format
 * @param {dw.ws.WebReference2} chaseWebReference - WSDL reference
 * @param {dw.svc.ServiceCredential} credentials - Service creds
 * @param {dw.order.Order} order - the order
 * @returns {Object} - return request object
 */
exports.getRequest = function (paymentData, chaseWebReference, credentials, order) {
    var chaseHelpers = require('*/cartridge/scripts/helpers/chaseHelpers');
    var request = chaseWebReference.SafetechFraudAnalysisRequestElement(); // eslint-disable-line new-cap

    // Set credentials
    request.orbitalConnectionUsername = credentials.user;
    request.orbitalConnectionPassword = credentials.password;

    // Set Configuration
    request.version = Util.VALUE.SOAP_VERSION;
    request.bin = Util.VALUE.SOAP_BIN;
    request.merchantID = Util.VALUE.MERCHANT_ID;
    request.terminalID = Util.VALUE.TERMINAL_ID;

    /* Add Base Elements Section */
    var baseElementsType = chaseWebReference.BaseElementsType(); // eslint-disable-line new-cap

    baseElementsType.industryType = Util.VALUE.INDUSTRY_TYPE.EC;
    baseElementsType.cardBrand = 'FC';
    baseElementsType.ccAccountNum = paymentData.cardNumber;

    // Set Address
    baseElementsType.avsName = Util.cleanTruncate(paymentData.fullName, Util.VALUE.LENGTH.AVS_NAME);
    baseElementsType.avsAddress1 = Util.cleanTruncate(paymentData.address1, Util.VALUE.LENGTH.AVS_ADDRESS_1);
    if ('address2' in paymentData && paymentData.address2 !== null) {
        baseElementsType.avsAddress2 = Util.cleanTruncate(paymentData.address2, Util.VALUE.LENGTH.AVS_ADDRESS_2);
    }
    baseElementsType.avsCity = Util.cleanTruncate(paymentData.city, Util.VALUE.LENGTH.AVS_CITY);
    baseElementsType.avsState = paymentData.state;
    baseElementsType.avsZip = paymentData.zip;
    baseElementsType.avsCountryCode = paymentData.countryCode;
    baseElementsType.avsPhone = paymentData.phone;

    // Set Shipping Address
    baseElementsType.avsDestName = Util.cleanTruncate(paymentData.destFullName, Util.VALUE.LENGTH.AVS_DEST_NAME);
    baseElementsType.avsDestAddress1 = Util.cleanTruncate(paymentData.destAddress1, Util.VALUE.LENGTH.AVS_DEST_ADDRESS_1);
    if ('destAddress2' in paymentData && paymentData.destAddress2 !== null) {
        baseElementsType.avsDestAddress2 = Util.cleanTruncate(paymentData.destAddress2, Util.VALUE.LENGTH.AVS_DEST_ADDRESS_2);
    }
    baseElementsType.avsDestCity = Util.cleanTruncate(paymentData.destCity, Util.VALUE.LENGTH.AVS_DEST_CITY);
    baseElementsType.avsDestState = paymentData.destState;
    baseElementsType.avsDestZip = paymentData.destZip;
    baseElementsType.avsDestCountryCode = paymentData.destCountryCode;
    baseElementsType.avsDestPhoneNum = paymentData.destPhone;

    // Set Order ID
    baseElementsType.orderID = paymentData.orderId;

    // Set Order Amount
    baseElementsType.amount = paymentData.amount;

    // Set Customer Email
    baseElementsType.customerEmail = paymentData.customerEmail;

    request.baseElements = baseElementsType;

    /* Add Fraud Analysis Section */
    var fraudAnalysisType = chaseWebReference.FraudAnalysisType(); // eslint-disable-line new-cap
    fraudAnalysisType.fraudScoreIndicator = '1';
    fraudAnalysisType.rulesTrigger = 'N';
    fraudAnalysisType.safetechMerchantID = Util.VALUE.SAFETECH_MERCHANT_ID;
    fraudAnalysisType.kaptchaSessionID = Util.getKaptchaSessionID();
    var websiteShortName = Util.VALUE.SAFETECH_WEBSITE_SHORT_NAME;
    if (websiteShortName && websiteShortName.displayValue) {
        fraudAnalysisType.websiteShortName = websiteShortName.displayValue;
    }

    if (!empty(order)) {
        var kttData = chaseHelpers.getKttData(order);
        fraudAnalysisType.kttVersionNumber = '1';
        fraudAnalysisType.kttDataString = kttData.dataString;
        fraudAnalysisType.kttDataLength = kttData.dataLength;
    }
    request.fraudAnalysis = fraudAnalysisType;

    return request;
};

/**
 * Get Payment Data in JSON format
 *
 * @param {dw.order.Order} order - Order object
 * @param {dw.order.OrderPaymentInstrument} paymentInstrument - payment instrument
 * @param {dw.order.OrderAddress} billingAddress - billing address
 * @param {dw.order.OrderAddress} shippingAddress - shipping address
 * @returns {Object} - JSON object of payment data
 */
exports.getPaymentData = function (order, paymentInstrument, billingAddress, shippingAddress) {
    var data = {
        cardNumber: '0000000000000000', // 16 zeros will be passed for the Creditcard Number. It is important
        fullName: billingAddress.fullName,
        address1: billingAddress.address1,
        address2: (billingAddress.address2 !== '' && billingAddress.address2 !== null) ? billingAddress.address2 : null,
        city: billingAddress.city,
        state: billingAddress.stateCode,
        zip: billingAddress.postalCode,
        countryCode: billingAddress.countryCode.value.toUpperCase(),
        phone: billingAddress.phone,
        amount: paymentInstrument.paymentTransaction.amount.multiply(100).value,
        orderId: order.orderNo,
        customerEmail: order.customerEmail,
        destFullName: shippingAddress.fullName,
        destAddress1: shippingAddress.address1,
        destAddress2: shippingAddress.address2,
        destCity: shippingAddress.city,
        destState: shippingAddress.stateCode,
        destZip: shippingAddress.postalCode,
        destCountryCode: shippingAddress.countryCode.value.toUpperCase(),
        destPhone: shippingAddress.phone
    };

    return data;
};
