'use strict';
/* global request */
var server = require('server');

var collections = require('*/cartridge/scripts/util/collections');

var BasketMgr = require('dw/order/BasketMgr');
var HashMap = require('dw/util/HashMap');
var HookMgr = require('dw/system/HookMgr');

var OrderMgr = require('dw/order/OrderMgr');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentMgr = require('dw/order/PaymentMgr');
var Order = require('dw/order/Order');
var Status = require('dw/system/Status');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var Template = require('dw/util/Template');
var Transaction = require('dw/system/Transaction');
var StringUtils = require('dw/util/StringUtils');
var AddressModel = require('*/cartridge/models/address');
var formErrors = require('*/cartridge/scripts/formErrors');

var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');

var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

// static functions needed for Checkout Controller logic

/**
 * Prepares the Shipping form
 * @returns {Object} processed Shipping form object
 */
function prepareShippingForm() {
    var shippingForm = server.forms.getForm('shipping');

    shippingForm.clear();
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    accountHelpers.restrictStates(shippingForm.shippingAddress.addressFields);
    return shippingForm;
}

/**
 * Prepares the Billing form
 * @returns {Object} processed Billing form object
 */
function prepareBillingForm() {
    var stage = request.httpParameterMap.stage;
    var billingForm = server.forms.getForm('billing');
    if (!stage || stage.value !== 'placeOrder') {
        billingForm.clear();
    }
    return billingForm;
}

/**
 * Validate billing form
 * @param {Object} form - the form object with pre-validated form fields
 * @returns {Object} the names of the invalid form fields
 */
function validateFields(form) {
    return formErrors.getFormErrors(form);
}

/**
 * Validate shipping form fields
 * @param {Object} form - the form object with pre-validated form fields
 * @param {Array} fields - the fields to validate
 * @returns {Object} the names of the invalid form fields
 */
function validateShippingForm(form) {
    return validateFields(form);
}

/**
 * Checks to see if the shipping address is initialized
 * @param {dw.order.Shipment} [shipment] - Script API Shipment object
 * @returns {boolean} returns true if defaulShipment.shippingAddress is not null
 */
function isShippingAddressInitialized(shipment) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var initialized = false;

    if (currentBasket) {
        if (shipment) {
            initialized = !!shipment.shippingAddress;
        } else {
            initialized = !!currentBasket.defaultShipment.shippingAddress;
        }
    }

    return initialized;
}

/**
 * Copies a CustomerAddress to a Shipment as its Shipping Address
 * @param {dw.customer.CustomerAddress} address - The customer address
 * @param {dw.order.Shipment} [shipmentOrNull] - The target shipment
 */
function copyCustomerAddressToShipment(address, shipmentOrNull) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var shipment = shipmentOrNull || currentBasket.defaultShipment;
    var shippingAddress = shipment.shippingAddress;

    Transaction.wrap(function () {
        if (shippingAddress === null) {
            shippingAddress = shipment.createShippingAddress();
        }

        shippingAddress.setFirstName(address.firstName);
        shippingAddress.setLastName(address.lastName);
        shippingAddress.setAddress1(address.address1);
        shippingAddress.setAddress2(address.address2);
        shippingAddress.setCity(address.city);
        shippingAddress.setPostalCode(address.postalCode);
        shippingAddress.setStateCode(address.stateCode);
        var countryCode = address.countryCode;
        shippingAddress.setCountryCode(countryCode.value);
        shippingAddress.setPhone(address.phone);
    });
}

/**
 * Copies a CustomerAddress to a Basket as its Billing Address
 * @param {dw.customer.CustomerAddress} address - The customer address
 */
function copyCustomerAddressToBilling(address) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var billingAddress = currentBasket.billingAddress;

    Transaction.wrap(function () {
        if (!billingAddress) {
            billingAddress = currentBasket.createBillingAddress();
        }

        billingAddress.setFirstName(address.firstName);
        billingAddress.setLastName(address.lastName);
        billingAddress.setAddress1(address.address1);
        billingAddress.setAddress2(address.address2);
        billingAddress.setCity(address.city);
        billingAddress.setPostalCode(address.postalCode);
        billingAddress.setStateCode(address.stateCode);
        var countryCode = address.countryCode;
        billingAddress.setCountryCode(countryCode.value);
        if (!billingAddress.phone) {
            billingAddress.setPhone(address.phone);
        }
    });
}

