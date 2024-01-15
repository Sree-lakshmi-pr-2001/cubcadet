/* global session empty dw */
'use strict';

/**
 * API dependencies
 */
var ShippingMgr = require('dw/order/ShippingMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var Transaction = require('dw/system/Transaction');
var BasketMgr = require('dw/order/BasketMgr');
var Site = require('dw/system/Site');

/**
 * Include Modules
 */
var Util = require('~/cartridge/scripts/helpers/Util');
var RequestUtil = require('~/cartridge/scripts/helpers/DealerRequest');
var DealerModel = require('~/cartridge/scripts/models/Dealer');
var collections = require('*/cartridge/scripts/util/collections');
var ShippingMethodModel = require('*/cartridge/models/shipping/shippingMethod');
var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');

/**
 * Get Dealer Shipping Methods
 *
 * @param {dw.order.Shipment} shipment - the target Shipment
 * @returns {dw.util.Collection} an array of ShippingModels
 */
function getDealerShippingMethods(shipment) {
    if (!shipment) return null;

    var shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);

    var shippingMethods = shipmentShippingModel.getApplicableShippingMethods();

    // Filter out whatever the method associated with in store pickup
    var filteredMethods = [];
    var methodIDs = [];
    collections.forEach(shippingMethods, function (shippingMethod) {
        if (shippingMethod.custom.isDealerFulfillment) {
            filteredMethods.push(new ShippingMethodModel(shippingMethod, shipment));
            methodIDs.push(shippingMethod.ID);
        }
    });

    return filteredMethods;
}

/**
 * Get Dealer Shipping Method by ID
 *
 * @param {dw.order.Shipment} shipment - shipment object
 * @param {string} methodId - method ID
 * @returns {dw.order.ShippingMethod} - object of shipping method
 */
function getShippingMethodById(shipment, methodId) {
    var method;
    var shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);
    var shippingMethods = shipmentShippingModel.getApplicableShippingMethods();
    for (var i = 0, l = shippingMethods.length; i < l; i++) {
        var shippingMethod = shippingMethods[i];
        if (shippingMethod.custom.isDealerFulfillment && shippingMethod.ID === methodId) {
            method = shippingMethod;
            break;
        }
    }
    return method;
}

/**
 * Get Dealer Shipping Method by ID
 *
 * @param {string} methodId - method ID
 * @returns {dw.order.ShippingMethod} - object of shipping method
 */
function getShippingMethod(methodId) {
    var shippingMethods = ShippingMgr.getAllShippingMethods();
    for (var i = 0, l = shippingMethods.length; i < l; i++) {
        if (shippingMethods[i].ID === methodId) {
            return shippingMethods[i];
        }
    }
    return null;
}

/**
 * Set shipping method to shipment
 *
 * @param {dw.order.Basket} basket - Basket
 * @param {dw.order.Shipment} shipment - Shipment
 * @param {dw.order.ShippingMethod} method - Shipping method
 */
function setShippingMethodToShipment(basket, shipment, method) {
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    Transaction.wrap(function () {
        shipment.setShippingMethod(method);
        basketCalculationHelpers.calculateTotals(basket);
    });
}

/**
 * Set shipping Method
 *
 * @param {Object} fulfillmentData - object with dealer fulfillment data
 * @param {dw.order.Basket} basket - basket object
 */
function setShippingMethod(fulfillmentData, basket) {
    // Choose correct shipping method ID
    var currentMethodId = basket.defaultShipment.shippingMethodID;
    var shipment = basket.defaultShipment;
    var selectedDealerMethodId = '';
    // If no shipping method set or shipping method is not dealer pickup and dealer delivery
    if (!currentMethodId
            || (currentMethodId !== fulfillmentData.deliveryMethodId
            && currentMethodId !== fulfillmentData.pickupMethodId)) {
        if (fulfillmentData.ableToDeliver) {
            selectedDealerMethodId = fulfillmentData.deliveryMethodId; // delivery method
        } else if (fulfillmentData.pickupDealers.length > 0) {
            selectedDealerMethodId = fulfillmentData.pickupMethodId; // pickup method
        } else if (!fulfillmentData.factoryShipping) {
            // Otherwise - set shipping method to null
            setShippingMethodToShipment(basket, shipment, null);
        }
    } else if (currentMethodId === fulfillmentData.deliveryMethodId
                && !fulfillmentData.ableToDeliver
                && fulfillmentData.pickupDealers.length > 0) {
        // if Current method is dealer delivery and dealers are not able to deliver but has pickup
        selectedDealerMethodId = fulfillmentData.pickupMethodId;
    } else if (currentMethodId === fulfillmentData.pickupMethodId
                && fulfillmentData.pickupDealers.length === 0) {
        // If current method is pickup but there is no dealer for it.
        // Set shipping method to NULL
        setShippingMethodToShipment(basket, shipment, null);
        // replace current pickup address with empty address
        Transaction.wrap(function () {
            shipment.createShippingAddress();
        });
        // If factory shipping available and pickup is not available set default shipping method
        if (fulfillmentData.factoryShipping) {
            Transaction.wrap(function () {
                ShippingHelper.ensureShipmentHasMethod(shipment);
            });
        }
    } else {
        // Everything is ok with current shipping method.
        selectedDealerMethodId = currentMethodId;
    }
    // If selected dealer method is not empty and doesn't equal current shipping method
    // we set it to default shipment
    if (selectedDealerMethodId !== '' && selectedDealerMethodId !== currentMethodId) {
        var method = getShippingMethodById(shipment, selectedDealerMethodId);
        setShippingMethodToShipment(basket, shipment, method);
    }
    fulfillmentData.selectedShippingMethod = selectedDealerMethodId; // eslint-disable-line no-param-reassign
}

