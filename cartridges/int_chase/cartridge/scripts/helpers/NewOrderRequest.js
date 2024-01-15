/* global session empty */
'use strict';

/**
 * API dependencies
 */
var StringUtils = require('dw/util/StringUtils');

/**
 * Include Modules
 */
var Util = require('~/cartridge/scripts/helpers/Util');

/**
 * Get Request Object by Number
 *
 * @param {string} paymentData - Payment Data in JSON format
 * @param {dw.ws.WebReference2} chaseWebReference - WSDL reference
 * @param {dw.svc.ServiceCredential} credentials - Service creds
 * @param {dw.svc.ServiceCredential} order - order
 * @returns {Object} - return request object
 */
exports.getRequest = function (paymentData, chaseWebReference, credentials, order) {
    var chaseHelpers = require('*/cartridge/scripts/helpers/chaseHelpers');
    var request = new chaseWebReference.NewOrderRequestElement(); // eslint-disable-line new-cap

    // Set credentials
    request.orbitalConnectionUsername = credentials.user;
    request.orbitalConnectionPassword = credentials.password;

    // Set Configuration
    request.version = Util.VALUE.SOAP_VERSION;
    request.industryType = paymentData.cardType === 'Master' ? Util.VALUE.INDUSTRY_TYPE.EC : Util.VALUE.INDUSTRY_TYPE.RC;
    request.transType = 'A';
    request.bin = Util.VALUE.SOAP_BIN;
    request.merchantID = Util.VALUE.MERCHANT_ID;
    request.terminalID = Util.VALUE.TERMINAL_ID;

    // Set Credit Card
    // Check if we have a saved card or new card
    if ('customerRefNum' in paymentData && paymentData.customerRefNum !== null) {
        request.useCustomerRefNum = paymentData.customerRefNum;
        // request.addProfileFromOrder = 'S';
    } else {
        request.ccAccountNum = paymentData.cardNumber;
        request.ccExp = paymentData.cardExpiration;
        request.addProfileFromOrder = 'A';
        // This is only for Visa and Discovery
        if (paymentData.cardType === 'Visa' || paymentData.cardType === 'Discover') {
            request.ccCardVerifyPresenceInd = '1';
        }
    }

    request.ccCardVerifyNum = paymentData.cvv;

    // Set Address
    request.avsName = Util.cleanTruncate(paymentData.fullName, Util.VALUE.LENGTH.AVS_NAME);
    request.avsAddress1 = Util.cleanTruncate(paymentData.address1, Util.VALUE.LENGTH.AVS_ADDRESS_1);
    if ('address2' in paymentData && paymentData.address2 !== null) {
        request.avsAddress2 = Util.cleanTruncate(paymentData.address2, Util.VALUE.LENGTH.AVS_ADDRESS_2);
    }
    request.avsCity = Util.cleanTruncate(paymentData.city, Util.VALUE.LENGTH.AVS_CITY);
    request.avsState = paymentData.state;
    request.avsZip = paymentData.zip;
    request.avsCountryCode = paymentData.countryCode;
    request.avsPhone = paymentData.phone;

    // Set Order Amount
    request.amount = paymentData.amount;

    // Set Order ID
    request.orderID = paymentData.orderId;
    request.profileOrderOverideInd = 'NO';

    // Set Customer Email
    request.customerEmail = paymentData.customerEmail;

    // Safetech
    if (Util.VALUE.SAFETECH_ENABLED) {
        // Add fraud analysis type
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

        // Add shipping address
        request.avsDestName = Util.cleanTruncate(paymentData.destFullName, Util.VALUE.LENGTH.AVS_DEST_NAME);
        request.avsDestAddress1 = Util.cleanTruncate(paymentData.destAddress1, Util.VALUE.LENGTH.AVS_DEST_ADDRESS_1);
        if ('destAddress2' in paymentData && paymentData.destAddress2 !== null) {
            request.avsDestAddress2 = Util.cleanTruncate(paymentData.destAddress2, Util.VALUE.LENGTH.AVS_DEST_ADDRESS_2);
        }
        request.avsDestCity = Util.cleanTruncate(paymentData.destCity, Util.VALUE.LENGTH.AVS_DEST_CITY);
        request.avsDestState = paymentData.destState;
        request.avsDestZip = paymentData.destZip;
        request.avsDestCountryCode = paymentData.destCountryCode;
        request.avsDestPhoneNum = paymentData.destPhone;
    }

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
        cardType: paymentInstrument.creditCardType,
        customerRefNum: paymentInstrument.creditCardToken ? paymentInstrument.creditCardToken : null,
        cardNumber: !paymentInstrument.creditCardToken ? session.forms.billing.creditCardFields.cardNumber.value : null, // Using value from Form is important
        cardExpiration: paymentInstrument.creditCardExpirationYear + StringUtils.formatNumber(paymentInstrument.creditCardExpirationMonth, '00'),
        cvv: session.forms.billing.creditCardFields.securityCode.value,
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
