'use strict';

var collections = require('*/cartridge/scripts/util/collections');

var ShippingMgr = require('dw/order/ShippingMgr');
var ArrayList = require('dw/util/ArrayList');

var ShippingModel = require('*/cartridge/models/shipping');

var ShippingMethodModel = require('*/cartridge/models/shipping/shippingMethod');


// Public (class) static model functions

/**
 * Plain JS object that represents a DW Script API dw.order.ShippingMethod object
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {Object} customer - the associated Customer Model object
 * @param {string} containerView - view of the shipping models (order or basket)
 * @returns {dw.util.ArrayList} an array of ShippingModels
 */
function getShippingModels(currentBasket, customer, containerView) {
    var shipments = currentBasket ? currentBasket.getShipments() : null;

    if (!shipments) return [];

    return collections.map(shipments, function (shipment) {
        return new ShippingModel(shipment, null, customer, containerView);
    });
}

/**
 * Retrieve raw address JSON object from request.form
 * @param {Request} req - the DW Request object
 * @returns {Object} - raw JSON representing address form data
 */
function getAddressFromRequest(req) {
    return {
        firstName: req.form.firstName,
        lastName: req.form.lastName,
        address1: req.form.address1,
        address2: req.form.address2,
        city: req.form.city,
        stateCode: req.form.stateCode,
        postalCode: req.form.postalCode,
        countryCode: req.form.countryCode,
        phone: req.form.phone
    };
}

/**
 * Returns the first shipping method (and maybe prevent in store pickup)
 * @param {dw.util.Collection} methods - Applicable methods from ShippingShipmentModel
 * @param {boolean} filterPickupInStore - whether to exclude PUIS method
 * @returns {dw.order.ShippingMethod} - the first shipping method (maybe non-PUIS)
 */
function getFirstApplicableShippingMethod(methods, filterPickupInStore) {
    var method;
    var iterator = methods.iterator();
    while (iterator.hasNext()) {
        method = iterator.next();
        if (!filterPickupInStore || (filterPickupInStore && !method.custom.storePickupEnabled)) {
            break;
        }
    }

    return method;
}

/**
 * Sets the shipping method of the basket's default shipment
 * @param {dw.order.Shipment} shipment - Any shipment for the current basket
 * @param {string} shippingMethodID - The shipping method ID of the desired shipping method
 * @param {dw.util.Collection} shippingMethods - List of applicable shipping methods
 * @param {Object} address - the address
 */
function selectShippingMethod(shipment, shippingMethodID, shippingMethods, address) {
    var applicableShippingMethods;
    var defaultShippingMethod = ShippingMgr.getDefaultShippingMethod();
    var shippingAddress;

    if (address && shipment) {
        shippingAddress = shipment.shippingAddress;

        if (shippingAddress) {
            if (address.stateCode && shippingAddress.stateCode !== address.stateCode) {
                shippingAddress.stateCode = address.stateCode;
            }
            if (address.postalCode && shippingAddress.postalCode !== address.postalCode) {
                shippingAddress.postalCode = address.postalCode;
            }
        }
    }

    var isShipmentSet = false;

    if (shippingMethods) {
        applicableShippingMethods = shippingMethods;
    } else {
        var shipmentModel = ShippingMgr.getShipmentShippingModel(shipment);
        applicableShippingMethods = address ? shipmentModel.getApplicableShippingMethods(address) :
            shipmentModel.applicableShippingMethods;
    }

    if (shippingMethodID) {
        // loop through the shipping methods to get shipping method
        var iterator = applicableShippingMethods.iterator();
        while (iterator.hasNext()) {
            var shippingMethod = iterator.next();
            if (shippingMethod.ID === shippingMethodID) {
                shipment.setShippingMethod(shippingMethod);
                isShipmentSet = true;
                break;
            }
        }
    }

    if (!isShipmentSet) {
        if (collections.find(applicableShippingMethods, function (sMethod) {
            return sMethod.ID === defaultShippingMethod.ID;
        })) {
            shipment.setShippingMethod(defaultShippingMethod);
        } else if (applicableShippingMethods.length > 0) {
            var firstMethod = getFirstApplicableShippingMethod(applicableShippingMethods, true);
            shipment.setShippingMethod(firstMethod);
        } else {
            shipment.setShippingMethod(null);
        }
    }
}

/**
 * Check if we have mixed shipment
 *
 * @param {dw.order.Shipment} shipment Shipment Object
 * @returns {boolean} flag of mixed cart
 */
