'use strict';
/* global session, empty*/

var server = require('server');
var page = module.superModule;
server.extend(page);
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Logger = require('dw/system/Logger');

/**
 * Replace Submit Payment controllers
 */
server.replace(
    'SubmitPayment',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var PaymentInstrument = require('dw/order/PaymentInstrument');
        var paymentForm = server.forms.getForm('billing');
        var shippingForm = server.forms.getForm('shipping');
        var billingFormErrors = {};
        var emailFormErrors = {};
        var creditCardErrors = {};
        var viewData = {};

        var deliveryType = COHelpers.getDeliveryType();

        // verify billing form data
        billingFormErrors = COHelpers.validateBillingForm(paymentForm.addressFields);

        if (deliveryType === COHelpers.DELIVERY.DEALER_PICK_UP) {
            emailFormErrors = COHelpers.validateFields(shippingForm.shippingAddress.orderContactFields);
        }

        if (!req.form.storedPaymentUUID && paymentForm.paymentMethod.value === PaymentInstrument.METHOD_CREDIT_CARD) {
            // verify credit card form data
            creditCardErrors = COHelpers.validateCreditCard(paymentForm);
        }


        if (Object.keys(creditCardErrors).length || Object.keys(billingFormErrors).length || Object.keys(emailFormErrors).length) {
            // respond with form data and errors
            res.json({
                form: paymentForm,
                fieldErrors: [billingFormErrors, creditCardErrors, emailFormErrors],
                serverErrors: [],
                error: true
            });
        } else {
            viewData.address = {
                firstName: { value: paymentForm.addressFields.firstName.value },
                lastName: { value: paymentForm.addressFields.lastName.value },
                address1: { value: paymentForm.addressFields.address1.value },
                address2: { value: paymentForm.addressFields.address2.value },
                city: { value: paymentForm.addressFields.city.value },
                postalCode: { value: paymentForm.addressFields.postalCode.value },
                countryCode: { value: paymentForm.addressFields.country.value }
            };

            if (Object.prototype.hasOwnProperty
                .call(paymentForm.addressFields, 'states')) {
                viewData.address.stateCode =
                    { value: paymentForm.addressFields.states.stateCode.value };
            }

            viewData.paymentMethod = {
                value: paymentForm.paymentMethod.value,
                htmlName: paymentForm.paymentMethod.value
            };

            viewData.paymentInformation = {
                cardType: {
                    value: paymentForm.creditCardFields.cardType.value,
                    htmlName: paymentForm.creditCardFields.cardType.htmlName
                },
                cardNumber: {
                    value: paymentForm.creditCardFields.cardNumber.value,
                    htmlName: paymentForm.creditCardFields.cardNumber.htmlName
                },
                securityCode: {
                    value: paymentForm.creditCardFields.securityCode.value,
                    htmlName: paymentForm.creditCardFields.securityCode.htmlName
                },
                expirationMonth: {
                    value: parseInt(
                        paymentForm.creditCardFields.expirationMonth.selectedOption,
                        10
                    ),
                    htmlName: paymentForm.creditCardFields.expirationMonth.htmlName
                },
                expirationYear: {
                    value: parseInt(paymentForm.creditCardFields.expirationYear.value, 10),
                    htmlName: paymentForm.creditCardFields.expirationYear.htmlName
                },
                accountNumber: {
                    value: paymentForm.financeCardFields.accountNumber.value,
                    htmlName: paymentForm.financeCardFields.accountNumber.htmlName
                },
                planId: {
                    value: paymentForm.financeCardFields.planId.value,
                    htmlName: paymentForm.financeCardFields.planId.htmlName
                }
            };

            if (req.form.storedPaymentUUID) {
                viewData.storedPaymentUUID = req.form.storedPaymentUUID;
            }

            viewData.email = {
                value: paymentForm.creditCardFields.email.value
            };

            viewData.phone = { value: paymentForm.creditCardFields.phone.value };

            viewData.saveCard = paymentForm.creditCardFields.saveCard.checked;

            res.setViewData(viewData);

            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var BasketMgr = require('dw/order/BasketMgr');
                var HookMgr = require('dw/system/HookMgr');
                var Resource = require('dw/web/Resource');
                var PaymentMgr = require('dw/order/PaymentMgr');
                var Transaction = require('dw/system/Transaction');
                var AccountModel = require('*/cartridge/models/account');
                var OrderModel = require('*/cartridge/models/order');
                var URLUtils = require('dw/web/URLUtils');
                var array = require('*/cartridge/scripts/util/array');
                var Locale = require('dw/util/Locale');
                var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
                var currentBasket = BasketMgr.getCurrentBasket();
                var billingData = res.getViewData();

                if (!currentBasket) {
                    delete billingData.paymentInformation;

                    res.json({
                        error: true,
                        cartError: true,
                        fieldErrors: [],
                        serverErrors: [],
                        redirectUrl: URLUtils.url('Cart-Show').toString()
                    });
                    return;
                }
                
                var billingAddress = currentBasket.billingAddress;
                var billingForm = server.forms.getForm('billing');
                var paymentMethodID = billingData.paymentMethod.value;
                var result;

                billingForm.creditCardFields.cardNumber.htmlValue = '';
                billingForm.creditCardFields.securityCode.htmlValue = '';

                Transaction.wrap(function () {
                    if (!billingAddress) {
                        billingAddress = currentBasket.createBillingAddress();
                    }

                    billingAddress.setFirstName(billingData.address.firstName.value);
                    billingAddress.setLastName(billingData.address.lastName.value);
                    billingAddress.setAddress1(billingData.address.address1.value);
                    billingAddress.setAddress2(billingData.address.address2.value);
                    billingAddress.setCity(billingData.address.city.value);
                    billingAddress.setPostalCode(billingData.address.postalCode.value);
                    if (Object.prototype.hasOwnProperty.call(billingData.address, 'stateCode')) {
                        billingAddress.setStateCode(billingData.address.stateCode.value);
                    }
                    billingAddress.setCountryCode(billingData.address.countryCode.value);

                    billingAddress.setPhone(billingData.phone.value);
                    if (billingData.storedPaymentUUID && !billingData.email.value) {
                        currentBasket.setCustomerEmail(req.currentCustomer.profile.email);
                    } else {
                        currentBasket.setCustomerEmail(billingData.email.value);
                    }
                });

                // set Email from billing page for pickup delivery only
                var orderEmail = null;
                if (deliveryType === COHelpers.DELIVERY.DEALER_PICK_UP) {
                    var currentShippingForm = server.forms.getForm('shipping');
                    orderEmail = !empty(currentShippingForm.shippingAddress.orderContactFields.email.value) ? currentShippingForm.shippingAddress.orderContactFields.email.value : null;
                    var emailSignup = currentShippingForm.shippingAddress.orderContactFields.emailSignup.checked;
                    Transaction.wrap(function () {
                        currentBasket.setCustomerEmail(orderEmail);
                        currentBasket.custom.emailSignup = emailSignup;
                    });
                }

                // if there is no selected payment option and balance is greater than zero
                if (!paymentMethodID && currentBasket.totalGrossPrice.value > 0) {
                    var noPaymentMethod = {};

                    noPaymentMethod[billingData.paymentMethod.htmlName] =
                        Resource.msg('error.no.selected.payment.method', 'creditCard', null);

                    delete billingData.paymentInformation;

                    res.json({
                        form: billingForm,
                        fieldErrors: [noPaymentMethod],
                        serverErrors: [],
                        error: true
                    });
                    return;
                }

                // check to make sure there is a payment processor
                if (!PaymentMgr.getPaymentMethod(paymentMethodID).paymentProcessor) {
                    throw new Error(Resource.msg(
                        'error.payment.processor.missing',
                        'checkout',
                        null
                    ));
                }

                var processor = PaymentMgr.getPaymentMethod(paymentMethodID).getPaymentProcessor();

                if (billingData.storedPaymentUUID
                    && req.currentCustomer.raw.authenticated
                    && req.currentCustomer.raw.registered
                ) {
                    var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
                    var paymentInstrument = array.find(paymentInstruments, function (item) {
                        return billingData.storedPaymentUUID === item.UUID;
                    });

                    billingData.paymentInformation.cardNumber.value = paymentInstrument
                        .creditCardNumber;
                    billingData.paymentInformation.cardType.value = paymentInstrument
                        .creditCardType;
                    billingData.paymentInformation.securityCode.value = req.form.securityCode;
                    billingData.paymentInformation.expirationMonth.value = paymentInstrument
                        .creditCardExpirationMonth;
                    billingData.paymentInformation.expirationYear.value = paymentInstrument
                        .creditCardExpirationYear;
                    billingData.paymentInformation.creditCardToken = paymentInstrument
                        .raw.custom.chaseCustomerReferenceNumber;
                }

                if (HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
                    result = HookMgr.callHook('app.payment.processor.' + processor.ID.toLowerCase(),
                        'Handle',
                        currentBasket,
                        billingData.paymentInformation
                    );
                } else {
                    result = HookMgr.callHook('app.payment.processor.default', 'Handle');
                }

                // need to invalidate credit card fields
                if (result.error) {
                    delete billingData.paymentInformation;

                    res.json({
                        form: billingForm,
                        fieldErrors: result.fieldErrors,
                        serverErrors: result.serverErrors,
                        error: true
                    });
                    return;
                }

                // Calculate the basket
                Transaction.wrap(function () {
                    basketCalculationHelpers.calculateTotals(currentBasket);
                });

                // Re-calculate the payments.
                var calculatedPaymentTransaction = COHelpers.calculatePaymentTransaction(
                    currentBasket
                );

                if (calculatedPaymentTransaction.error) {
                    res.json({
                        form: paymentForm,
                        fieldErrors: [],
                        serverErrors: [Resource.msg('error.technical', 'checkout', null)],
                        error: true
                    });
                    return;
                }

                var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
                if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
                    req.session.privacyCache.set('usingMultiShipping', false);
                    usingMultiShipping = false;
                }

                var currentLocale = Locale.getLocale(req.locale.id);

                var basketModel = new OrderModel(
                    currentBasket,
                    { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
                );

                // update orderEmail for pickup delivery
                if (deliveryType === COHelpers.DELIVERY.DEALER_PICK_UP && basketModel && orderEmail) {
                    basketModel.orderEmail = orderEmail;
                }

                var accountModel = new AccountModel(req.currentCustomer);
                var renderedStoredPaymentInstrument = COHelpers.getRenderedPaymentInstruments(
                    req,
                    accountModel
                );

                delete billingData.paymentInformation;

                res.json({
                    renderedPaymentInstruments: renderedStoredPaymentInstrument,
                    customer: accountModel,
                    order: basketModel,
                    form: billingForm,
                    error: false
                });
            });
        }
        return next();
    }
);

