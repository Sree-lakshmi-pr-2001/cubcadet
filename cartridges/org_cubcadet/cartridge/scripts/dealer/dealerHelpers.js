'use strict';
/* global session, empty */

var ContentMgr = require('dw/content/ContentMgr');
var StoreMgr = require('dw/catalog/StoreMgr');
var Site = require('dw/system/Site');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var Transaction = require('dw/system/Transaction');

/**
 * Set delivery zip code
 * @param {string} zipCode - zip code
 */
function setDeliveryZipCode(zipCode) {
    var countrySitePref = Site.getCurrent().getCustomPreferenceValue('countryCode');
    var countryCode = 'value' in countrySitePref ? countrySitePref.value : 'US';
    if (countryCode === 'CA') {
        if (zipCode && zipCode.length >= 6) {
            session.custom.deliveryZipCode = zipCode;
        }
    } else {
        session.custom.deliveryZipCode = zipCode;
    }
}

/**
 * Get delivery zip code
 * @returns {string} zip code
 */
function getDeliveryZipCode() {
    return session.custom.deliveryZipCode;
}

/**
 * Check availability in dealer inventory list
 * @param {dw.catalog.Product} product we check
 * @param {dw.catalog.Store} store we check
 * @returns {Object} availability
 */
function getDealerAvailability(product, store) {
    var availability;
    var inventoryList = store.getInventoryList();
    if (inventoryList) {
        availability = product.getAvailabilityModel(inventoryList);
    }
    var result = {
        inventoryList: inventoryList,
        availability: availability,
        isStoreInventory: true
    };
    return result;
}

/**
 * Check availability AutoShip inventory list
 * @param {dw.catalog.Product} product we check
 * @returns {Object} availability
 */
function getAutoShipAvailability(product) {
    var availability;
    var MTDinventoryList;
    var MTDinventoryListName = Site.current.getCustomPreferenceValue('mtdDealerInventoryListID');
    if (MTDinventoryListName) {
        MTDinventoryList = ProductInventoryMgr.getInventoryList(MTDinventoryListName);
        if (MTDinventoryList) {
            availability = product.getAvailabilityModel(MTDinventoryList);
        }
    }
    var result = {
        inventoryList: MTDinventoryList,
        availability: availability,
        isAutoShipInventory: true
    };
    return result;
}

/**
 *  Check if current product is auto-ship or parts and accessories
 * @param {dw.catalog.Product} product - product
 * @returns {Object} result
 * */
function isAutoShippedProduct(product) {
    var result = false;
    if (product.custom['edealer-product-type'].value === 'PT_ACC' || product.custom['edealer-product-type'].value === 'AUTO_WG') {
        result = true;
    }

    return result;
}

/**
 *  Get Selected Dealer Model
 * @returns {Object} result
 * */
function getSelectedDealer() {
    var dealerStoreModel = null;
    var selectedDealer = StoreMgr.getStoreIDFromSession();
    if (selectedDealer) {
        var StoreModel = require('*/cartridge/models/store');
        var dealer = StoreMgr.getStore(selectedDealer);
        dealerStoreModel = new StoreModel(dealer);
    }

    return dealerStoreModel;
}

/**
 *  Get Selected Dealer View Data
 * @returns {Object} result
 * */
function getDealerSelectorModalViewData() {
    var result = {};
    var storeSearchAddressErrorAsset = ContentMgr.getContent('store-search-address-error');
    var storeSearchAddressErrorMessage = (storeSearchAddressErrorAsset) ? storeSearchAddressErrorAsset.custom.body.markup : '';
    result.storeSearchAddressErrorMessage = storeSearchAddressErrorMessage;

    return result;
}

/**
 * Checks for basket has wholegood product
 * @param {dw.order.LineItemCtnr} lineItemCtnr - lineItemCtnr
 * @returns {boolean} wholegood avilability
 */
function checkWholeGoodDelivery(lineItemCtnr) {
    var items = lineItemCtnr.getProductLineItems().iterator();
    while (items.hasNext()) {
        var item = items.next();
        var isWholeGood = item.getProduct().custom['product-type'] == 'WholeGood'; // eslint-disable-line
        if (isWholeGood) {
            return true;
        }
    }
    return false;
}

/**
 * Searches for stores by inventory and delivery method
 * @param {dw.order.LineItemCtnr} lineItemCtnr - lineItemCtnr
 * @returns {string} content asset with estimated text
 */