/**
 * Copies information from the shipping form to the associated shipping address
 * @param {Object} shippingData - the shipping data
 * @param {dw.order.Shipment} [shipmentOrNull] - the target Shipment
 */
function copyShippingAddressToShipment(shippingData, shipmentOrNull) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var shipment = shipmentOrNull || currentBasket.defaultShipment;

    var shippingAddress = shipment.shippingAddress;

    Transaction.wrap(function () {
        if (shippingAddress === null) {
            shippingAddress = shipment.createShippingAddress();
        }

        shippingAddress.setFirstName(shippingData.address.firstName);
        shippingAddress.setLastName(shippingData.address.lastName);
        shippingAddress.setAddress1(shippingData.address.address1);
        shippingAddress.setAddress2(shippingData.address.address2);
        shippingAddress.setCity(shippingData.address.city);
        shippingAddress.setPostalCode(shippingData.address.postalCode);
        shippingAddress.setStateCode(shippingData.address.stateCode);
        shippingAddress.setCountryCode(shippingData.address.countryCode);
        shippingAddress.setPhone(shippingData.address.phone);

        ShippingHelper.selectShippingMethod(shipment, shippingData.shippingMethod);
    });
}

/**
 * Copies a raw address object to the baasket billing address
 * @param {Object} address - an address-similar Object (firstName, ...)
 * @param {Object} currentBasket - the current shopping basket
 */
function copyBillingAddressToBasket(address, currentBasket) {
    var billingAddress = currentBasket.billingAddress;

    Transaction.wrap(function () {
        if (!billingAddress) {
            billingAddress = currentBasket.createBillingAddress();
        }

        billingAddress.setFirstName(address.firstName);
        billingAddress.setLastName(address.lastName);
        billingAddress.setAddress1(address.address1);
        billingAddress.setAddress2(address.address2);
        billingAddress.setCity(address.city);
        billingAddress.setPostalCode(address.postalCode);
        billingAddress.setStateCode(address.stateCode);
        billingAddress.setCountryCode(address.countryCode.value);
        if (!billingAddress.phone) {
            billingAddress.setPhone(address.phone);
        }
    });
}

/**
 * Returns the first non-default shipment with more than one product line item
 * @param {dw.order.Basket} currentBasket - The current Basket
 * @returns {dw.order.Shipment} - the shipment
 */
function getFirstNonDefaultShipmentWithProductLineItems(currentBasket) {
    var shipment;
    var match;

    for (var i = 0, ii = currentBasket.shipments.length; i < ii; i++) {
        shipment = currentBasket.shipments[i];
        if (!shipment.default && shipment.productLineItems.length > 0) {
            match = shipment;
            break;
        }
    }

    return match;
}

/**
 * Loop through all shipments and make sure all not null
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket
 * @returns {boolean} - allValid
 */
function ensureValidShipments(lineItemContainer) {
    var shipments = lineItemContainer.shipments;
    var allValid = collections.every(shipments, function (shipment) {
        if (shipment) {
            var address = shipment.shippingAddress;
            return address && address.address1;
        }
        return false;
    });
    return allValid;
}


/**
 * Ensures that no shipment exists with 0 product line items
 * @param {Object} req - the request object needed to access session.privacyCache
 */
function ensureNoEmptyShipments(req) {
    Transaction.wrap(function () {
        var currentBasket = BasketMgr.getCurrentBasket();

        var iter = currentBasket.shipments.iterator();
        var shipment;
        var shipmentsToDelete = [];

        while (iter.hasNext()) {
            shipment = iter.next();
            if (shipment.productLineItems.length < 1 && shipmentsToDelete.indexOf(shipment) < 0) {
                if (shipment.default) {
                    // Cant delete the defaultShipment
                    // Copy all line items from 2nd to first
                    var altShipment = getFirstNonDefaultShipmentWithProductLineItems(currentBasket);
                    if (!altShipment) return;

                    // Move the valid marker with the shipment
                    var altValid = req.session.privacyCache.get(altShipment.UUID);
                    req.session.privacyCache.set(currentBasket.defaultShipment.UUID, altValid);

                    collections.forEach(altShipment.productLineItems,
                        function (lineItem) {
                            lineItem.setShipment(currentBasket.defaultShipment);
                        });

                    if (altShipment.shippingAddress) {
                        // Copy from other address
                        var addressModel = new AddressModel(altShipment.shippingAddress);
                        copyShippingAddressToShipment(addressModel, currentBasket.defaultShipment);
                    } else {
                        // Or clear it out
                        currentBasket.defaultShipment.createShippingAddress();
                    }

                    if (altShipment.custom && altShipment.custom.fromStoreId && altShipment.custom.shipmentType) {
                        currentBasket.defaultShipment.custom.fromStoreId = altShipment.custom.fromStoreId;
                        currentBasket.defaultShipment.custom.shipmentType = altShipment.custom.shipmentType;
                    }

                    currentBasket.defaultShipment.setShippingMethod(altShipment.shippingMethod);
                    // then delete 2nd one
                    shipmentsToDelete.push(altShipment);
                } else {
                    shipmentsToDelete.push(shipment);
                }
            }
        }

        for (var j = 0, jj = shipmentsToDelete.length; j < jj; j++) {
            currentBasket.removeShipment(shipmentsToDelete[j]);
        }
    });
}

