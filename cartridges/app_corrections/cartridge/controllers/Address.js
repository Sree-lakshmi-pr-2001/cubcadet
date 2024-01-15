'use strict';

/**
 * Address base controller SaveAddress route overridden to properly display error message in the event of an attempt to save/add duplicate address to AddressBook
 *
 */

var page = module.superModule;
var server = require('server');

server.extend(page);

var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var ecommerce = require('*/cartridge/scripts/middleware/ecommerce');

server.replace('SaveAddress', csrfProtection.validateAjaxRequest, ecommerce.checkEcommerceEnabled, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var formErrors = require('*/cartridge/scripts/formErrors');

    var addressForm = server.forms.getForm('address');
    var addressFormObj = addressForm.toObject();
    addressFormObj.addressForm = addressForm;
    var customer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo
    );
    var addressBook = customer.getProfile().getAddressBook();
    if (addressForm.valid) {
        res.setViewData(addressFormObj);
        this.on('route:BeforeComplete', function () { // eslint-disable-line no-shadow
            var formInfo = res.getViewData();
            Transaction.wrap(function () {
                var address = req.querystring.addressId
                    ? addressBook.getAddress(req.querystring.addressId)
                    : addressBook.createAddress(formInfo.addressId);
                if (address
                        && ((req.querystring.addressId === '') // new address
                                || (req.querystring.addressId === formInfo.addressId)
                                || (addressBook.getAddress(formInfo.addressId) === null))) { // edit address
                    if (req.querystring.addressId) {
                        address.setID(formInfo.addressId);
                    }

                    address.setAddress1(formInfo.address1 || '');
                    address.setAddress2(formInfo.address2 || '');
                    address.setCity(formInfo.city || '');
                    address.setFirstName(formInfo.firstName || '');
                    address.setLastName(formInfo.lastName || '');
                    address.setPhone(formInfo.phone || '');
                    address.setPostalCode(formInfo.postalCode || '');

                    if (formInfo.states && formInfo.states.stateCode) {
                        address.setStateCode(formInfo.states.stateCode);
                    }

                    if (formInfo.country) {
                        address.setCountryCode(formInfo.country);
                    }

                    address.setJobTitle(formInfo.jobTitle || '');
                    address.setPostBox(formInfo.postBox || '');
                    address.setSalutation(formInfo.salutation || '');
                    address.setSecondName(formInfo.secondName || '');
                    address.setCompanyName(formInfo.companyName || '');
                    address.setSuffix(formInfo.suffix || '');
                    address.setSuite(formInfo.suite || '');
                    address.setJobTitle(formInfo.title || '');

                    res.json({
                        success: true,
                        redirectUrl: URLUtils.url('Address-List').toString()
                    });
                } else {
                    formInfo.addressForm.valid = false;
                    formInfo.addressForm.addressId.valid = false;
                    formInfo.addressForm.addressId.error =
                        Resource.msg('error.message.idalreadyexists', 'forms', null);
                    res.json({
                        success: false,
                        fields: formErrors.getFormErrors(addressForm)
                    });
                }
            });
        });
    } else {
        res.json({
            success: false,
            fields: formErrors.getFormErrors(addressForm)
        });
    }
    return next();
});

module.exports = server.exports();