/**
 * Check if dealer fulfill the order
 * @param {Object} dealer - Dealer Object
 * @param {Object} items - Items Object
 * @returns {boolean} - result flag
 */
function canFulfillOrder(dealer, items) {
    var result = {
        canFulfill: true,
        mtdInventoryRequired: false
    };
    var dealerInventory = {};
    var mtdInventory = {};
    // Getting group dealer inventory by product ID
    dealer.dealerInventory.itemGroup.forEach(function (group) {
        dealerInventory[group.label] = group.items;
    });
    // Getting group MTD inventory by product ID
    dealer.mtddealerInventory.itemGroup.forEach(function (group) {
        mtdInventory[group.label] = group.items;
    });
    for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        var dealerQtyAvailable = 0;
        var mtdQtyAvailable = 0;
        // If item is dealer eligible
        if (item.dealerEligible) {
            // Calculate Dealer Inventory for certain product
            dealerInventory[item.label].forEach(function (inventoryItem) { // eslint-disable-line no-loop-func
                dealerQtyAvailable += inventoryItem.quantity;
            });
            // If MTD can ship to dealer we need to calculate MTD inventory
            if (!item.cannotShipToDealer) {
                mtdInventory[item.label].forEach(function (inventoryItem) { // eslint-disable-line no-loop-func
                    mtdQtyAvailable += inventoryItem.availableQuantity;
                });
            }
        } else {
            // If we have non eligible dealer product just calculate MTD inventory
            mtdInventory[item.label].forEach(function (inventoryItem) { // eslint-disable-line no-loop-func
                mtdQtyAvailable += inventoryItem.availableQuantity;
            });
        }

        // Verify if dealer can fulfill the order or it's required MTD inventory
        if (dealerQtyAvailable < item.quantity) {
            result.mtdInventoryRequired = true;
        }
        var qtyAvailable = dealerQtyAvailable + mtdQtyAvailable;
        if (qtyAvailable < item.quantity) {
            result.canFulfill = false;
            break;
        }
    }

    return result;
}

/**
 * Get Items Object for inventory check
 * @param {dw.order.Basket} basket - Basket Object
 * @returns {Array} - return items object array
 */
function getItemsObject(basket) {
    var items = [];
    collections.forEach(basket.allProductLineItems, function (pli) {
        if (!pli.optionProductLineItem && pli.product) {
            var itemDetailObj = {
                label: pli.productID,
                quantity: pli.quantityValue,
                dealerEligible: pli.product.custom['edealer-eligible'],
                cannotShipToDealer: pli.product.custom['mtd-cannot-ship-to-dealer']
            };
            items.push(itemDetailObj);
        }
    });
    return items;
}

/**
 * Get dealer fulfillment information and handle it
 *
 * @param {dw.order.Basket} basket - basket object
 * @param {string} countryCode - country code
 * @param {string} zipCode - zip/postal code for dealer lookup
 * @returns {Object} - return result object
 */