function getDealerDeliveryMethodEstimate(lineItemCtnr) {
    var bsHelper = require('org_mtd_ma/cartridge/scripts/utils/ButtonStateHelper');

    var estimatedDeliveryTimeContent = '';

    var currentBasket = lineItemCtnr;
    var dealerId = lineItemCtnr.custom.dealer_id;

    var store = StoreMgr.getStore(dealerId);

    var shippingMethodId = null;
    var shipment = currentBasket.getDefaultShipment();
    if (shipment) {
        shippingMethodId = shipment.getShippingMethodID();
    }

    var productLineItems = currentBasket.getAllProductLineItems();
    if (productLineItems && productLineItems.length > 0) {
        var firstProductLineItem = productLineItems[0];

        var productId = firstProductLineItem.productID;

        var stateResult = bsHelper.getDeliveryStates(store, productId, 1, true, false);
        if (!empty(shippingMethodId) && shippingMethodId === 'dealer-delivery') {
            estimatedDeliveryTimeContent = stateResult.dealerDeliveryTime;
        } else if (!empty(shippingMethodId) && shippingMethodId === 'dealer-pickup') {
            estimatedDeliveryTimeContent = stateResult.pickUpTime;
        } else {
            estimatedDeliveryTimeContent = stateResult.shiptoHomeTime;
        }
    }

    var estimatedDeliveryTimeAsset = ContentMgr.getContent(estimatedDeliveryTimeContent);
    var estimatedDeliveryTime = (estimatedDeliveryTimeAsset) ? estimatedDeliveryTimeAsset.custom.body.markup : '';

    return estimatedDeliveryTime;
}

/**
 * Check availability in dealer inventory list for simple product
 * @param {Cart} basket we check
 * @param {Store} dealer we check
 * @param {dw.catalog.Product} extraProduct we check
 * @param {number} extraProductQuantity we check
 * @returns {boolean} availability
 */
function selectedDealerHasAllOrderableProductsForSimpleProduct(basket, dealer, extraProduct, extraProductQuantity) {
    var safeProductQuantity = extraProductQuantity || 1;
    var isProductChecked = false;
    var storeInventory = null;
    var storeInventoryResult = null;
    var productAvailability = null;
    var inventoryRecord = null;
    var perpetual = null;
    var product = null;
    var quantity = null;
    var canBeAdded = true;

    if (basket) {
        var items = basket.getProductLineItems().iterator();
        while (items.hasNext()) {
            var item = items.next();
            product = item.product;
            quantity = item.quantity.value;

            if (isAutoShippedProduct(product)) {
                storeInventoryResult = getAutoShipAvailability(product);
            } else {
                storeInventoryResult = getDealerAvailability(product, dealer);
            }

            storeInventory = storeInventoryResult.inventoryList;
            productAvailability = storeInventoryResult.availability;

            if (extraProduct && extraProduct.ID === product.ID) {
                quantity = quantity + safeProductQuantity; // eslint-disable-line
                isProductChecked = true;
            }

            // Check if product in store inventory or in autoship inventory
            if (storeInventory && productAvailability && storeInventory.getRecord(product)) {
                inventoryRecord = storeInventory.getRecord(product);
                perpetual = inventoryRecord.perpetual;
                if (storeInventoryResult.isAutoShipInventory) {
                    canBeAdded = (perpetual || productAvailability.isOrderable(quantity));
                } else if (storeInventoryResult.isStoreInventory) {
                    canBeAdded = (perpetual || productAvailability.isOrderable(quantity));
                }

                if (!canBeAdded) {
                    // Check from the site inventory
                    if (product.availabilityModel && product.availabilityModel.inventoryRecord) { // eslint-disable-line
                        perpetual = product.availabilityModel.inventoryRecord.perpetual;
                        canBeAdded = (perpetual || quantity <= product.availabilityModel.inventoryRecord.ATS.value);
                    } else {
                        canBeAdded = false;
                    }
                }
            } else {
                // Check from the site inventory
                if (product.availabilityModel && product.availabilityModel.inventoryRecord) { // eslint-disable-line
                    perpetual = product.availabilityModel.inventoryRecord.perpetual;
                    canBeAdded = (perpetual || quantity <= product.availabilityModel.inventoryRecord.ATS.value);
                } else {
                    canBeAdded = false;
                }
            }

            if (!canBeAdded) {
                return false;
            }
        }
    }


    if (extraProduct && !isProductChecked) {
        product = extraProduct;
        quantity = safeProductQuantity;

        if (isAutoShippedProduct(product)) {
            storeInventoryResult = getAutoShipAvailability(product);
        } else {
            storeInventoryResult = getDealerAvailability(product, dealer);
        }

        storeInventory = storeInventoryResult.inventoryList;
        productAvailability = storeInventoryResult.availability;

        // Check if product in store inventory or in autoship inventory
        if (storeInventory && productAvailability && storeInventory.getRecord(product)) {
            inventoryRecord = storeInventory.getRecord(product);
            perpetual = inventoryRecord.perpetual;
            if (storeInventoryResult.isAutoShipInventory) {
                canBeAdded = (perpetual || productAvailability.isOrderable(quantity));
            } else if (storeInventoryResult.isStoreInventory) {
                canBeAdded = (perpetual || productAvailability.isOrderable(quantity));
            }

            if (!canBeAdded) {
                // Check from the site inventory
                if (product.availabilityModel && product.availabilityModel.inventoryRecord) {
                    perpetual = product.availabilityModel.inventoryRecord.perpetual;
                    canBeAdded = (perpetual || quantity <= product.availabilityModel.inventoryRecord.ATS.value);
                } else {
                    canBeAdded = false;
                }
            }
        } else {
            // Check from the site inventory
            if (product.availabilityModel && product.availabilityModel.inventoryRecord) { // eslint-disable-line
                perpetual = product.availabilityModel.inventoryRecord.perpetual;
                canBeAdded = (perpetual || quantity <= product.availabilityModel.inventoryRecord.ATS.value);
            } else {
                canBeAdded = false;
            }
        }
    }

    return canBeAdded;
}