/**
 * Recalculates the currentBasket
 * @param {dw.order.Basket} currentBasket - the target Basket
 */
function recalculateBasket(currentBasket) {
    // Calculate the basket
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });
}


/**
 * Finds and returns a ProductLineItem by UUID
 * @param {dw.order.Basket} currentBasket - the basket to search
 * @param {string} pliUUID - the target UUID
 * @returns {dw.order.ProductLineItem} the associated ProductLineItem
 */
function getProductLineItem(currentBasket, pliUUID) {
    var productLineItem;
    var pli;
    for (var i = 0, ii = currentBasket.productLineItems.length; i < ii; i++) {
        pli = currentBasket.productLineItems[i];
        if (pli.UUID === pliUUID) {
            productLineItem = pli;
            break;
        }
    }
    return productLineItem;
}

/**
 * Validate billing form fields
 * @param {Object} form - the form object with pre-validated form fields
 * @param {Array} fields - the fields to validate
 * @returns {Object} the names of the invalid form fields
 */
function validateBillingForm(form) {
    return validateFields(form);
}

/**
 * Validate credit card form fields
 * @param {Object} form - the form object with pre-validated form fields
 * @returns {Object} the names of the invalid form fields
 */
function validateCreditCard(form) {
    var result = {};
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!form.paymentMethod.value) {
        if (currentBasket.totalGrossPrice.value > 0) {
            result[form.paymentMethod.htmlName] =
                Resource.msg('error.no.selected.payment.method', 'creditCard', null);
        }

        return result;
    }

    return validateFields(form.creditCardFields);
}

/**
 * Sets the payment transaction amount
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {Object} an error object
 */
function calculatePaymentTransaction(currentBasket) {
    var result = { error: false };

    try {
        Transaction.wrap(function () {
            // TODO: This function will need to account for gift certificates at a later date
            var orderTotal = currentBasket.totalGrossPrice;
            var paymentInstruments = currentBasket.paymentInstruments;
            if (paymentInstruments.size() > 0) {
                var paymentInstrument = paymentInstruments[0];
                paymentInstrument.paymentTransaction.setAmount(orderTotal);
            }
        });
    } catch (e) {
        result.error = true;
    }

    return result;
}


/**
 * Validates payment
 * @param {Object} req - The local instance of the request object
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {Object} an object that has error information
 */
function validatePayment(req, currentBasket) {
    var applicablePaymentCards;
    var applicablePaymentMethods;
    var creditCardPaymentMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);
    var paymentAmount = currentBasket.totalGrossPrice.value;
    var countrySitePref = Site.getCurrent().getCustomPreferenceValue('countryCode');
    var countryCode = 'value' in countrySitePref ? countrySitePref.value : 'US';
    var currentCustomer = req.currentCustomer.raw;
    var paymentInstruments = currentBasket.paymentInstruments;
    var result = {};

    applicablePaymentMethods = PaymentMgr.getApplicablePaymentMethods(
        currentCustomer,
        countryCode,
        paymentAmount
    );
    applicablePaymentCards = creditCardPaymentMethod.getApplicablePaymentCards(
        currentCustomer,
        countryCode,
        paymentAmount
    );

    var invalid = true;

    for (var i = 0; i < paymentInstruments.length; i++) {
        var paymentInstrument = paymentInstruments[i];

        if (PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(paymentInstrument.paymentMethod)) {
            invalid = false;
        }

        var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());

        if (paymentMethod && applicablePaymentMethods.contains(paymentMethod)) {
            if (PaymentInstrument.METHOD_CREDIT_CARD.equals(paymentInstrument.paymentMethod)) {
                var card = PaymentMgr.getPaymentCard(paymentInstrument.creditCardType);

                // Checks whether payment card is still applicable.
                if (card && applicablePaymentCards.contains(card)) {
                    invalid = false;
                }
            } else {
                invalid = false;
            }
        }

        if (invalid) {
            break; // there is an invalid payment instrument
        }
    }

    result.error = invalid;
    return result;
}