function isMixedShipment(shipment) {
    var hasLTLShipment = false;
    var hasNonLTLShipment = false;
    collections.forEach(shipment.productLineItems, function (productLineItem) {
        if (productLineItem.bundledProductLineItems.size() > 0) {
            collections.forEach(productLineItem.bundledProductLineItems, function (bundledProductLineItem) {
                if (bundledProductLineItem.product.custom['ltl-shipment-required'] && !hasLTLShipment) {
                    hasLTLShipment = true;
                }
                if (!bundledProductLineItem.product.custom['ltl-shipment-required'] && !hasNonLTLShipment) {
                    hasNonLTLShipment = true;
                }
            });
        } else {
            if (productLineItem.product.custom['ltl-shipment-required'] && !hasLTLShipment) {
                hasLTLShipment = true;
            }
            if (!productLineItem.product.custom['ltl-shipment-required'] && !hasNonLTLShipment) {
                hasNonLTLShipment = true;
            }
        }
    });

    return hasLTLShipment && hasNonLTLShipment;
}

/**
 * Check if we only have aftermarket items
 *
 * @param {dw.order.Shipment} shipment Shipment Object
 * @returns {boolean} flag of mixed cart
 */
 function isAftermarketOnlyOrder(shipment) {
    var aftermarketOnly = false;
    var ewItems = 0;
    var numberOfItems = 0;

    collections.forEach(shipment.productLineItems, function (productLineItem) {
        if (productLineItem.bundledProductLineItems.size() > 0) {
            collections.forEach(productLineItem.bundledProductLineItems, function (bundledProductLineItem) {
                if (bundledProductLineItem.product.custom['product-type'] == 'ExtendedWarranty') {
                    ewItems++;
                }
            });
        } else {
            if (productLineItem.product.custom['product-type'] == 'ExtendedWarranty') {
                ewItems ++;
            }
        }
        numberOfItems++;
    });

    if (ewItems === numberOfItems) {
        aftermarketOnly = true;
    }

    return aftermarketOnly;
}

/**
 * Sets the default ShippingMethod for a Shipment, if absent
 * @param {dw.order.Shipment} shipment - the target Shipment object
 */
function ensureShipmentHasMethod(shipment) {
    var shippingMethod = shipment.shippingMethod;
    if (!shippingMethod) {
        var methods = ShippingMgr.getShipmentShippingModel(shipment).applicableShippingMethods;
        var hasMixedShipment = isMixedShipment(shipment);
        var aftermarketOnlyOrder = isAftermarketOnlyOrder(shipment);

        // Filter out whatever the method associated with in store pickup
        var filteredMethods = new ArrayList();
        collections.forEach(methods, function (method) {
            if (aftermarketOnlyOrder) {
                if (!method.custom.storePickupEnabled && method.custom.aftermarketOnly) {
                    filteredMethods.push(method);
                }
            } else {
                if (!method.custom.aftermarketOnly && !method.custom.storePickupEnabled && (hasMixedShipment || (!hasMixedShipment && !method.custom.mixedCart)) && !method.custom.isDealerFulfillment) {
                    filteredMethods.push(method);
                }
            }

        });

        var defaultMethod = ShippingMgr.getDefaultShippingMethod();

        if (!defaultMethod) {
            // If no defaultMethod set, just use the first one
            shippingMethod = getFirstApplicableShippingMethod(filteredMethods, true);
        } else {
            // Look for defaultMethod in applicableMethods
            shippingMethod = collections.find(filteredMethods, function (method) {
                return method.ID === defaultMethod.ID;
            });
        }

        // If found, use it.  Otherwise return the first one
        if (!shippingMethod && filteredMethods && filteredMethods.length > 0) {
            shippingMethod = getFirstApplicableShippingMethod(filteredMethods, true);
        }

        if (shippingMethod) {
            shipment.setShippingMethod(shippingMethod);
        }
    }
}

/**
 * Plain JS object that represents a DW Script API dw.order.ShippingMethod object
 * @param {dw.order.Basket} basket - the target Basket
 * @param {string} uuid - the matching UUID to match against Shipments
 * @returns {dw.order.Shipment} a Shipment object
 */
function getShipmentByUUID(basket, uuid) {
    return collections.find(basket.shipments, function (shipment) {
        return shipment.UUID === uuid;
    });
}

