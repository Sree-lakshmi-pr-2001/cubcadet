'use strict';
/* global session, empty */
var server = require('server');
server.extend(module.superModule);

/**
 * Get Dealer View Model
 *
 * @returns {Object} - view data object
 */
function getDealerViewModel() {
    var StoreMgr = require('dw/catalog/StoreMgr');
    var StoreModel = require('*/cartridge/models/store');
    var Logger = require('dw/system/Logger');
    var dealerStoreModel = null;

    var dealerId = StoreMgr.getStoreIDFromSession();
    if (!empty(dealerId)) {
        var dealer = StoreMgr.getStore(dealerId);
        if (dealer) {
            dealerStoreModel = new StoreModel(dealer);
        } else {
            Logger.error('Dealer ' + dealerId + ' was not found on checkout');
        }
    } else {
        Logger.error('Dealer was not found in session on checkout');
    }

    return dealerStoreModel;
}

/**
 * Get Dealer Info
 *
 * @param {Object} dealerStoreModel - dealerStoreModel
 * @returns {Object} - view data object
 */
function getDealerInfo(dealerStoreModel) {
    var dealerInfo = {};
    var dealerAddress = {
        firstName: null,
        lastName: null,
        companyName: dealerStoreModel.name,
        phone: dealerStoreModel.phone,
        address1: dealerStoreModel.address1,
        address2: dealerStoreModel.address2,
        address3: null,
        postalCode: dealerStoreModel.postalCode,
        city: dealerStoreModel.city,
        state: dealerStoreModel.stateCode,
        countryCode: dealerStoreModel.countryCode
    };

    dealerInfo.dealerId = dealerStoreModel.ID;
    dealerInfo.customerNumber = dealerStoreModel.custom.customernumber;
    dealerInfo.dealerAddress = dealerAddress;
    dealerInfo.erpShipToNumber = dealerStoreModel.erpShipToNumber;
    return dealerInfo;
}

/**
 * Get Dealer View Data
 *
 * @returns {Object} - view data object
 */
function getDealerViewData() {
    var DealerHelper = require('int_mtdservices/cartridge/scripts/helpers/DealerHelper');
    var MTDUtil = require('int_mtdservices/cartridge/scripts/helpers/Util');

    var viewData = {
        needToHideShippingItem: false,
        dealerDeliveryMethodId: MTDUtil.VALUE.DEALER_DELIVERY_METHOD,
        dealerPickupMethodId: MTDUtil.VALUE.DEALER_PICKUP_METHOD,
        dealerDeliveryInfo: DealerHelper.getContentAssetBody('dealers-delivery-info'),
        dealerPickupInfo: DealerHelper.getContentAssetBody('dealers-pickup-info')
    };

    var dealerFulfillmentData = {
        deliveryMethodId: MTDUtil.VALUE.DEALER_DELIVERY_METHOD,
        pickupMethodId: MTDUtil.VALUE.DEALER_PICKUP_METHOD
    };
    viewData.dealerFulfillmentData = dealerFulfillmentData;

    // Add CARB enabled site pref
    viewData.carbEnabled = MTDUtil.VALUE.CARB_COMPLIANCE_ENABLED;

    viewData.dealerHelperZipFormMsg = DealerHelper.getContentAssetBody('dealer-zipform-helptext');
    viewData.dealerWrongZipCodeMsg = DealerHelper.getContentAssetBody('dealer-wrong-zip-code');
    viewData.dealerShippingNotAvailableMsg = DealerHelper.getContentAssetBody('dealer-factory-shipping-not-available');
    viewData.dealerDeliveryDirectMsg = DealerHelper.getContentAssetBody('dealer-delivery-direct-estimate');
    viewData.dealerDeliveryDropshipMsg = DealerHelper.getContentAssetBody('dealer-delivery-dropship-estimate');
    viewData.dealerPickupDirectMsg = DealerHelper.getContentAssetBody('dealer-pickup-direct-estimate');
    viewData.dealerPickupDropshipMsg = DealerHelper.getContentAssetBody('dealer-pickup-dropship-estimate');
    viewData.dealerNotFoundMsg = DealerHelper.getContentAssetBody('dealers-not-found');

    return viewData;
}

