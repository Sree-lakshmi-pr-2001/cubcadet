'use strict';

var page = module.superModule;
var server = require('server');

var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var Locale = require('dw/util/Locale');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var ViewHelper = require('*/cartridge/scripts/utils/ViewHelper');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.extend(page);

/**
 * Creates a list of address model for the logged in user
 * @param {string} customerNo - customer number of the current customer
 * @returns {List} a plain list of objects of the current customer's addresses
 */
function getList(customerNo) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var AddressModel = require('*/cartridge/models/address');
    var collections = require('*/cartridge/scripts/util/collections');

    var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
    var rawAddressBook = customer.addressBook.getAddresses();
    var addressBook = collections.map(rawAddressBook, function (rawAddress) {
        var addressModel = new AddressModel(rawAddress);
        addressModel.address.UUID = rawAddress.UUID;
        addressModel.address.formattedPhone = ViewHelper.formatPhoneNumber(addressModel.address.phone, Locale.getLocale(Site.current.defaultLocale).country);
        return addressModel;
    });
    return addressBook;
}

server.replace('List', userLoggedIn.validateLoggedIn, consentTracking.consent, function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var ContentModel = require('*/cartridge/models/content');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    var apiContent = ContentMgr.getContent('address-metadata');
    if (apiContent) {
        var content = new ContentModel(apiContent, 'content/contentAsset');

        pageMetaHelper.setPageMetaData(req.pageMetaData, content);
        pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
    }

    var actionUrls = {
        deleteActionUrl: URLUtils.url('Address-DeleteAddress').toString(),
        listActionUrl: URLUtils.url('Address-List').toString()
    };
    res.render('account/addressBook', {
        addressBook: getList(req.currentCustomer.profile.customerNo),
        actionUrls: actionUrls,
        breadcrumbs: [
            {
                htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                url: URLUtils.url('Account-Show').toString()
            }
        ]
    });
    next();
}, pageMetaData.computedPageMetaData);

server.append(
    'AddAddress',
    function (req, res, next) {
        res.render('account/editAddAddress', {
            breadcrumbs: [
                {
                    htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                    url: URLUtils.url('Account-Show').toString()
                }
            ]
        });
        next();
    }
);

server.append(
    'EditAddress',
    function (req, res, next) {
        res.render('account/editAddAddress', {
            breadcrumbs: [
                {
                    htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                    url: URLUtils.url('Account-Show').toString()
                }
            ]
        });
        next();
    }
);

module.exports = server.exports();
