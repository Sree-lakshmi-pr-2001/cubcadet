/* global session */
'use strict';

/**
 * API dependencies
 */

/**
 * Include Modules
 */
var Util = require('~/cartridge/scripts/helpers/Util');

/**
 * Get Request
 *
 * @param {dw.ws.WebReference2} webReference - WSDL reference
 * @param {dw.svc.ServiceCredential} credentials - Service creds
 * @param {Object} data - data object
 * @returns {Object} - return request object
 */
exports.getRequest = function (webReference, credentials, data) {
    // Set credentials
    var validation = webReference.Validation(); // eslint-disable-line new-cap
    validation.userID = credentials.user;
    validation.password = credentials.password;

    // Set sale request
    var saleRequest = webReference.Sale(); // eslint-disable-line new-cap
    saleRequest.setAccountNumber(data.accountNumber);
    saleRequest.setStoreNumber(Util.VALUE.STORE_NUMBER);
    saleRequest.setStatus('E');
    saleRequest.setAmountSubTotal(data.subTotal);
    saleRequest.setAmountSalesTax(data.tax);
    saleRequest.setAmountTotalPrice(data.total);
    saleRequest.setAmountFinanced(data.total);
    saleRequest.setFinanceProgram(Number(Util.VALUE.FINANCE_PROGRAM));
    saleRequest.setCreditPlan(Number(data.creditPlan));
    /**
     * This is not actually used as intended.
     * MTD requires only that one <Line/> node be present
     * and that subnodes for Quantity and Amount both have values of "1".
     */
    var saleLine = webReference.SaleLine(); // eslint-disable-line new-cap
    saleLine.setAmount(1);
    saleLine.setQuantity(1);
    saleRequest.lines.add(saleLine);

    saleRequest.setAuthYN(webReference.YN.Y);
    saleRequest.setReceiptTextYN(webReference.YNP.N);
    saleRequest.setExternalID(data.orderNumber);

    saleRequest.setNameAddressMatchYN(webReference.YN.Y);

    var nameAddressRequest = webReference.NameAddressRequest(); // eslint-disable-line new-cap
    nameAddressRequest.setNameLine1(data.nameAddress.nameLine1);
    nameAddressRequest.setAddressLine1(data.nameAddress.addressLine1);
    nameAddressRequest.setCity(data.nameAddress.city);
    nameAddressRequest.setState(data.nameAddress.state);
    nameAddressRequest.setPostalCode(data.nameAddress.postalCode);
    saleRequest.setNameAddress(nameAddressRequest);

    var requests = webReference.ArrayOfSale(); // eslint-disable-line new-cap
    requests.saleArray.add(saleRequest);

    return {
        validation: validation,
        requests: requests
    };
};

/**
 * Prepare Data
 * @param {string} accountNumber - account number
 * @param {dw.order.Order} order - order object
 * @param {string} creditPlan - credit plan
 * @returns {Object} - data object
 */
exports.prepareData = function (accountNumber, order, creditPlan) {
    return {
        accountNumber: accountNumber,
        subTotal: order.totalNetPrice.value,
        tax: order.totalTax.value,
        total: order.totalGrossPrice.value,
        orderNumber: order.orderNo,
        creditPlan: creditPlan,
        nameAddress: {
            nameLine1: order.billingAddress.fullName.slice(0, 30),
            addressLine1: order.billingAddress.address1.slice(0, 30),
            city: order.billingAddress.city.slice(0, 22),
            state: order.billingAddress.stateCode.slice(0, 3),
            postalCode: order.billingAddress.postalCode.slice(0, 9)
        }
    };
};