exports.getFulfillmentData = function (basket, countryCode, zipCode) {
    var fulfillmentData = {
        ableToDeliver: false,
        factoryShipping: true,
        deliveryDealer: [],
        pickupDealers: [],
        selectedShippingMethod: '',
        selectedDeliveryDealer: null,
        selectedPickupDealer: null,
        numberOfVisibleOptions: Util.VALUE.NUMBER_OF_VISIBLE_DEALER_OPTIONS,
        pickupMethodId: Util.VALUE.DEALER_PICKUP_METHOD,
        deliveryMethodId: Util.VALUE.DEALER_DELIVERY_METHOD,
        shippingMethods: getDealerShippingMethods(basket.defaultShipment),
        carbCompliance: false
    };
    try {
        // Get JSON request for Dealer API
        var request = RequestUtil.getFulfillmentRequest(basket, countryCode, zipCode);
        // Make a request to Dealer API
        var result = DealerModel.getFulfillment(request);
        var deliveryDealerIds = [];
        var pickupDealerIds = [];
        var itemsData = getItemsObject(basket);
        // If API return no errors handle response
        if (!result.error) {
            // Get response from Dealer API
            var response = result.getDetail('response');

            // Check if we need to have carb compliance
            if (response.dealerAvailability.origin && 'stateProvinceCode' in response.dealerAvailability.origin) {
                fulfillmentData.carbCompliance = response.dealerAvailability.origin.stateProvinceCode === 'CA';
            }

            // Filter result to JSON result object
            var dealers = response.dealerAvailability.dealerGroup.dealers;
            // Create a list of dealers that can deliver the order
            for (var i = 0, l = dealers.length; i < l; i++) {
                var dealer = dealers[i];
                var checkResults = canFulfillOrder(dealer, itemsData);
                if (checkResults.canFulfill) {
                    dealer.mtdInventoryRequired = checkResults.mtdInventoryRequired;
                    fulfillmentData.pickupDealers.push(dealer);
                    pickupDealerIds.push(dealer.dealerId);
                    if (dealer.ableToDeliver.toUpperCase() === 'YES') {
                        // Verify if any dealer can deliver items
                        fulfillmentData.ableToDeliver = true;
                        // Push dealer data to array
                        deliveryDealerIds.push(dealer.dealerId);
                        fulfillmentData.deliveryDealer.push(dealer);
                    }
                }
            }
            // Verify if factory shipping is available
            fulfillmentData.factoryShipping = !fulfillmentData.ableToDeliver;

            // Check inventory for factory delivery if applicable and no dealers found
            if (fulfillmentData.factoryShipping
                    && (fulfillmentData.pickupDealers.length === 0 || fulfillmentData.deliveryDealer.length === 0)
                    && 'dealerAvailability' in response
                    && 'mtdConsumerInventory' in response.dealerAvailability
                    && 'mtdinventory' in response.dealerAvailability.mtdConsumerInventory) {
                var mtdInventory = [];
                // Getting group MTD inventory by product ID
                response.dealerAvailability.mtdConsumerInventory.mtdinventory.itemGroup.forEach(function (group) {
                    mtdInventory[group.label] = group.items;
                });

                collections.forEach(basket.allProductLineItems, function (productItem) {
                    if (!productItem.optionProductLineItem && productItem.product) {
                        var qtyAvailable = 0;

                        // If we have non eligible dealer product just calculate MTD inventory
                        mtdInventory[productItem.productID].forEach(function (inventoryItem) { // eslint-disable-line no-loop-func
                            qtyAvailable += inventoryItem.availableQuantity;
                        });
                        Transaction.wrap(function () {
                            productItem.custom.mtdQtyAvailable = qtyAvailable; // eslint-disable-line no-param-reassign
                        });
                        if (qtyAvailable < productItem.quantityValue) {
                            fulfillmentData.factoryShipping = false;
                        }
                    }
                });
            }

            // Set delivery and pickup dealers
            var currentMethodId = basket.defaultShipment.shippingMethodID;
            var savedDealerId = basket.defaultShipment.custom.dealerID;
            if (currentMethodId === fulfillmentData.deliveryMethodId
                    && savedDealerId && deliveryDealerIds.indexOf(savedDealerId) >= 0) {
                fulfillmentData.selectedDeliveryDealer = savedDealerId;
            } else if (fulfillmentData.ableToDeliver && deliveryDealerIds.length > 0) {
                fulfillmentData.selectedDeliveryDealer = deliveryDealerIds[0];
            }
            if (currentMethodId === fulfillmentData.pickupMethodId
                    && savedDealerId && pickupDealerIds.indexOf(savedDealerId) >= 0) {
                fulfillmentData.selectedPickupDealer = savedDealerId;
            } else if (fulfillmentData.pickupDealers.length > 0 && pickupDealerIds.length > 0) {
                fulfillmentData.selectedPickupDealer = pickupDealerIds[0];
            }

            // Set correct shipping method
            setShippingMethod(fulfillmentData, basket);
        }
        // If at least one product has dealer required flag - factory shipping is not available
        for (var j = 0, countItems = basket.productLineItems.size(); j < countItems; j++) {
            var pli = basket.productLineItems[j];
            if (pli.product && pli.product.custom['dealer-required']) {
                fulfillmentData.factoryShipping = false;
                break;
            }
        }
    } catch (e) {
        Util.log.error('{0}: {1}', e, e.stack);
    }

    return fulfillmentData;
};