/**
 * Check availability in dealer inventory list for product set
 * @param {Cart} basket we check
 * @param {Store} dealer we check
 * @param {dw.catalog.Product} extraProduct we check
 * @param {number} extraProductQuantity we check
 * @returns {boolean} availability
 */
function selectedDealerHasAllOrderableProductsForProductSet(basket, dealer, extraProduct, extraProductQuantity) {
    var canBeAdded = true;
    if (extraProduct) {
        var childProducts = extraProduct.bundledProducts;
        for (var i = 0; i < childProducts.length; i++) {
            var childProduct = childProducts[i];
            canBeAdded = selectedDealerHasAllOrderableProductsForSimpleProduct(basket, dealer, childProduct, extraProductQuantity);
            if (!canBeAdded) {
                break;
            }
        }
    }
    return canBeAdded;
}

/**
 * Check availability in dealer inventory list
 * @param {Cart} basket we check
 * @param {Store} dealer we check
 * @param {dw.catalog.Product} extraProduct we check
 * @param {number} extraProductQuantity we check
 * @returns {boolean} availability
 */
function selectedDealerHasAllOrderableProducts(basket, dealer, extraProduct, extraProductQuantity) {
    var canBeAdded = true;
    if (extraProduct) {
        if (extraProduct.productSet) {
            canBeAdded = selectedDealerHasAllOrderableProductsForProductSet(basket, dealer, extraProduct, extraProductQuantity);
        } else {
            canBeAdded = selectedDealerHasAllOrderableProductsForSimpleProduct(basket, dealer, extraProduct, extraProductQuantity);
        }
    }
    return canBeAdded;
}

/**
 * Update inventory for each product line item in basket for a new Dealer
 * @param {Cart} basket we check
 * @param {Store} dealer we check
 */
function updateBasketInventoryForDealer(basket, dealer) {
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    if (basket && basket.defaultShipment && !empty(basket.defaultShipment.shippingMethodID)) {
        var productLineItems = basket.productLineItems;
        var shippingMethod = basket.defaultShipment.shippingMethodID;
        var isDealerShipping = (shippingMethod === 'dealer-delivery' || shippingMethod === 'dealer-pickup');

        var siteInventory = ProductInventoryMgr.getInventoryList();

        // get inventory list IDs
        var autoShipInventoryListID = Site.current.getCustomPreferenceValue('mtdDealerInventoryListID');
        var siteInventoryListID = siteInventory ? siteInventory.ID : null;

        for (var i = 0; i < productLineItems.length; i++) {
            var pli = productLineItems[i];
            var product = pli.product;
            var productInventoryListID = pli.productInventoryListID;

            // don't change inventory for autoship_product
            if (productInventoryListID === autoShipInventoryListID) {
                continue; // eslint-disable-line
            }

            Transaction.begin();
            if (isDealerShipping) {
                // update pli by inventory from store
                var storeInventoryResult = getDealerAvailability(product, dealer);
                var storeInventory = storeInventoryResult.inventoryList;
                if (storeInventory && storeInventory.getRecord(product) && storeInventory.getRecord(pli.productID).ATS.value >= pli.quantityValue) {
                    pli.setProductInventoryList(storeInventoryResult.inventoryList);
                } else if (productInventoryListID !== siteInventoryListID && siteInventory && siteInventory.getRecord(product) && siteInventory.getRecord(pli.productID).ATS.value >= pli.quantityValue) {
                    // update pli by inventory from site (It's for ship to home)
                    pli.setProductInventoryList(siteInventory);
                }
            } else if (!isDealerShipping && productInventoryListID !== siteInventoryListID && siteInventory && siteInventory.getRecord(product) && siteInventory.getRecord(pli.productID).ATS.value >= pli.quantityValue) {
                // update pli by inventory from site (It's for ship to home)
                pli.setProductInventoryList(siteInventory);
            }
            Transaction.commit();
        }

        Transaction.wrap(function () {
            // Calculate totals
            basketCalculationHelpers.calculateTotals(basket);
        });
    }
}

module.exports.getSelectedDealer = getSelectedDealer;
module.exports.isAutoShippedProduct = isAutoShippedProduct;
module.exports.getDealerSelectorModalViewData = getDealerSelectorModalViewData;
module.exports.getDealerDeliveryMethodEstimate = getDealerDeliveryMethodEstimate;
module.exports.checkWholeGoodDelivery = checkWholeGoodDelivery;
module.exports.getDealerAvailability = getDealerAvailability;
module.exports.getAutoShipAvailability = getAutoShipAvailability;
module.exports.getDeliveryZipCode = getDeliveryZipCode;
module.exports.setDeliveryZipCode = setDeliveryZipCode;
module.exports.selectedDealerHasAllOrderableProducts = selectedDealerHasAllOrderableProducts;
module.exports.updateBasketInventoryForDealer = updateBasketInventoryForDealer;

