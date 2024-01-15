'use strict';
/* global session */
var server = require('server');
server.extend(module.superModule);

/**
 * Get Dealer View Data
 *
 * @param {Object} req - request object
 * @param {string} dealerCountryCode - dealer country code
 * @param {string} dealerZipCode - dealer zip code
 * @param {dw.order.Basket} currentBasket - basket object
 * @param {Object} shippingForm - shipping form
 * @returns {Object} - view data object
 */
function getDealerViewData(req, dealerCountryCode, dealerZipCode, currentBasket, shippingForm) {
    var DealerHelper = require('int_mtdservices/cartridge/scripts/helpers/DealerHelper');
    var MTDUtil = require('int_mtdservices/cartridge/scripts/helpers/Util');

    var fulfillmentBasketData = DealerHelper.verifyBasket(currentBasket);
    var needToShowDealerLookup = fulfillmentBasketData.needToShowDealerLookup;

    var viewData = {
        needToShowDealerLookup: fulfillmentBasketData.needToShowDealerLookup,
        needToHideShippingItem: needToShowDealerLookup,
        hasPartsAndAccessories: fulfillmentBasketData.hasPartsAndAccessories,
        dealerDeliveryMethodId: MTDUtil.VALUE.DEALER_DELIVERY_METHOD,
        dealerPickupMethodId: MTDUtil.VALUE.DEALER_PICKUP_METHOD,
        dealerDeliveryInfo: DealerHelper.getContentAssetBody('dealers-delivery-info'),
        dealerPickupInfo: DealerHelper.getContentAssetBody('dealers-pickup-info')
    };

    // If we don't have presaved dealer country code and zip
    // but customer is registered and has default address
    // we use data from default address
    if (!dealerCountryCode && !dealerZipCode
            && req.currentCustomer.addressBook && req.currentCustomer.addressBook.preferredAddress) {
        var defaultAddress = req.currentCustomer.addressBook.preferredAddress;
        dealerCountryCode = defaultAddress.countryCode.value; // eslint-disable-line no-param-reassign
        dealerZipCode = defaultAddress.postalCode; // eslint-disable-line no-param-reassign
    }
    // Normalize zip code
    if (dealerZipCode && dealerZipCode.indexOf('-') > 0) {
        var zipCodeArray = dealerZipCode.split('-');
        dealerZipCode = zipCodeArray[0]; // eslint-disable-line no-param-reassign
    }

    // Set zip code to form if it exists
    if (dealerZipCode) {
        shippingForm.shippingAddress.dealerZipCode.value = dealerZipCode; // eslint-disable-line no-param-reassign
    }

    // Get Fulfillment Data if we need to make dealer lookup and have zipcode
    if (needToShowDealerLookup && dealerCountryCode && dealerZipCode) {
        viewData.dealerFulfillmentData = DealerHelper.getFulfillmentData(currentBasket, dealerCountryCode, dealerZipCode);
        viewData.needToHideShippingItem = viewData.dealerFulfillmentData.pickupDealers.length === 0 && !viewData.dealerFulfillmentData.factoryShipping;
        // Test
        /* viewData.dealerFulfillmentData.ableToDeliver = false;
        viewData.dealerFulfillmentData.factoryShipping = false;
        viewData.dealerFulfillmentData.pickupDealers = [];*/
    }

    // Add CARB enabled site pref
    viewData.carbEnabled = MTDUtil.VALUE.CARB_COMPLIANCE_ENABLED;

    if (needToShowDealerLookup) {
        viewData.dealerHelperZipFormMsg = DealerHelper.getContentAssetBody('dealer-zipform-helptext');
        viewData.dealerWrongZipCodeMsg = DealerHelper.getContentAssetBody('dealer-wrong-zip-code');
        viewData.dealerShippingNotAvailableMsg = DealerHelper.getContentAssetBody('dealer-factory-shipping-not-available');
        viewData.dealerDeliveryDirectMsg = DealerHelper.getContentAssetBody('dealer-delivery-direct-estimate');
        viewData.dealerDeliveryDropshipMsg = DealerHelper.getContentAssetBody('dealer-delivery-dropship-estimate');
        viewData.dealerPickupDirectMsg = DealerHelper.getContentAssetBody('dealer-pickup-direct-estimate');
        viewData.dealerPickupDropshipMsg = DealerHelper.getContentAssetBody('dealer-pickup-dropship-estimate');
        viewData.dealerNotFoundMsg = DealerHelper.getContentAssetBody('dealers-not-found');
    }

    return viewData;
}