// Main entry point for Checkout
server.prepend(
    'Begin',
    function (req, res, next) {
        var viewData = res.getViewData();
        viewData.willBeReplaced = true;

        res.setViewData(viewData);
        next();
    }
);

// Main entry point for Checkout
server.append(
    'Begin',
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Locale = require('dw/util/Locale');
        var OrderModel = require('*/cartridge/models/order');
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var Transaction = require('dw/system/Transaction');
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        var dealerHelpers = require('*/cartridge/scripts/dealer/dealerHelpers');
        var checkWarranty = require('*/cartridge/scripts/helpers/basketWarrantyCheckHelpers').checkWarranty;
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');
        var aftermarketOnly = false;
        // Dealer Fulfillment
        var dealerInfo;
        var dfType;
        var dealerId;
        var dealerCustomerNumber;

        // TEST: Set delivery and dealerID TODO: Remove or Comment
        // require('*/cartridge/scripts/test/dealerTestHelpers').setDelivery();

        var deliveryType = COHelpers.getDeliveryType();
        var isDealer = false;
        var dealerStoreModel = null;

        var originViewData = res.getViewData();
        var currentBasket = BasketMgr.getCurrentBasket();
        var allProductLineItems = currentBasket.getAllProductLineItems();
        if(empty(allProductLineItems)){
            res.redirect(URLUtils.url('Cart-Show'));
            return next();
        }
        var defaultShipment = currentBasket.defaultShipment;

        // Update Headers
        var shippingSectionHeader = COHelpers.getShippingSectionHeader();
        var shippingAddressHeader = COHelpers.getShippingAddressHeader();
        var continueToPayment = Resource.msg('button.next.payment', 'checkout', null);

        var billingSectionHeader = Resource.msg('heading.checkout.billing.billing','checkout',null);

        if (originViewData.aftermarketOnly) {
            shippingSectionHeader = Resource.msg('heading.checkout.shipping_aftermarket.section.home', 'checkout', null);
            shippingAddressHeader = Resource.msg('heading.checkout.shipping_aftermarket.address.home', 'checkout', null);
            continueToPayment = Resource.msg('button.next.aftermarket_payment', 'checkout', null);
            billingSectionHeader = Resource.msg('heading.checkout.billing_aftermarket.billing','checkout',null);
        }

        var shippingDealerHeader = COHelpers.getShippingDealerHeader();
        originViewData.shippingSectionHeader = shippingSectionHeader;
        originViewData.shippingAddressHeader = shippingAddressHeader;
        originViewData.shippingDealerHeader = shippingDealerHeader;
        originViewData.continueToPayment=continueToPayment;
        originViewData.billingSectionHeader=billingSectionHeader;

        // Check if it's a dealer
        if (deliveryType === COHelpers.DELIVERY.DEALER_PICK_UP || deliveryType === COHelpers.DELIVERY.DEALER) {
            dealerStoreModel = getDealerViewModel();
            // Set default shipping method in case if store was not found
            if (empty(dealerStoreModel)) {
                COHelpers.setDefaultShippingMethod();
            } else {
                originViewData.dealer = dealerStoreModel;
                dealerInfo = getDealerInfo(dealerStoreModel);
                isDealer = true;

                if (deliveryType === COHelpers.DELIVERY.DEALER_PICK_UP) {
                    originViewData.isDealerPickup = true;
                    dfType = 'Dealer Pickup';

                    // Fill shipping form for dealer pickup
                    if (dealerInfo && dealerInfo.dealerAddress) {
                        var address = dealerInfo.dealerAddress;

                        Transaction.wrap(function () {
                            if (!defaultShipment.shippingAddress) {
                                defaultShipment.createShippingAddress();
                            }

                            defaultShipment.shippingAddress.setFirstName('Delivery');
                            defaultShipment.shippingAddress.setLastName('Pickup');
                            defaultShipment.shippingAddress.setAddress1(address.address1);
                            defaultShipment.shippingAddress.setAddress2(address.address2);
                            defaultShipment.shippingAddress.setCity(address.city);
                            defaultShipment.shippingAddress.setPostalCode(address.postalCode);
                            defaultShipment.shippingAddress.setCountryCode(address.countryCode);
                            var formattedDealerPhone = address.phone.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s/g, '');
                            defaultShipment.shippingAddress.setPhone(formattedDealerPhone);
                            defaultShipment.shippingAddress.setStateCode(address.state);

                            basketCalculationHelpers.calculateTotals(currentBasket);
                        });
                    }
                }

                if (deliveryType === COHelpers.DELIVERY.DEALER) {
                    originViewData.isDealerDelivery = true;
                    dfType = 'Dealer Delivery';

                    // Set delivery zipcode from session
                    var deliveryZipCode = dealerHelpers.getDeliveryZipCode();
                    if (deliveryZipCode) {
                        var shippingForm = server.forms.getForm('shipping');
                        shippingForm.shippingAddress.addressFields.postalCode.htmlValue = deliveryZipCode;
                        shippingForm.shippingAddress.addressFields.postalCode.value = deliveryZipCode;
                        originViewData.forms.shippingForm = shippingForm;

                        Transaction.wrap(function () {
                            if (!defaultShipment.shippingAddress) {
                                defaultShipment.createShippingAddress();
                            }
                            defaultShipment.shippingAddress.setPostalCode(deliveryZipCode);
                            basketCalculationHelpers.calculateTotals(currentBasket);
                        });
                    }
                }

                if (dealerInfo) {
                    COHelpers.updateDealerCustomAttributes(currentBasket, dealerInfo.dealerId, dealerInfo.erpShipToNumber);
                }
            }
        }

        originViewData.isDealer = isDealer;

        if (dealerInfo && dfType) {
            dealerId = dealerInfo.dealerId;
            dealerCustomerNumber = dealerInfo.customerNumber;
            Transaction.wrap(function () {
                var shipment = currentBasket.defaultShipment;
                shipment.custom.dealerInfo = null;
                shipment.custom.dealerAddress = JSON.stringify(dealerInfo.dealerAddress);
                shipment.custom.dealerID = dealerId;
                shipment.custom.dealerCustomerNumber = dealerCustomerNumber;
                shipment.custom.DFType = dfType;
                shipment.custom.erpShipToNumber = dealerInfo.erpShipToNumber;
                shipment.custom.companyName = dealerInfo.dealerAddress.companyName;
            });

            originViewData.dealerInfo = dealerInfo;
        } else {
            Transaction.wrap(function () {
                var shipment = currentBasket.defaultShipment;
                shipment.custom.dealerInfo = null;
                shipment.custom.dealerID = null;
                shipment.custom.dealerCustomerNumber = null;
                shipment.custom.DFType = null;
                shipment.custom.erpShipToNumber = null;
                shipment.custom.companyName = null;
                shipment.custom.dealerAddress = null;
            });
        }

        // set delivery estimate
        var deliveryEstimate = dealerHelpers.getDealerDeliveryMethodEstimate(currentBasket);
        originViewData.deliveryEstimate = deliveryEstimate;

        originViewData.isHomeDelivery = deliveryType === COHelpers.DELIVERY.HOME ? true : false;
        originViewData.isWholeGoodDelivery = dealerHelpers.checkWholeGoodDelivery(currentBasket);

        var viewData = getDealerViewData();

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

        // Verify that finance credit is applicable for current basket
        var financeUtil = require('int_financing_app/cartridge/scripts/helpers/Util');
        var isFinanceCreditAvailable = false;
        if (financeUtil.financeEnabled()) {
            var financeTotal = financeUtil.getBasketTotal(currentBasket);
            var financePlan = financeUtil.findPlansForEstimation(financeTotal.value, null, null, true, true);
            if (financePlan) {
                isFinanceCreditAvailable = true;
                var financePlans = financeUtil.getEnabledFinancePlans(financeTotal.value, true);
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
        viewData.isProductRegistration = checkWarranty(currentBasket);
        res.setViewData(viewData);
        next();
    }
);



module.exports = server.exports();