/**
 * Attempts to create an order from the current basket
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {dw.order.Order} The order object created from the current basket
 */
function createOrder(currentBasket) {
    var order;

    try {
        order = Transaction.wrap(function () {
            return OrderMgr.createOrder(currentBasket);
        });
    } catch (error) {
        return null;
    }
    return order;
}

/**
 * Make void of payment
 *
 * @param {string} orderId - Order ID
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment instrument
 * @returns {boolean} - result of void
 */
function makePaymentVoid(orderId, paymentInstrument) {
    var result = false;
    var voidResult;
    var voidResponse;
    if (paymentInstrument.paymentMethod === PaymentInstrument.METHOD_CREDIT_CARD) {
        var ChaseModel = require('int_chase/cartridge/scripts/models/Chase');
        var cardType = paymentInstrument.creditCardType;

        voidResult = ChaseModel.void(
                orderId,
                paymentInstrument.paymentTransaction.custom.chaseTxRefNum,
                paymentInstrument.paymentTransaction.custom.chaseTxRefIdx,
                false,
                cardType
            );

        if (voidResult.status === Status.OK) {
            voidResponse = voidResult.getDetail('response');
            if (voidResponse.approvalStatus === '1') {
                result = true;
            }
        }
    } else if (paymentInstrument.paymentMethod === 'TD_FINANCE') {
        var TransactionModel = require('int_financing_app/cartridge/scripts/models/Transaction');
        var VoidRequest = require('int_financing_app/cartridge/scripts/helpers/VoidRequest');

        var voidData = VoidRequest.prepareData(paymentInstrument.paymentTransaction.transactionID);

        voidResult = TransactionModel.void(voidData);

        if (voidResult.status === Status.OK) {
            voidResponse = voidResult.getDetail('response');
            if (voidResponse.authRes === 1) {
                Transaction.wrap(function () {
                    paymentInstrument.paymentTransaction.custom.voidTransactionID = voidResponse.transactionLink;  // eslint-disable-line no-param-reassign
                    paymentInstrument.paymentTransaction.custom.voidAuthDate = StringUtils.formatCalendar(voidResponse.authDate); // eslint-disable-line no-param-reassign
                });
                result = true;
            }
        }
    }
    return result;
}

/**
 * Void all payments
 *
 * @param {dw.order.Order} order - order object
 */
function voidPayments(order) {
    var paymentInstruments = order.paymentInstruments;
    var orderId = order.orderNo;
    for (var i = 0; i < paymentInstruments.length; i++) {
        var paymentInstrument = paymentInstruments[i];
        makePaymentVoid(orderId, paymentInstrument);
    }
}

/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @param {string} orderNumber - The order number for the order
 * @returns {Object} an error object
 */