/**
 * Plain JS object that represents a DW Script API dw.order.ShippingMethod object
 * @param {dw.order.Shipment} shipment - the target Shipment
 * @param {Object} [address] - optional address object
 * @returns {dw.util.Collection} an array of ShippingModels
 */
function getApplicableShippingMethods(shipment, address) {
    if (!shipment) return null;

    var shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);

    var shippingMethods;
    if (address) {
        shippingMethods = shipmentShippingModel.getApplicableShippingMethods(address);
    } else {
        shippingMethods = shipmentShippingModel.getApplicableShippingMethods();
    }

    var hasMixedShipment = isMixedShipment(shipment);
    var aftermarketOnlyOrder = isAftermarketOnlyOrder(shipment);

    // Filter out whatever the method associated with in store pickup
    var filteredMethods = [];
    var methodIDs = [];
    collections.forEach(shippingMethods, function (shippingMethod) {
        if (aftermarketOnlyOrder) {
            // this order only contains after market extended warranties
            if (!shippingMethod.custom.storePickupEnabled &&  shippingMethod.custom.aftermarketOnly) {
                methodIDs.push(shippingMethod.ID);
                filteredMethods.push(new ShippingMethodModel(shippingMethod, shipment));
            }
        } else {
            if (!shippingMethod.custom.aftermarketOnly && !shippingMethod.custom.storePickupEnabled && (hasMixedShipment || (!hasMixedShipment && !shippingMethod.custom.mixedCart))) {
                if (!shippingMethod.custom.isDealerFulfillment) {
                    filteredMethods.push(new ShippingMethodModel(shippingMethod, shipment));
                }
                // We need to add dealer methods as well for validation below
                methodIDs.push(shippingMethod.ID);
            }
        }
    });
    var method = shipment.shippingMethod;
    if (method && methodIDs.indexOf(method.ID) === -1) {
        var Transaction = require('dw/system/Transaction');

        Transaction.wrap(function () {
            shipment.setShippingMethod(null);
            ensureShipmentHasMethod(shipment);
        });
    }
    return filteredMethods;
}

function calculateAdjustedShippingCosts(orderModel, currentBasket) {
    var Transaction = require("dw/system/Transaction");
    var PromotionMgr = require("dw/campaign/PromotionMgr");
    var ShippingMgr = require("dw/order/ShippingMgr");
    var basketCalculationHelpers = require("*/cartridge/scripts/helpers/basketCalculationHelpers");
    var formatCurrency = require("*/cartridge/scripts/util/formatting").formatCurrency;
    var shipment = currentBasket.defaultShipment;
    var shipmentShippingMethod = shipment.shippingMethod;

    if (orderModel && orderModel.shipping && orderModel.shipping[0] && orderModel.shipping[0].applicableShippingMethods.length) {
        Transaction.begin();
        orderModel.shipping[0].applicableShippingMethods.forEach(function (shippingMethod) {
            selectShippingMethod(shipment, shippingMethod.ID);
            PromotionMgr.applyDiscounts(currentBasket);

            ShippingMgr.applyShippingCost(currentBasket);

            PromotionMgr.applyDiscounts(currentBasket);
            currentBasket.updateTotals();
            shippingMethod.adjustedShippingCost = {
                value: currentBasket.adjustedShippingTotalPrice.value,
                formatted: formatCurrency(currentBasket.adjustedShippingTotalPrice.value, currentBasket.currencyCode)
            };
            if (orderModel.shipping[0].selectedShippingMethod && shippingMethod.ID == orderModel.shipping[0].selectedShippingMethod.ID) {
                orderModel.shipping[0].selectedShippingMethod.adjustedShippingCost = shippingMethod.adjustedShippingCost;
            }
        });
        Transaction.rollback();

        Transaction.begin();
        if (shipmentShippingMethod) {
            selectShippingMethod(shipment, shipmentShippingMethod.ID);
        }
        basketCalculationHelpers.calculateTotals(currentBasket);
        Transaction.commit();
    }

    return orderModel;
}

module.exports = {
    getShippingModels: getShippingModels,
    selectShippingMethod: selectShippingMethod,
    ensureShipmentHasMethod: ensureShipmentHasMethod,
    getShipmentByUUID: getShipmentByUUID,
    getAddressFromRequest: getAddressFromRequest,
    getApplicableShippingMethods: getApplicableShippingMethods,
    isMixedShipment: isMixedShipment,
    isAftermarketOnlyOrder: isAftermarketOnlyOrder,
    calculateAdjustedShippingCosts: calculateAdjustedShippingCosts
};
