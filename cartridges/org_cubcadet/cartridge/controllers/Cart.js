'use strict';

var server = require('server');
server.extend(module.superModule);

var StoreMgr = require('dw/catalog/StoreMgr');

var selectedDealer = require('*/cartridge/scripts/middleware/selectedDealer');

/**
 * Set grand total if it is empty by subtotal
 *
 * @param {Object} viewData Response object
 * @param {dw.order.Basket} currentBasket Basket object
 */
function setGrandTotal(viewData, currentBasket) {
    var formatMoney = require('dw/util/StringUtils').formatMoney;

    if (!currentBasket) {
        return;
    }

    if (!currentBasket.totalGrossPrice.available && currentBasket.totalNetPrice.available) {
        viewData.totals.grandTotal = formatMoney(currentBasket.totalNetPrice); // eslint-disable-line no-param-reassign
    }
}

server.append('Show', selectedDealer.check, function (req, res, next) {
    var Site = require('dw/system/Site');
    var BasketMgr = require('dw/order/BasketMgr');
    var URLUtils = require('dw/web/URLUtils');
    var currentBasket = BasketMgr.getCurrentBasket();
    var isShowDealerSection = false;
    var shipment;
    var deliverymethod;

    if (currentBasket) {
        shipment = currentBasket.getDefaultShipment();
        deliverymethod = shipment.getShippingMethod();
        if (deliverymethod) {
            var currentShippingMethod = deliverymethod.ID;
            if (currentShippingMethod === 'dealer-pickup' || currentShippingMethod === 'dealer-delivery') {
                isShowDealerSection = true;
            }
        }
    }

    var addToCartUrl = URLUtils.url('Cart-AddProduct');

    var viewData = res.getViewData();
    viewData.seeDetails = Site.getCurrent().getCustomPreferenceValue('see-details-link');
    viewData.ewEnabled = Site.getCurrent().getCustomPreferenceValue('enableEWNewSales');
    viewData.isShowDealerSection = isShowDealerSection;
    viewData.addToCartUrl = addToCartUrl;
    var CARBCompliantItemInCart;
    for each(var item in viewData.items){
        if(item.CARBCompliantItem){
            CARBCompliantItemInCart = true;
            break;
        }
    }
    viewData.CARBCompliantItemInCart = CARBCompliantItemInCart ? CARBCompliantItemInCart : false;
    if(!empty(shipment)){
        viewData.shippingAddress = shipment.shippingAddress;
    }
    res.setViewData(viewData);
    next();
});