/**
 * Get Current Shipping Address
 * @param {dw.order.OrderAddress} shippingAddress - shipping address
 * @returns {Object} - object of address
 */
function getCurrentShippingAddress(shippingAddress) {
    var address = {
        firstName: shippingAddress && shippingAddress.firstName ? shippingAddress.firstName : '',
        lastName: shippingAddress && shippingAddress.lastName ? shippingAddress.lastName : '',
        address1: shippingAddress && shippingAddress.address1 ? shippingAddress.address1 : '',
        address2: shippingAddress && shippingAddress.address2 ? shippingAddress.address2 : '',
        city: shippingAddress && shippingAddress.city ? shippingAddress.city : '',
        postalCode: shippingAddress && shippingAddress.postalCode ? shippingAddress.postalCode : '',
        stateCode: shippingAddress && shippingAddress.stateCode ? shippingAddress.stateCode : '',
        countryCode: shippingAddress && shippingAddress.countryCode.value ? shippingAddress.countryCode.value : '',
        phone: shippingAddress && shippingAddress.phone ? shippingAddress.phone : ''
    };
    return address;
}

/**
 *  MTDS-106 Clearing shippingAddress if not edealer-eligible
 * @param {dw.order.Basket} basket - basket
 * @returns {boolean} - someEdealerEligible
 * */
function anyProductsEdealerEligible(basket) { // TEST
    var someEdealerEligible = false;
    for (var i = 0; i < basket.allProductLineItems.size(); i++) {
        if (basket.allProductLineItems[i].product.custom['edealer-eligible'] === true) {
            someEdealerEligible = true;
            break;
        }
    }
    return someEdealerEligible;
}

/**
 *  MTDS-106 Clearing shippingAddress if not edealer-eligible
 * @param {dw.order.Basket} basket - basket
 * @param {dw.order.Basket} orderModel - orderModel
 * @returns {boolean} = true
 * */
function checkIfValidForDealerPick(basket, orderModel) {
    var clearShippingAddress = false;
    if (orderModel.shipping[0].shippingAddress != null && orderModel.shipping[0].selectedShippingMethod) {
        if (!anyProductsEdealerEligible(basket) && (orderModel.shipping[0].selectedShippingMethod.ID === 'dealer-delivery' || orderModel.shipping[0].selectedShippingMethod.ID === 'dealer-pickup')) {
            clearShippingAddress = true;
        }
    }

    if (clearShippingAddress === true) {
        orderModel.shipping[0].shippingAddress = null;	// eslint-disable-line no-param-reassign
    }
    return true;
}

