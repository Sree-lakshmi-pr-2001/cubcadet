'use strict';

/**
 *
 * @param {dw.catalog.Product} apiProduct - Product returned by the API
 * @param {Object} variationModel - Product variation model
 *
 * @returns {Array<Object>} - Array of sub-product models
 */
function setExtendedWarranty(apiProduct, variationModel, isOrderModel) {
    var result = { isExist: false };

    if (apiProduct.getOrderableRecommendations(4).length > 0) {
        var recommendedItem = apiProduct.getOrderableRecommendations(4)[0].recommendedItem;
        result.isExist = true;
        result.id = recommendedItem.ID;
        result.name = recommendedItem.name;
        result.available = recommendedItem.getAvailabilityModel().isInStock();
        result.priceAvailability = recommendedItem.priceModel.priceInfo.price.available;
        result.readyToOrder = variationModel ? !!variationModel.selectedVariant : true;
        result.shortDescription = recommendedItem.shortDescription;
        result.coverage = recommendedItem.custom['years-of-coverage-text'];
        result.price = recommendedItem.priceModel.priceInfo.price.value;
        result.formattedPrice = recommendedItem.priceModel.priceInfo.price.toFormattedString();

        var BasketMgr = require('dw/order/BasketMgr');
		var currentBasket = BasketMgr.getCurrentOrNewBasket();

        var iterator;
        if(isOrderModel && session.custom.orderNo){
            var OrderMgr = require('dw/order/OrderMgr');
            var iterator = OrderMgr.getOrder(session.custom.orderNo).getProductLineItems();
        } else{
            var BasketMgr = require('dw/order/BasketMgr');
            var currentBasket = BasketMgr.getCurrentOrNewBasket();
            iterator = currentBasket.allProductLineItems;
        }


        for each(let lineItem in iterator) {
            if (lineItem.productID == recommendedItem.ID) {
                result.quantity = lineItem.quantityValue.toFixed();
                result.UUID = lineItem.UUID;
                result.displayAddWarranty = true;
                result.totalPrice = lineItem.price.toFormattedString();
                break;
            } else {
                result.displayAddWarranty = false;
            }
        }


    }

    return result;
}

module.exports = function (object, apiProduct, variationModel, isOrderModel) {
    Object.defineProperty(object, 'extendedWarranty', {
        enumerable: true,
        value: setExtendedWarranty(apiProduct, variationModel, isOrderModel)
    });
};