server.replace('AddProduct', function (req, res, next) {
    var Site = require('dw/system/Site');
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    var CartModel = require('*/cartridge/models/cart');
    var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var collections = require('*/cartridge/scripts/util/collections');

    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var previousBonusDiscountLineItems = currentBasket.getBonusDiscountLineItems();
    var productId = req.form.pid;
    var isARIRequest = req.form.ari === '1';
    var childProducts = Object.hasOwnProperty.call(req.form, 'childProducts')
        ? JSON.parse(req.form.childProducts)
        : [];
    var options = req.form.options ? JSON.parse(req.form.options) : [];
    var quantity;
    var result;
    var pidsObj;

    var ewEnabled = Site.getCurrent().getCustomPreferenceValue('enableEWNewSales');

    var parameters = {};
    if (req.form.dealerShippingMethod) {
        parameters.dealerShippingMethod = req.form.dealerShippingMethod;
    }

    parameters.canChangeShippingMethod = (req.form.area !== 'search');

    // Check if delivery zipcode exists in session for dealer delivery shipping method
    var currentShippingMethodId;
    if (currentBasket) {
        currentShippingMethodId = currentBasket.defaultShipment.shippingMethodID;
    }
    if ((parameters.dealerShippingMethod && parameters.dealerShippingMethod === 'dealer-delivery')
        || (!parameters.dealerShippingMethod && currentShippingMethodId === 'dealer-delivery')) {
        var dealerHelpers = require('*/cartridge/scripts/dealer/dealerHelpers');
        var deliveryZipCode = dealerHelpers.getDeliveryZipCode();
        if (!deliveryZipCode) {
            res.json({
                needUpdateDeliveryZipCode: true
            });
            next();
            return;
        }
    }

    if (currentBasket) {
        Transaction.wrap(function () {
            if (!req.form.pidsObj) {
                quantity = parseInt(req.form.quantity, 10);
                result = cartHelper.addProductToCart(
                    currentBasket,
                    productId,
                    quantity,
                    childProducts,
                    options,
                    isARIRequest,
                    parameters
                );
            } else {
                // product set
                pidsObj = JSON.parse(req.form.pidsObj);
                result = {
                    error: false,
                    message: Resource.msg('text.alert.addedtobasket', 'product', null)
                };

                pidsObj.forEach(function (PIDObj) {
                    quantity = parseInt(PIDObj.qty, 10);
                    var pidOptions = PIDObj.options ? JSON.parse(PIDObj.options) : {};
                    var PIDObjResult = cartHelper.addProductToCart(
                        currentBasket,
                        PIDObj.pid,
                        quantity,
                        childProducts,
                        pidOptions,
                        false,
                        parameters
                    );
                    if (PIDObjResult.error) {
                        result.error = PIDObjResult.error;
                        result.message = PIDObjResult.message;
                    }
                });
            }
            if (!result.error) {
                cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
                basketCalculationHelpers.calculateTotals(currentBasket);
            }

            var isExtendedWarranty = ProductMgr.getProduct(productId).getCustom()['product-type'].value === 'ExtendedWarranty';
            if (isExtendedWarranty && req.form.warrantyParentPid && req.form.warrantyParentProductName && ewEnabled) {
                var parentProductLineItem = collections.find(currentBasket.allProductLineItems, function (item) {
                    return item.productID === req.form.warrantyParentPid;
                });

                for (var p = 0; p < currentBasket.allProductLineItems.length; p++) {
                    if (currentBasket.allProductLineItems[p].productID === productId) {
                        currentBasket.allProductLineItems[p].custom['ew-type'] = 'EW_NEW';
                        currentBasket.allProductLineItems[p].custom['ew-new-factory-number'] = req.form.warrantyParentPid;
                        currentBasket.allProductLineItems[p].custom['ew-productName'] = req.form.warrantyParentProductName;
                        
                        if (parentProductLineItem.quantity.value !== currentBasket.allProductLineItems[p].quantity.value) {
                            currentBasket.allProductLineItems[p].setQuantityValue(parentProductLineItem.quantity.value);
                        }
                    }
                }
            }

            if (!isExtendedWarranty && ewEnabled) {
                var relatedWarrantyLineItem = cartHelper.getRelatedWarranty(productId, currentBasket.allProductLineItems);
                var addedProductLineItem = collections.find(currentBasket.allProductLineItems, function (item) {
                    return item.productID === productId;
                });

                if (relatedWarrantyLineItem && relatedWarrantyLineItem.quantity.value !== addedProductLineItem.quantity.value) {
                    relatedWarrantyLineItem.setQuantityValue(addedProductLineItem.quantity.value);
                }
            }


        });
    }

    var quantityTotal = ProductLineItemsModel.getTotalQuantity(currentBasket.productLineItems);
    var cartModel = new CartModel(currentBasket);

    var urlObject = {
        url: URLUtils.url('Cart-ChooseBonusProducts').toString(),
        configureProductstUrl: URLUtils.url('Product-ShowBonusProducts').toString(),
        addToCartUrl: URLUtils.url('Cart-AddBonusProducts').toString()
    };

    var newBonusDiscountLineItem =
        cartHelper.getNewBonusDiscountLineItem(
            currentBasket,
            previousBonusDiscountLineItems,
            urlObject,
            result.uuid
    );
    if (newBonusDiscountLineItem) {
        var allLineItems = currentBasket.allProductLineItems;
        var collections = require('*/cartridge/scripts/util/collections');
        collections.forEach(allLineItems, function (pli) {
            if (pli.UUID === result.uuid) {
                Transaction.wrap(function () {
                    pli.custom.bonusProductLineItemUUID = 'bonus'; // eslint-disable-line no-param-reassign
                    pli.custom.preOrderUUID = pli.UUID; // eslint-disable-line no-param-reassign
                });
            }
        });
    }

    // Adding warranty parent-child pli attribute 
    var parentId = req.form.parentPid != undefined ? req.form.parentPid : '';
    if (parentId != '' && ewEnabled) {
        var allLineItems = currentBasket.allProductLineItems;
        var collections = require('*/cartridge/scripts/util/collections');
        collections.forEach(allLineItems, function (pli) {
            if (pli.productID === parentId) {
                Transaction.wrap(function () {
                    pli.custom.ewlinkedWarranty = productId; // eslint-disable-line no-param-reassign
                });
            }

            if (pli.productID === productId) {
                Transaction.wrap(function () {
                    pli.custom.ewlinkedWarranty = parentId; // eslint-disable-line no-param-reassign
                });
            }

        });

    }
    var isExistExtendedWarranty;
    var warrantyUrl;

    if(ewEnabled){
        var isExistExtendedWarranty = ProductMgr.getProduct(productId).getOrderableRecommendations(4).length > 0;
        var warrantyUrl = URLUtils.url('Product-ShowExtendedWarranty', 'pid', productId).relative().toString();
        res.json({
            quantityTotal: quantityTotal,
            message: result.message,
            cart: cartModel,
            newBonusDiscountLineItem: newBonusDiscountLineItem || {},
            error: result.error,
            pliUUID: result.uuid,
            isExistExtendedWarranty: isExistExtendedWarranty,
            urls: {
                warranty: warrantyUrl
            },
            ZTRInCart : session.custom.ZTRInCart ? session.custom.ZTRInCart : null
        });
    } else {
        res.json({
            quantityTotal: quantityTotal,
            message: result.message,
            cart: cartModel,
            newBonusDiscountLineItem: newBonusDiscountLineItem || {},
            error: result.error,
            pliUUID: result.uuid,
            ZTRInCart : session.custom.ZTRInCart ? session.custom.ZTRInCart : null
        });
    }

    next();
});