// Main entry point for Checkout
server.append(
    'Begin',
    function (req, res, next) {
        var originViewData = res.getViewData();
        if (originViewData.willBeReplaced) {
            next();
            return;
        }

        var BasketMgr = require('dw/order/BasketMgr');
        var Locale = require('dw/util/Locale');
        var OrderModel = require('*/cartridge/models/order');
        var MTDUtil = require('int_mtdservices/cartridge/scripts/helpers/Util');
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

        var currentBasket = BasketMgr.getCurrentBasket();

        var defaultShipment = currentBasket.defaultShipment;
        var dealerCountryCode = defaultShipment.shippingAddress && defaultShipment.shippingAddress.countryCode ? defaultShipment.shippingAddress.countryCode.value : null;
        var dealerZipCode = defaultShipment.shippingAddress && defaultShipment.shippingAddress.postalCode ? defaultShipment.shippingAddress.postalCode : null;
        var shippingForm = originViewData.forms.shippingForm;
        var viewData = getDealerViewData(req, dealerCountryCode, dealerZipCode, currentBasket, shippingForm);
        var shippingAddress = (defaultShipment.shippingMethodID !== MTDUtil.VALUE.DEALER_PICKUP_METHOD) ? defaultShipment.shippingAddress : null;
        viewData.currentShippingAddress = getCurrentShippingAddress(shippingAddress);
        // Add dealer info if we have set custom attribute
        if (defaultShipment.custom.dealerInfo) {
            viewData.dealerInfo = JSON.parse(defaultShipment.custom.dealerInfo);
            viewData.isCheckout = true;
        }

        // Re-render order object to make sure that all totals is correct for displaying
        var currentCustomer = req.currentCustomer.raw;
        var currentLocale = Locale.getLocale(req.locale.id);
        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
        // Loop through all shipments and make sure all are valid
        var allValid = COHelpers.ensureValidShipments(currentBasket);
        var orderModel = new OrderModel(
            currentBasket,
            {
                customer: currentCustomer,
                usingMultiShipping: usingMultiShipping,
                shippable: allValid,
                countryCode: currentLocale.country,
                containerView: 'basket'
            }
        );
        originViewData.order = orderModel;
        originViewData.emailSignup = currentBasket.custom.emailSignup;

        var Site = require('dw/system/Site');
        var ViewHelper = require('*/cartridge/scripts/utils/ViewHelper');
        if (orderModel.shipping[0].shippingAddress) {
            viewData.formattedShippingPhone = ViewHelper.formatPhoneNumber(orderModel.shipping[0].shippingAddress.phone, Locale.getLocale(Site.current.defaultLocale).country);
        }

        /* MTDS-106 Clearing shippingAddress if not edealer-eligible */
        checkIfValidForDealerPick(currentBasket, orderModel);

        // Verify that finance credit is applicable for current basket
        var financeUtil = require('int_financing_app/cartridge/scripts/helpers/Util');
        var isFinanceCreditAvailable = false;
        if (financeUtil.financeEnabled()) {
            var financeTotal = financeUtil.getBasketTotal(currentBasket);
            var financePlan = financeUtil.findPlansForEstimation(financeTotal.value);
            if (financePlan) {
                isFinanceCreditAvailable = true;
                var financePlans = financeUtil.getEnabledFinancePlans(financeTotal.value);
                viewData.financePlans = financePlans;
                var financePI = financeUtil.getFinancePaymentInstrument(currentBasket);
                viewData.selectedFinancePlanId = financePI ? financePI.custom.tdPlanID : financePlan.custom.planID;
                // update account number with value
                if (financePI) {
                    var billingForm = server.forms.getForm('billing');
                    billingForm.financeCardFields.accountNumber.value = financePI.custom.tdAccountNumber;
                    // Set Finance Payment Instrument as selected
                    billingForm.paymentMethod.value = financeUtil.VALUE.FINANCE_METHOD_ID;
                    // Update billing form
                    originViewData.forms.billingForm = billingForm;
                }
            }
        }
        viewData.isFinanceCreditAvailable = isFinanceCreditAvailable;

        res.setViewData(viewData);
        next();
    }
);

// Dealer lookup
server.post(
    'DealerLookup',
    server.middleware.https,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Site = require('dw/system/Site');
        var MTDUtil = require('int_mtdservices/cartridge/scripts/helpers/Util');

        // Get default country code from Site pref
        var countrySitePref = Site.getCurrent().getCustomPreferenceValue('countryCode');
        var defaultCountryCode = 'value' in countrySitePref ? countrySitePref.value : 'US';

        var currentBasket = BasketMgr.getCurrentBasket();
        var dealerCountryCode = req.form.countryCode || defaultCountryCode;
        var dealerZipCode = req.form.zipCode;
        var shippingForm = server.forms.getForm('shipping');
        var viewData = getDealerViewData(req, dealerCountryCode, dealerZipCode, currentBasket, shippingForm);

        viewData.forms = {
            shippingForm: shippingForm
        };
        var shippingAddress = (currentBasket.defaultShipment.shippingMethodID !== MTDUtil.VALUE.DEALER_PICKUP_METHOD) ?
                currentBasket.defaultShipment.shippingAddress : null;
        viewData.currentShippingAddress = getCurrentShippingAddress(shippingAddress);

        res.render('dealer/dealerLookup', viewData);
        next();
    }
);

