'use strict';

/**
 * Removed public controllers for using Multiship
 *
 */

var page = module.superModule;
var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.extend(page);

server.replace(
        'SubmitShipping',
        server.middleware.https,
        csrfProtection.validateAjaxRequest,
        function (req, res, next) {
            var BasketMgr = require('dw/order/BasketMgr');
            var URLUtils = require('dw/web/URLUtils');
            var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
            var ContentMgr = require('dw/content/ContentMgr');

            var currentBasket = BasketMgr.getCurrentBasket();

            if (!currentBasket) {
                res.json({
                    error: true,
                    cartError: true,
                    fieldErrors: [],
                    serverErrors: [],
                    redirectUrl: URLUtils.url('Cart-Show').toString()
                });
                return next();
            }

            var aftermarketOnly = false;
            var ewItems = 0;

            for (var i = 0, l = currentBasket.productLineItems.size(); i < l; i++) {
                var productLineItem = currentBasket.productLineItems[i];
                if (productLineItem.product && productLineItem.product.custom['product-type'] && productLineItem.product.custom['product-type'] == 'ExtendedWarranty') {                    
                    ewItems ++;
                }
            }

            if (ewItems == currentBasket.productLineItems.size()) {
                aftermarketOnly = true;
            }

            var form = server.forms.getForm('shipping');
            var result = {};

            // verify shipping form data
            var shippingFormErrors = COHelpers.validateShippingForm(form.shippingAddress.addressFields);
            var emailFormErrors = COHelpers.validateFields(form.shippingAddress.orderContactFields);
            var deliveryZipcodeErrors = COHelpers.validateShippingDeliveryZipcode(form.shippingAddress.addressFields);

            if (Object.keys(shippingFormErrors).length > 0 || Object.keys(emailFormErrors).length > 0 || Object.keys(deliveryZipcodeErrors).length) {
                req.session.privacyCache.set(currentBasket.defaultShipment.UUID, 'invalid');

                var fieldErrors = [];
                var shippingAirMessage = '';
                if (Object.keys(shippingFormErrors).length > 0) {
                    fieldErrors.push(shippingFormErrors);
                }
                if (Object.keys(emailFormErrors).length > 0) {
                    fieldErrors.push(emailFormErrors);
                }
                if (Object.keys(deliveryZipcodeErrors).length > 0) {
                    fieldErrors.push(deliveryZipcodeErrors);

                    var airErrorZipcodeAsset = ContentMgr.getContent('zipcode-range-error-air-message');
                    shippingAirMessage = (airErrorZipcodeAsset) ? airErrorZipcodeAsset.custom.body.markup : '';
                }

                res.json({
                    form: form,
                    fieldErrors: fieldErrors,
                    serverErrors: [],
                    deliveryZipcodeError: Object.keys(deliveryZipcodeErrors).length > 0,
                    shippingAirMessage: shippingAirMessage,
                    error: true
                });
            } else {
                req.session.privacyCache.set(currentBasket.defaultShipment.UUID, 'valid');

                result.address = {
                    firstName: form.shippingAddress.addressFields.firstName.value,
                    lastName: form.shippingAddress.addressFields.lastName.value,
                    address1: form.shippingAddress.addressFields.address1.value,
                    address2: form.shippingAddress.addressFields.address2.value,
                    city: form.shippingAddress.addressFields.city.value,
                    postalCode: form.shippingAddress.addressFields.postalCode.value,
                    countryCode: form.shippingAddress.addressFields.country.value,
                    phone: form.shippingAddress.addressFields.phone.value
                };
                if (Object.prototype.hasOwnProperty
                    .call(form.shippingAddress.addressFields, 'states')) {
                    result.address.stateCode =
                        form.shippingAddress.addressFields.states.stateCode.value;
                }

                result.shippingBillingSame =
                    form.shippingAddress.shippingAddressUseAsBillingAddress.value;

                result.shippingMethod = form.shippingAddress.shippingMethodID.value
                    ? form.shippingAddress.shippingMethodID.value.toString()
                    : null;

                result.isGift = form.shippingAddress.isGift.checked;

                result.giftMessage = result.isGift ? form.shippingAddress.giftMessage.value : null;

                res.setViewData(result);

                this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                    var AccountModel = require('*/cartridge/models/account');
                    var OrderModel = require('*/cartridge/models/order');
                    var Locale = require('dw/util/Locale');
                    var Transaction = require('dw/system/Transaction');
                    var MTDUtil = require('int_mtdservices/cartridge/scripts/helpers/Util');

                    var shippingData = res.getViewData();

                    COHelpers.copyShippingAddressToShipment(
                        shippingData,
                        currentBasket.defaultShipment
                    );

                    var giftResult = COHelpers.setGift(
                        currentBasket.defaultShipment,
                        shippingData.isGift,
                        shippingData.giftMessage
                    );

                    if (giftResult.error) {
                        res.json({
                            error: giftResult.error,
                            fieldErrors: [],
                            serverErrors: [giftResult.errorMessage]
                        });
                        return;
                    }
                    var currentShippingMethodId = currentBasket.defaultShipment.shippingMethodID;
                    if (!currentBasket.billingAddress) {
                        if (req.currentCustomer.addressBook
                            && req.currentCustomer.addressBook.preferredAddress) {
                            // Copy over preferredAddress (use addressUUID for matching)
                            COHelpers.copyBillingAddressToBasket(
                                req.currentCustomer.addressBook.preferredAddress, currentBasket);
                        } else if (currentShippingMethodId !== MTDUtil.VALUE.DEALER_PICKUP_METHOD) { // Don't copy pickup address to billing
                            // Copy over first shipping address (use shipmentUUID for matching)
                            COHelpers.copyBillingAddressToBasket(
                                currentBasket.defaultShipment.shippingAddress, currentBasket);
                        }
                    }
                    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
                    if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
                        req.session.privacyCache.set('usingMultiShipping', false);
                        usingMultiShipping = false;
                    }


                    if (aftermarketOnly && currentShippingMethodId !== MTDUtil.VALUE.DEALER_PICKUP_METHOD) {
                        // need to copy shipping address over billing for aftermarket only orders
                        COHelpers.copyBillingAddressToBasket(
                            currentBasket.defaultShipment.shippingAddress, currentBasket);
                    }

                    COHelpers.recalculateBasket(currentBasket);

                    var currentLocale = Locale.getLocale(req.locale.id);
                    var basketModel = new OrderModel(
                        currentBasket,
                        {
                            usingMultiShipping: usingMultiShipping,
                            shippable: true,
                            countryCode: currentLocale.country,
                            containerView: 'basket'
                        }
                    );

                    var shipment = currentBasket.defaultShipment;
                    var dealerInfo = {
                        dealerAddress: JSON.parse(shipment.custom.dealerAddress)
                    };
                    var dfType = shipment.custom.DFType;
                    if (dealerInfo.dealerAddress && dfType) {
                        if (basketModel) {
                            basketModel.dealerInfo = dealerInfo;
                        }
                    }

                    // Handle Order Contact Info
                    var orderEmail = form.shippingAddress.orderContactFields.email.value;
                    var emailSignup = form.shippingAddress.orderContactFields.emailSignup.checked;
                    Transaction.wrap(function () {
                        currentBasket.setCustomerEmail(orderEmail);
                        currentBasket.custom.emailSignup = emailSignup;
                    });
                    // Update response with new email
                    if (basketModel) {
                        basketModel.orderEmail = orderEmail;
                    }

                    res.json({
                        customer: new AccountModel(req.currentCustomer),
                        order: basketModel,
                        form: server.forms.getForm('shipping')
                    });
                });
            }

            return next();
        }
    );

module.exports = server.exports();