server.replace('UpdateQuantity', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var CartModel = require('*/cartridge/models/cart');
    var collections = require('*/cartridge/scripts/util/collections');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    var defaultShipment = currentBasket.defaultShipment;
    var currentShippingMethodId = defaultShipment.shippingMethodID;

    var productId = req.querystring.pid;
    var updateQuantity = parseInt(req.querystring.quantity, 10);
    var uuid = req.querystring.uuid;
    var productLineItems = currentBasket.productLineItems;
    var matchingLineItem = collections.find(productLineItems, function (item) {
        return item.productID === productId && item.UUID === uuid;
    });
    var availableToSell = 0;

    var totalQtyRequested = 0;
    var qtyAlreadyInCart = 0;
    var minOrderQuantity = 0;
    var canBeUpdated = false;
    var isPerpetual = false;
    var bundleItems;
    var bonusDiscountLineItemCount = currentBasket.bonusDiscountLineItems.length;

    if (matchingLineItem) {
        if (currentShippingMethodId === 'dealer-pickup' || currentShippingMethodId === 'dealer-delivery') {
            var dealerHelpers = require('*/cartridge/scripts/dealer/dealerHelpers');
            var dealerId = StoreMgr.getStoreIDFromSession();
            var dealer = StoreMgr.getStore(dealerId);
            if (dealer) {
                if (matchingLineItem.product.bundle) {
                    bundleItems = matchingLineItem.bundledProductLineItems;
                    canBeUpdated = collections.every(bundleItems, function (item) {
                        var quantityToUpdate = updateQuantity *
                            matchingLineItem.product.getBundledProductQuantity(item.product).value;
                        qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
                            item.productID,
                            productLineItems,
                            item.UUID
                        );
                        totalQtyRequested = quantityToUpdate + qtyAlreadyInCart;

                        var bundleItemStoreInventory = item.getProductInventoryList();
                        var currentItemCanBeUpdated = false;
                        if (bundleItemStoreInventory) {
                            var bundleItemInventoryRecord = bundleItemStoreInventory.getRecord(item.productID);
                            isPerpetual = bundleItemInventoryRecord && bundleItemInventoryRecord.perpetual;
                            if (dealerHelpers.isAutoShippedProduct(item.product)) {
                                currentItemCanBeUpdated = (isPerpetual || (bundleItemInventoryRecord
                                    && bundleItemInventoryRecord.allocation.value >= totalQtyRequested));
                            } else {
                                currentItemCanBeUpdated = (isPerpetual || (bundleItemInventoryRecord
                                    && bundleItemInventoryRecord.ATS.value >= totalQtyRequested));
                            }
                        } else {
                            currentItemCanBeUpdated = false;
                        }
                        return currentItemCanBeUpdated;
                    });
                } else {
                    qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
                        productId,
                        productLineItems,
                        matchingLineItem.UUID
                    );
                    totalQtyRequested = updateQuantity + qtyAlreadyInCart;

                    var itemStoreInventory = matchingLineItem.getProductInventoryList();
                    if (itemStoreInventory) {
                        var itemInventoryRecord = itemStoreInventory.getRecord(matchingLineItem.productID);
                        isPerpetual = itemInventoryRecord && itemInventoryRecord.perpetual;
                        if (dealerHelpers.isAutoShippedProduct(matchingLineItem.product)) {
                            canBeUpdated = (isPerpetual || (itemInventoryRecord
                                && itemInventoryRecord.allocation.value >= totalQtyRequested));
                        } else {
                            canBeUpdated = (isPerpetual || (itemInventoryRecord
                                && itemInventoryRecord.ATS.value >= totalQtyRequested));
                        }
                    }
                }
            }
        } else {
            if (matchingLineItem.product.bundle) { // eslint-disable-line
                bundleItems = matchingLineItem.bundledProductLineItems;
                canBeUpdated = collections.every(bundleItems, function (item) {
                    var quantityToUpdate = updateQuantity *
                        matchingLineItem.product.getBundledProductQuantity(item.product).value;
                    qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
                        item.productID,
                        productLineItems,
                        item.UUID
                    );
                    totalQtyRequested = quantityToUpdate + qtyAlreadyInCart;
                    isPerpetual = item.product.availabilityModel.inventoryRecord.perpetual;
                    availableToSell = item.product.availabilityModel.inventoryRecord.ATS.value;
                    minOrderQuantity = item.product.minOrderQuantity.value;
                    return (totalQtyRequested <= availableToSell || isPerpetual) &&
                        (quantityToUpdate >= minOrderQuantity);
                });
            } else {
                isPerpetual = matchingLineItem.product.availabilityModel.inventoryRecord.perpetual;
                availableToSell = matchingLineItem.product.availabilityModel.inventoryRecord.ATS.value;
                qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
                    productId,
                    productLineItems,
                    matchingLineItem.UUID
                );
                totalQtyRequested = updateQuantity + qtyAlreadyInCart;
                minOrderQuantity = matchingLineItem.product.minOrderQuantity.value;
                canBeUpdated = (totalQtyRequested <= availableToSell || isPerpetual) &&
                    (updateQuantity >= minOrderQuantity);
            }
        }
    }

    if (canBeUpdated) {
        var relatedWarrantyLineItem = cartHelper.getRelatedWarranty(productId, productLineItems);

        Transaction.wrap(function () {
            matchingLineItem.setQuantityValue(updateQuantity);

            if (relatedWarrantyLineItem) {
                relatedWarrantyLineItem.setQuantityValue(updateQuantity);
            }

            var previousBounsDiscountLineItems = collections.map(currentBasket.bonusDiscountLineItems, function (bonusDiscountLineItem) {
                return bonusDiscountLineItem.UUID;
            });

            basketCalculationHelpers.calculateTotals(currentBasket);
            if (currentBasket.bonusDiscountLineItems.length > bonusDiscountLineItemCount) {
                var prevItems = JSON.stringify(previousBounsDiscountLineItems);

                collections.forEach(currentBasket.bonusDiscountLineItems, function (bonusDiscountLineItem) {
                    if (prevItems.indexOf(bonusDiscountLineItem.UUID) < 0) {
                        bonusDiscountLineItem.custom.bonusProductLineItemUUID = matchingLineItem.UUID; // eslint-disable-line no-param-reassign
                        matchingLineItem.custom.bonusProductLineItemUUID = 'bonus';
                        matchingLineItem.custom.preOrderUUID = matchingLineItem.UUID;
                    }
                });
            }
        });
    }

    if (matchingLineItem && canBeUpdated) {
        var basketModel = new CartModel(currentBasket);
        setGrandTotal(basketModel, currentBasket);
        res.json(basketModel);
    } else {
        res.setStatusCode(500);
        res.json({
            errorMessage: Resource.msg('error.cannot.update.product.quantity', 'cart', null)
        });
    }

    return next();
});

server.prepend('RemoveProductLineItem', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    cartHelper.removeExtendedWarranty(req.querystring.pid);
    var viewData = res.getViewData();
    viewData.cartShowUrl = URLUtils.abs('Cart-Show').toString(),
    next();
});

server.append('RemoveProductLineItem', function (req, res, next) {
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');

    cartHelper.removeShippingMethodIfBasketIsEmpty();
    cartHelper.updateShippingMethodAfterRemovingItem();

    next();
});

server.append('EditProductLineItem', function (req, res, next) {
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');

    cartHelper.removeShippingMethodIfBasketIsEmpty();

    next();
});

module.exports = server.exports();