// Dealer CARB compliance check
server.get(
    'Carb',
    server.middleware.https,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var MTDUtil = require('int_mtdservices/cartridge/scripts/helpers/Util');
        var DealerHelper = require('int_mtdservices/cartridge/scripts/helpers/DealerHelper');

        var jsonResult = {
            showDialog: false
        };

        // Verify that CARB is enabled
        if (MTDUtil.VALUE.CARB_COMPLIANCE_ENABLED) {
            var currentBasket = BasketMgr.getCurrentBasket();
            // Verify that at least one product is CARB'
            var carbProductData = DealerHelper.checkProductCarbs(currentBasket);
            // Verify that products has replacement orderable products
            if (carbProductData.length > 0) {
                var orderable = DealerHelper.areProductsOrderable(carbProductData);
                var context = {};
                var template = '';
                if (orderable) {
                    context = {
                        productData: carbProductData,
                        title: DealerHelper.getContentAssetBody('carb-modal-title'),
                        ctaText: DealerHelper.getContentAssetBody('carb-modal-success-cta'),
                        assetText: DealerHelper.getContentAssetBody('carb-modal-swap-message')
                    };
                    template = 'dealer/carbReplace';
                } else {
                    context = {
                        title: DealerHelper.getContentAssetBody('carb-modal-title-error'),
                        ctaText: DealerHelper.getContentAssetBody('carb-modal-cta-error'),
                        assetText: DealerHelper.getContentAssetBody('carb-modal-swap-message-error')
                    };
                    template = 'dealer/carbError';
                }
                res.render(template, context);
            } else {
                res.json(jsonResult);
            }
        } else {
            res.json(jsonResult);
        }
        next();
    }
);

// Replace Carb Products
server.post(
    'CarbReplace',
    server.middleware.https,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Transaction = require('dw/system/Transaction');
        var Resource = require('dw/web/Resource');
        var MTDUtil = require('int_mtdservices/cartridge/scripts/helpers/Util');
        var DealerHelper = require('int_mtdservices/cartridge/scripts/helpers/DealerHelper');
        var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

        var jsonResult = {
            success: false,
            msg: Resource.msg('carb.replace.error', 'dealer', null)
        };

        var dealerZipCode = req.form.zipCode;
        var countryCode = req.form.countryCode || 'US';

        // Verify that CARB is enabled
        if (MTDUtil.VALUE.CARB_COMPLIANCE_ENABLED) {
            var currentBasket = BasketMgr.getCurrentBasket();
            // Verify that at least one product is CARB'
            var carbProductData = DealerHelper.checkProductCarbs(currentBasket);
            var hasErrors = false;
            // Verify that products has replacement orderable products
            if (carbProductData.length > 0) {
                carbProductData.forEach(function (data) {
                    // Remove original product and replace with new one
                    for (var i = 0; i < currentBasket.productLineItems.length; i++) {
                        var item = currentBasket.productLineItems[i];
                        if (item.productID === data.originProductId) {
                            Transaction.wrap(function () { // eslint-disable-line no-loop-func
                                currentBasket.removeProductLineItem(item);
                            });
                            break;
                        }
                    }
                    // Add product
                    var result;
                    Transaction.wrap(function () {
                        result = cartHelper.addProductToCart(
                            currentBasket,
                            data.productId,
                            data.qty,
                            [],
                            []
                        );
                    });
                    if (!result && !hasErrors) {
                        hasErrors = true;
                    }
                });
                Transaction.wrap(function () {
                    // Saved entered zip code for reloading a page
                    if (dealerZipCode) {
                        if (!currentBasket.defaultShipment.shippingAddress) {
                            currentBasket.defaultShipment.createShippingAddress();
                        }
                        currentBasket.defaultShipment.shippingAddress.postalCode = dealerZipCode;
                        currentBasket.defaultShipment.shippingAddress.setCountryCode(countryCode);
                    }
                    basketCalculationHelpers.calculateTotals(currentBasket);
                });
                if (!hasErrors) {
                    jsonResult.success = true;
                }
            }
        }
        res.json(jsonResult);
        next();
    }
);

module.exports = server.exports();