function handlePayments(order, orderNumber) {
    var Logger = require('dw/system/Logger');
    var result = {};

    if (order.totalNetPrice !== 0.00) {
        var paymentInstruments = order.paymentInstruments;

        if (paymentInstruments.length === 0) {
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
            result.error = true;
        }
        var authorizedPIs = [];
        if (!result.error) {
            for (var i = 0; i < paymentInstruments.length; i++) {
                var paymentInstrument = paymentInstruments[i];
                var paymentProcessor = PaymentMgr
                    .getPaymentMethod(paymentInstrument.paymentMethod)
                    .paymentProcessor;
                var authorizationResult;
                if (paymentProcessor === null) {
                    Transaction.begin();
                    paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
                    Transaction.commit();
                } else {
                    if (HookMgr.hasHook('app.payment.processor.' +
                            paymentProcessor.ID.toLowerCase())) {
                        Logger.error('Authorizes a payment using payment processor: ' + paymentProcessor.ID)
                        authorizationResult = HookMgr.callHook(
                            'app.payment.processor.' + paymentProcessor.ID.toLowerCase(),
                            'Authorize',
                            orderNumber,
                            paymentInstrument,
                            paymentProcessor,
                            order
                        );
                    } else {
                        authorizationResult = HookMgr.callHook(
                            'app.payment.processor.default',
                            'Authorize'
                        );
                    }

                    if (authorizationResult.error) {
                        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
                        result.error = true;
                        if (authorizationResult.errorMessage) {
                            result.errorMessage = authorizationResult.errorMessage;
                            Logger.error('Payment is not processed by the payment process' + paymentProcessor.ID)
                        }
                        break;
                    } else {
                        authorizedPIs.push(paymentInstrument);
                    }
                }
            }
        }

        // make a void if one of payment instrument is failed
        if (result.error && authorizedPIs.length > 0) {
            for (var j = 0; j < authorizedPIs.length; j++) {
                var authorizedPI = authorizedPIs[j];
                makePaymentVoid(orderNumber, authorizedPI);
            }
        }
    }

    return result;
}

/**
 * Sends a confirmation to the current user
 * @param {dw.order.Order} order - The current user's order
 * @param {string} locale - the current request's locale id
 * @returns {void}
 */
function sendConfirmationEmail(order, locale) {
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');
    var Logger = require('dw/system/Logger');

    var context = new HashMap();
    var currentLocale = Locale.getLocale(locale);

    var orderModel = new OrderModel(order, { countryCode: currentLocale.country });

    var orderObject = { order: orderModel };
    Object.keys(orderObject).forEach(function (key) {
        context.put(key, orderObject[key]);
    });

    var template = new Template('checkout/confirmation/confirmationEmail');
    var content = template.render(context).text;

    // Set Order for hook compat
    context.put('Order', order);
    // Set extra param, CurrentLocale
    context.put('CurrentLocale', currentLocale);

    var hookID = 'app.mail.sendMail';
    if (HookMgr.hasHook(hookID)) {
        HookMgr.callHook(
            hookID,
            'sendMail',
            {
                communicationHookID: 'order.confirmation',
                template: 'checkout/confirmation/confirmationEmail',
                fromEmail: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
                toEmail: order.customerEmail,
                subject: Resource.msg('subject.order.confirmation.email', 'order', null),
                messageBody: content,
                params: context
            }
        );
    } else {
        Logger.error('No hook registered for {0}', hookID);
    }
}

/**
 * Attempts to place the order
 * @param {dw.order.Order} order - The order object to be placed
 * @param {Object} fraudDetectionStatus - an Object returned by the fraud detection hook
 * @returns {Object} an error object
 */
function placeOrder(order, fraudDetectionStatus) {
    var Logger = require('dw/system/Logger');
    var result = { error: false };

    try {
        Transaction.begin();
        var placeOrderStatus = OrderMgr.placeOrder(order);
        if (placeOrderStatus === Status.ERROR) {
            throw new Error();
        }

        if (fraudDetectionStatus.status === 'flag') {
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
            Logger.error('#'+ order.orderNo+' order confirmation is set to Not confirmed because fraudDetectionStatus is ' +fraudDetectionStatus.status);
        } else {
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
        }

        order.custom.globalComplianceCheckStatus = 'PENDING';

        Transaction.commit();
    } catch (e) {
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
        result.error = true;
    }

    return result;
}

/**
 * saves payment instrument to customers wallet
 * @param {dw.order.Order} order - The current order
 * @param {dw.customer.Customer} customer - The current customer
 * @returns {dw.customer.CustomerPaymentInstrument} newly stored payment Instrument
 */
