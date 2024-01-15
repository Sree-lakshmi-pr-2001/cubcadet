/* eslint-disable dot-notation */
'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var ProductFactory = require('*/cartridge/scripts/factories/product');
var prop65Helper = require('*/cartridge/scripts/helpers/prop65Helpers');

/**
 * Initiate MTD availability against custom attribute
 *
 * @param {dw.order.ProductLineItem} item - product line item object
 * @returns {Object} - availability object
 */
function initMtdAvailability(item) {
    var Resource = require('dw/web/Resource');
    var availability = {};
    availability.messages = [];
    var availableQty = item.custom.mtdQtyAvailable;
    var plural = availableQty > 1 ? 's' : '';
    if (availableQty >= item.quantityValue) {
        if (availableQty !== item.quantityValue) {
            availability.messages.push(Resource.msg('label.instock', 'common', null));
        } else {
            availability.messages.push(
                Resource.msgf(
                    'label.quantity.in.stock',
                    'common',
                    null,
                    availableQty
                )
            );
        }
    } else {
        availability.messages.push(Resource.msgf('label.not.available.in.stock', 'common', null, availableQty, plural));
    }
    return availability;
}

/**
 * Creates an array of product line items
 * @param {dw.util.Collection<dw.order.ProductLineItem>} allLineItems - All product
 * line items of the basket
 * @param {string} view - the view of the line item (basket or order)
 * @returns {Array} an array of product line items.
 */
function createProductLineItemsObject(allLineItems, view) {
    var lineItems = [];
    var prop65Plis = [];

    if (view === 'basket') {
        var BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentBasket();
        prop65Plis = prop65Helper.findProductLineItemsWithProp65(currentBasket);
    } else if (view === 'order') {
        var OrderMgr = require('dw/order/OrderMgr');
        var orderNo = allLineItems[0].lineItemCtnr.orderNo;
        var order = OrderMgr.getOrder(orderNo);
        prop65Plis = prop65Helper.findProductLineItemsWithProp65(order);
    }

    collections.forEach(allLineItems, function (item) {
        if (!item.product) { return; }
        var options = collections.map(item.optionProductLineItems, function (optionItem) {
            return {
                optionId: optionItem.optionID,
                selectedValueId: optionItem.optionValueID
            };
        });

        var bonusProducts = null;

        if (!item.bonusProductLineItem
                && item.custom.bonusProductLineItemUUID
                && item.custom.preOrderUUID) {
            bonusProducts = [];
            collections.forEach(allLineItems, function (bonusItem) {
                if (!!item.custom.preOrderUUID && bonusItem.custom.bonusProductLineItemUUID === item.custom.preOrderUUID) {
                    var bpliOptions = collections.map(bonusItem.optionProductLineItems, function (boptionItem) {
                        return {
                            optionId: boptionItem.optionID,
                            selectedValueId: boptionItem.optionValueID
                        };
                    });
                    var params = {
                        pid: bonusItem.product.ID,
                        quantity: bonusItem.quantity.value,
                        variables: null,
                        pview: 'bonusProductLineItem',
                        containerView: view,
                        lineItem: bonusItem,
                        options: bpliOptions
                    };

                    bonusProducts.push(ProductFactory.get(params));
                }
            });
        }

        var params = {
            pid: item.product.ID,
            quantity: item.quantity.value,
            variables: null,
            pview: 'productLineItem',
            containerView: view,
            lineItem: item,
            options: options
        };
        var newLineItem = ProductFactory.get(params);
        if (view === 'basket' || 'order') {
            newLineItem.prop65Warning = prop65Plis.indexOf(newLineItem.UUID) >= 0;
            if (item.product && item.custom.mtdQtyAvailable !== null) {
                newLineItem.mtdAvailability = initMtdAvailability(item);
            }
        }

        var ProductMgr = require('dw/catalog/ProductMgr');
        var isExistExtendedWarranty = ProductMgr.getProduct(item.productID).getOrderableRecommendations(4).length > 0;
        newLineItem.isExistExtendedWarranty = isExistExtendedWarranty;

        if (item.custom.ewlinkedWarranty) {
            newLineItem.hideAddWarrantyButton = true;
        }

        if (item.custom['product-type'] === 'ExtendedWarranty') {
            newLineItem.ew = {
                shortDescription: item.product.shortDescription,
                coverage: item.product.custom['years-of-coverage-text'],
                model: item.custom['ew-model'],
                productName: item.custom['ew-productName'] != null ? item.custom['ew-productName'] : null,
                type: item.custom['ew-type'],
                endUse: item.custom['ew-aftermarket-end-use'],
                factoryNumber: item.custom['ew-aftermarket-factory-number'],
                serialNumber: item.custom['ew-aftermarket-serial-number'],
                parent: item.custom['ewlinkedWarranty']

            };
        }

        newLineItem.bonusProducts = bonusProducts;
        if (newLineItem.bonusProductLineItemUUID === 'bonus' || !newLineItem.bonusProductLineItemUUID) {
            lineItems.push(newLineItem);
        }
    });

    return lineItems;
}

/**
 * Loops through all of the product line items and adds the quantities together.
 * @param {dw.util.Collection<dw.order.ProductLineItem>} items - All product
 * line items of the basket
 * @returns {number} a number representing all product line items in the lineItem container.
 */
function getTotalQuantity(items) {
    // TODO add giftCertificateLineItems quantity
    var totalQuantity = 0;
    collections.forEach(items, function (lineItem) {
        totalQuantity += lineItem.quantity.value;
    });

    return totalQuantity;
}

/**
 * @constructor
 * @classdesc class that represents a collection of line items and total quantity of
 * items in current basket or per shipment
 *
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - the product line items
 *                                                       of the current line item container
 * @param {string} view - the view of the line item (basket or order)
 */
function ProductLineItems(productLineItems, view) {
    if (productLineItems) {
        this.items = createProductLineItemsObject(productLineItems, view);
        this.totalQuantity = getTotalQuantity(productLineItems);
    } else {
        this.items = [];
        this.totalQuantity = 0;
    }
}

ProductLineItems.getTotalQuantity = getTotalQuantity;

module.exports = ProductLineItems;