/**
 * Verify basket for dealer fulfillment
 *
 * @param {dw.order.Basket} basket - basket object
 * @returns {Object} - return result object
 */
exports.verifyBasket = function (basket) {
    var result = {
        needToShowDealerLookup: false,
        hasPartsAndAccessories: false
    };
    try {
        // Verify that dealer fulfillment is enabled
        if (!Util.VALUE.ENABLE_DEALER_FULFILLMENT) {
            return result;
        }
        // Verify that at least one product is eligible for Dealer Fulfillment
        for (var i = 0, l = basket.productLineItems.size(); i < l; i++) {
            var pli = basket.allProductLineItems[i];
            if (pli.product) {
                if (pli.product.custom['edealer-eligible']) {
                    result.needToShowDealerLookup = true;
                }
                if (pli.product.custom['edealer-product-type'].value !== 'WG') {
                    result.hasPartsAndAccessories = true;
                }
            }
        }
    } catch (e) {
        Util.log.error('{0}: {1}', e, e.stack);
    }

    return result;
};

/**
 * Get Content Asset Body
 *
 * @param {string} assetId - content asset ID
 * @returns {string} - return body of content asset
 */
exports.getContentAssetBody = function (assetId) {
    var ContentMgr = require('dw/content/ContentMgr');
    var ContentModel = require('*/cartridge/models/content');

    var html = '';
    var asset = ContentMgr.getContent(assetId);
    if (asset && asset.online) {
        var assetModel = new ContentModel(asset);
        html = assetModel.body.markup;
    }
    return html;
};

/**
 * Check Product CARB
 * @param {dw.order.Basket} basket - basket object
 * @returns {array} - list of carbs product data
 */
exports.checkProductCarbs = function (basket) {
    var carbProductData = [];
    // Verify carb
    for (var i = 0, l = basket.productLineItems.size(); i < l; i++) {
        var pli = basket.allProductLineItems[i];
        if (pli.product) {
            if (pli.product.custom['carb-compliant-item-number'] && pli.product.custom['carb-compliant-item-number'] !== pli.product.ID) {
                carbProductData.push({
                    originProductId: pli.product.ID,
                    productId: pli.product.custom['carb-compliant-item-number'],
                    qty: pli.quantityValue
                });
            }
        }
    }
    return carbProductData;
};

/**
 * Verify that product are orderable
 * @param {array} productData - product Data
 * @returns {boolean} - result of check
 */
exports.areProductsOrderable = function (productData) {
    var orderable = false;
    for (var i = 0, l = productData.length; i < l; i++) {
        var data = productData[i];
        var product = ProductMgr.getProduct(data.productId);
        if (product) {
            var isOrderable = product.availabilityModel.isOrderable(data.qty);
            if (!isOrderable) {
                orderable = false;
                break;
            } else {
                orderable = true;
            }
        }
    }
    return orderable;
};

/**
 * Calculate totals of the selected shipping method of the Dealer
 * @param {string} shippingMethod - selected shipping method
 */
exports.calculateTotalForDealerShippingMethod = function (shippingMethod) {
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var dealerHelper = require('*/cartridge/scripts/dealer/dealerHelpers');

    var basket = BasketMgr.getCurrentBasket();
    var shipment = basket.defaultShipment;
    var dealerStoreModel = dealerHelper.getSelectedDealer();
    Transaction.wrap(function () {
        if (dealerStoreModel && shippingMethod === 'dealer-pickup') {
            // Get existing or create new shipping address
            if (!shipment.shippingAddress) {
                shipment.createShippingAddress();
            }

            // Update shipping address by Dealer
            shipment.shippingAddress.setFirstName('Delivery');
            shipment.shippingAddress.setLastName('Pickup');
            shipment.shippingAddress.setAddress1(dealerStoreModel.address1);
            shipment.shippingAddress.setAddress2(dealerStoreModel.address2);
            shipment.shippingAddress.setCity(dealerStoreModel.city);
            shipment.shippingAddress.setPostalCode(dealerStoreModel.postalCode);
            shipment.shippingAddress.setCountryCode(dealerStoreModel.countryCode);
            var formattedDealerPhone = dealerStoreModel.phone.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s/g, '');
            shipment.shippingAddress.setPhone(formattedDealerPhone);
            shipment.shippingAddress.setStateCode(dealerStoreModel.stateCode);

            // Calculate totals
            basketCalculationHelpers.calculateTotals(basket);
        } else {
            // Create a new empty shipping address
            shipment.createShippingAddress();
            // Calculate totals
            basketCalculationHelpers.calculateTotals(basket);
        }
    });
};