/**
 * Prepend functionality for submitting payment form
 */
server.prepend('SubmitPayment', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');

    var paymentForm = session.forms.billing;
    if (!paymentForm.creditCardFields.email.value) {
        var currentBasket = BasketMgr.getCurrentBasket();
        paymentForm.creditCardFields.email.value = currentBasket.customerEmail;
    }

    next();
});
/**
 *  Replace Placer order controller
 */
server.replace('PlaceOrder', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var HookMgr = require('dw/system/HookMgr');
    var OrderMgr = require('dw/order/OrderMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var ContentMgr = require('dw/content/ContentMgr');
    var Site = require('dw/system/Site');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var prop65Helper = require('*/cartridge/scripts/helpers/prop65Helpers');

    var isAftermarketInBasket = false;
    var ewEnabled = Site.current.getCustomPreferenceValue('enableEWNewSales');
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

    if (req.session.privacyCache.get('fraudDetectionStatus')) {
        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', '01').toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        return next();
    }

    if (ewEnabled) {
        var warrantyHelpers = require('*/cartridge/scripts/helpers/warrantyHelpers');
        var isAftermarketInBasket = warrantyHelpers.checkForAfterMarketInBasket(currentBasket);
    }

    if(isAftermarketInBasket) {
        var purchasedFrom = warrantyHelpers.combinePurchasedFrom(req.form);
        Transaction.wrap(function () {
            for (let p = 0; p < currentBasket.allProductLineItems.length; p++) {
                if (currentBasket.allProductLineItems[p].productID in purchasedFrom) {
                    currentBasket.allProductLineItems[p].custom['ew-aftermarket-purchased-from'] = purchasedFrom[currentBasket.allProductLineItems[p].productID];
                }
            }
        });
    }

    // Prop65 validation of acknowledge
    if (prop65Helper.enabledProp65() && prop65Helper.verifyCart(currentBasket) && !currentBasket.custom.prop65Acknowledged) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.prop65', 'checkout', null)
        });

        return next();
    }

    var validationOrderStatus = HookMgr.callHook(
        'app.validate.order',
        'validateOrder',
        currentBasket
    );
    if (validationOrderStatus.error) {
        res.json({
            error: true,
            errorMessage: validationOrderStatus.message
        });
        return next();
    }

    // Check to make sure there is a shipping address
    if (currentBasket.defaultShipment.shippingAddress === null) {
        res.json({
            error: true,
            errorStage: {
                stage: 'shipping',
                step: 'address'
            },
            errorMessage: Resource.msg('error.no.shipping.address', 'checkout', null)
        });
        return next();
    }

    // Check to make sure billing address exists
    if (!currentBasket.billingAddress) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'billingAddress'
            },
            errorMessage: Resource.msg('error.no.billing.address', 'checkout', null)
        });
        return next();
    }

    // Calculate the basket
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    // Verify tax amount
    if (!currentBasket.totalTax.available) {
        var errorTaxUnavailableAsset = ContentMgr.getContent('error-tax-unavailable');
        var errorTaxUnavailableMessage = (errorTaxUnavailableAsset) ? errorTaxUnavailableAsset.custom.body.markup : '';
        res.json({
            error: true,
            errorMessage: errorTaxUnavailableMessage
        });
        return next();
    }

    // Re-validates existing payment instruments
    var validPayment = COHelpers.validatePayment(req, currentBasket);
    if (validPayment.error) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'paymentInstrument'
            },
            errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
        });
        return next();
    }

    // Re-calculate the payments.
    var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);
    if (calculatedPaymentTransactionTotal.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    // Creates a new order.
    var order = COHelpers.createOrder(currentBasket);
    if (!order) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }
    
    if(currentBasket.paymentInstrument.paymentMethod == 'TD_FINANCE'){
        Transaction.wrap(function(){
            order.custom.TDFinanceOrderTotal = session.custom.tdFinanceAmount ?  (Number(session.custom.tdFinanceAmount).toFixed(2)) : '';
        });
    }

    // Handles payment authorization
    var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo);
    if (handlePaymentResult.error) {
        var paymentErrorMsg = Resource.msg('payment.error.processing', 'payment', null);

        // Set error message from Safetech or from something else
        if (handlePaymentResult.errorMessage) {
            paymentErrorMsg = handlePaymentResult.errorMessage;
            Logger.error('paymentErrorMsg: '+ paymentErrorMsg);
        }

        res.json({
            error: true,
            errorMessage: paymentErrorMsg
        });
        return next();
    }

    // Save credit card data
    var paymentForm = server.forms.getForm('billing');

    if (!req.form.storedPaymentUUID
            && req.currentCustomer.raw.authenticated
            && req.currentCustomer.raw.registered
            && paymentForm.creditCardFields.saveCard.checked
            && (paymentForm.paymentMethod.value === 'CREDIT_CARD')
        ) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );

        COHelpers.savePaymentInstrumentToWallet(
            order,
            customer
        );
    }

    // Email sign up
    var form = server.forms.getForm('shipping');
    var orderEmail = order.customerEmail;
    if (form.shippingAddress.orderContactFields.emailSignup.checked) {
        var hookID = 'app.mailingList.subscribe';
        if (HookMgr.hasHook(hookID)) {
            HookMgr.callHook(
                hookID,
                'subscribe',
                {
                    email: orderEmail
                }
            );
        }
    }

    var fraudDetectionStatus = HookMgr.callHook('app.fraud.detection', 'fraudDetection', currentBasket);
    if (fraudDetectionStatus.status === 'fail') {
        Logger.error('#'+ order.orderNo+' order was falied because fraudDetectionStatus is ' +fraudDetectionStatus.status);
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
        // Void all payments
        COHelpers.voidPayments(order);
        // fraud detection failed
        req.session.privacyCache.set('fraudDetectionStatus', true);

        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', fraudDetectionStatus.errorCode).toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        return next();
    }

    // Copy tdAccountNumber into session and remove it from payment instrument to exclude
    // tdAccountNumber from the order and bm
    COHelpers.saveTDAccountNumber(order);

    // Places the order
    var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
    if (placeOrderResult.error) {
        // Void all payments
        COHelpers.voidPayments(order);

        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }
    // Check if we need to suppress confirmation emails for dealers order
    var suppressDealerEmail = Site.current.getCustomPreferenceValue('mtdSuppressDealerConfirmationEmail');
    var dealerPickupMethodId = Site.current.getCustomPreferenceValue('mtdDealerPickupMethodId');
    var dealerDeliveryMethodId = Site.current.getCustomPreferenceValue('mtdDealerDeliveryMethodId');
    var defaultShipment = order.defaultShipment;
    var isDealerOrder = defaultShipment.shippingMethodID === dealerPickupMethodId || defaultShipment.shippingMethodID === dealerDeliveryMethodId;

    if (!suppressDealerEmail || (suppressDealerEmail && !isDealerOrder)) {
        if (('fraudManualReviewStatus' in order.custom)) {
            Logger.debug('org_cubcadet - skipping order confirmation email for fraudManualReviewStatus');
        } else {
            var sendEmailFromSFCC = Site.current.getCustomPreferenceValue('sendEmailsFromSFCC');
            if(sendEmailFromSFCC){
                var isMailSent = COHelpers.sendOrderConfirmationEmailFromSFCC(order);
                if(isMailSent.error == false && isMailSent.code == 'OK'){
                    Transaction.wrap(function() {
                        order.custom.orderConfirmationEmailSent = 'Y';
                    });
                }
            }else {
                COHelpers.sendConfirmationEmail(order, req.locale.id);
            }
        }
    }

    // Reset usingMultiShip after successful Order placement
    req.session.privacyCache.set('usingMultiShipping', false);

    // TODO: Exposing a direct route to an Order, without at least encoding the orderID
    //  is a serious PII violation.  It enables looking up every customers orders, one at a
    //  time.
    res.json({
        error: false,
        orderID: order.orderNo,
        orderToken: order.orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString()
    });

    return next();
});

module.exports = server.exports();