function savePaymentInstrumentToWallet(order, customer) {
    var array = require('*/cartridge/scripts/util/array');
    var wallet = customer.getProfile().getWallet();
    var orderPaymentInstruments = order.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);

    if (orderPaymentInstruments.length === 0) {
        return null;
    }

    var cardPaymentInstrument = orderPaymentInstruments[0];

    return Transaction.wrap(function () {
        var storedPaymentInstruments = wallet.paymentInstruments;
        var storedPaymentInstrument = array.find(storedPaymentInstruments, function (item) {
            return cardPaymentInstrument.maskedCreditCardNumber === item.creditCardNumber;
        });
        if (!storedPaymentInstrument) {
            storedPaymentInstrument = wallet.createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);
        }

        storedPaymentInstrument.setCreditCardHolder(
            order.billingAddress.fullName
        );
        storedPaymentInstrument.setCreditCardNumber(
            cardPaymentInstrument.maskedCreditCardNumber
        );
        storedPaymentInstrument.setCreditCardType(
            cardPaymentInstrument.creditCardType
        );
        storedPaymentInstrument.setCreditCardExpirationMonth(
            cardPaymentInstrument.creditCardExpirationMonth
        );
        storedPaymentInstrument.setCreditCardExpirationYear(
            cardPaymentInstrument.creditCardExpirationYear
        );

        storedPaymentInstrument.custom.chaseCustomerReferenceNumber = cardPaymentInstrument.paymentTransaction.custom.chaseCustomerReferenceNumber;

        return storedPaymentInstrument;
    });
}

/**
 * renders the user's stored payment Instruments
 * @param {Object} req - The request object
 * @param {Object} accountModel - The account model for the current customer
 * @returns {string|null} newly stored payment Instrument
 */
function getRenderedPaymentInstruments(req, accountModel) {
    var result;

    if (req.currentCustomer.raw.authenticated
        && req.currentCustomer.raw.registered
        && req.currentCustomer.raw.profile.wallet.paymentInstruments.getLength()
    ) {
        var context;
        var template = 'checkout/billing/storedPaymentInstruments';

        context = { customer: accountModel };
        result = renderTemplateHelper.getRenderedHtml(
            context,
            template
        );
    }

    return result || null;
}

/**
 * sets the gift message on a shipment
 * @param {dw.order.Shipment} shipment - Any shipment for the current basket
 * @param {boolean} isGift - is the shipment a gift
 * @param {string} giftMessage - The gift message the user wants to attach to the shipment
 * @returns {Object} object containing error information
 */
function setGift(shipment, isGift, giftMessage) {
    var result = { error: false, errorMessage: null };

    try {
        Transaction.wrap(function () {
            shipment.setGift(isGift);

            if (isGift && giftMessage) {
                shipment.setGiftMessage(giftMessage);
            } else {
                shipment.setGiftMessage(null);
            }
        });
    } catch (e) {
        result.error = true;
        result.errorMessage = Resource.msg('error.message.could.not.be.attached', 'checkout', null);
    }

    return result;
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
        shippingMethod: order.defaultShipment.shippingMethod.displayName,
        customerEmail: order.customerEmail
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
    }
    

    var emailObj = {
        to: email,
        subject: Resource.msg('email.msg.subject.order.confirmation', 'email', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
    };

    var mailSent =  emailHelpers.send(emailObj, template, emailOrderObj);
    return mailSent;
}


module.exports = {
    getFirstNonDefaultShipmentWithProductLineItems: getFirstNonDefaultShipmentWithProductLineItems,
    ensureNoEmptyShipments: ensureNoEmptyShipments,
    getProductLineItem: getProductLineItem,
    isShippingAddressInitialized: isShippingAddressInitialized,
    prepareShippingForm: prepareShippingForm,
    prepareBillingForm: prepareBillingForm,
    copyCustomerAddressToShipment: copyCustomerAddressToShipment,
    copyCustomerAddressToBilling: copyCustomerAddressToBilling,
    copyShippingAddressToShipment: copyShippingAddressToShipment,
    copyBillingAddressToBasket: copyBillingAddressToBasket,
    validateFields: validateFields,
    validateShippingForm: validateShippingForm,
    validateBillingForm: validateBillingForm,
    validatePayment: validatePayment,
    validateCreditCard: validateCreditCard,
    calculatePaymentTransaction: calculatePaymentTransaction,
    recalculateBasket: recalculateBasket,
    handlePayments: handlePayments,
    makePaymentVoid: makePaymentVoid,
    voidPayments: voidPayments,
    createOrder: createOrder,
    placeOrder: placeOrder,
    savePaymentInstrumentToWallet: savePaymentInstrumentToWallet,
    getRenderedPaymentInstruments: getRenderedPaymentInstruments,
    sendConfirmationEmail: sendConfirmationEmail,
    ensureValidShipments: ensureValidShipments,
    setGift: setGift,
    sendOrderConfirmationEmailFromSFCC: sendOrderConfirmationEmailFromSFCC
};