/**
 * Update inventory in basket corresponded delaer or drop ship
 * @param {string} previousShippingMethod - previousShippingMethod
 * @param {string} currentShippingMethod - currentShippingMethod
 */
exports.updateInventoryForProductsInBasket = function (previousShippingMethod, currentShippingMethod) {
    var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
    var StoreMgr = require('dw/catalog/StoreMgr');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var dealerHelpers = require('*/cartridge/scripts/dealer/dealerHelpers');

    var needToChangeInventory = false;
    var isPreviousShippingMethodDealer = (previousShippingMethod === 'dealer-pickup' || previousShippingMethod === 'dealer-pickup');
    var isCurrentShippingMethodDealer = (currentShippingMethod === 'dealer-pickup' || currentShippingMethod === 'dealer-pickup');
    if (!empty(previousShippingMethod) && ((isPreviousShippingMethodDealer && !isCurrentShippingMethodDealer) || (!isPreviousShippingMethodDealer && isCurrentShippingMethodDealer))) {
        needToChangeInventory = true;
    }

    // var Logger = require('dw/system/Logger');
    // Logger.error('Need To Change = {0} \n Previous: {1} \n New: {2}', needToChangeInventory, previousShippingMethod, currentShippingMethod);

    if (needToChangeInventory) {
        var dealerId = StoreMgr.getStoreIDFromSession();
        var dealer = StoreMgr.getStore(dealerId);

        var siteInventory = ProductInventoryMgr.getInventoryList();

        // get inventory list IDs
        var autoShipInventoryListID = Site.current.getCustomPreferenceValue('mtdDealerInventoryListID');
        var siteInventoryListID = siteInventory ? siteInventory.ID : null;

        var basket = BasketMgr.getCurrentBasket();
        if (basket) {
            var productLineItems = basket.productLineItems;

            for (var i = 0; i < productLineItems.length; i++) {
                var pli = productLineItems[i];
                var product = pli.product;
                var productInventoryListID = pli.productInventoryListID;

                // don't change inventory for autoship_product
                if (productInventoryListID === autoShipInventoryListID) {
                    continue; // eslint-disable-line
                }

                Transaction.begin();
                if (isCurrentShippingMethodDealer && dealer) {
                    // update pli by inventory from store
                    var storeInventoryResult = dealerHelpers.getDealerAvailability(product, dealer);
                    var storeInventory = storeInventoryResult.inventoryList;
                    if (storeInventory && storeInventory.getRecord(product) && storeInventory.getRecord(pli.productID).ATS.value >= pli.quantityValue) {
                        pli.setProductInventoryList(storeInventoryResult.inventoryList);
                    } else if (productInventoryListID !== siteInventoryListID && siteInventory && siteInventory.getRecord(product) && siteInventory.getRecord(pli.productID).ATS.value >= pli.quantityValue) {
                        // update pli by inventory from site (It's for ship to home)
                        pli.setProductInventoryList(siteInventory);
                    }
                } else if (!isCurrentShippingMethodDealer && productInventoryListID !== siteInventoryListID && siteInventory && siteInventory.getRecord(product) && siteInventory.getRecord(pli.productID).ATS.value >= pli.quantityValue) {
                    // update pli by inventory from site (It's for ship to home)
                    pli.setProductInventoryList(siteInventory);
                }
                Transaction.commit();
            }
        }

        Transaction.wrap(function () {
            // Calculate totals
            basketCalculationHelpers.calculateTotals(basket);
        });
    }
};

/**
 * Reset Shipping address if shipping method is Ship to Home
 * @param {string} shippingMethod - ShippingMethod
 */
exports.resetShippingAddressForm = function (shippingMethod) {
    var basket = BasketMgr.getCurrentBasket();
    var shipment = basket.defaultShipment;
    Transaction.wrap(function () {
        if (shippingMethod !== 'dealer-pickup' || shippingMethod !== 'dealer-delivery') {
            shipment.createShippingAddress();
        }
    });
};

exports.setShippingMethodToShipment = setShippingMethodToShipment;
exports.getShippingMethodById = getShippingMethodById;
exports.getShippingMethod = getShippingMethod;
