'use strict';

var page = module.superModule;
var server = require('server');

var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.extend(page);

server.replace('List', userLoggedIn.validateLoggedIn, consentTracking.consent, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');
    var ContentMgr = require('dw/content/ContentMgr');
    var ContentModel = require('*/cartridge/models/content');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    var apiContent = ContentMgr.getContent('payment-list-metadata');
    if (apiContent) {
        var content = new ContentModel(apiContent, 'content/contentAsset');

        pageMetaHelper.setPageMetaData(req.pageMetaData, content);
        pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
    }

    var AccountModel = require('*/cartridge/models/account');
    var ViewHelper = require('*/cartridge/scripts/utils/ViewHelper');

    var paymentInstruments = AccountModel.getCustomerPaymentInstruments(req.currentCustomer.wallet.paymentInstruments);

    paymentInstruments.forEach(function (element) {
        // eslint-disable-next-line no-param-reassign
        element.formattedMaskedCCNumber = ViewHelper.formatMaskedCCNumber(element.maskedCreditCardNumber);
    });

    res.render('account/payment/payment', {
        paymentInstruments: paymentInstruments,
        actionUrl: URLUtils.url('PaymentInstruments-DeletePayment').toString(),
        breadcrumbs: [
            {
                htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                url: URLUtils.url('Account-Show').toString()
            }
        ]
    });
    next();
}, pageMetaData.computedPageMetaData);

module.exports = server.exports();
