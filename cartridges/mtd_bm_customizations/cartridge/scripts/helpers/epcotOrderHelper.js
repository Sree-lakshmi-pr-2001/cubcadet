const Logger = require('dw/system/Logger').getLogger('EPCOTORDER', 'epcotOrderHelper.js');

/**
 * getProductJson
 * @param {*} basketJSON - json for the entire basket for a product
 * @param {*} itemId - the item ID to search for in the basket - this can be null to return all items
 * @returns - returns either a single product json or an array of product jsons
 */
function getProductJson (basketJSON, itemId) {
    Logger.info('Returning basketJSON(s) from getProductJson');
    if (itemId) {
        // if itemId is specified, look through all of the products and return this specific product
        var productArray = basketJSON['product_items'];
        while (productArray.length > 0) {
            var currentProduct = productArray.shift();
            if (currentProduct['item_id'] === itemId){
                return currentProduct;
            }
        }
    } else {
        var productArray = basketJSON['product_items'];
        return productArray;
    }   
}

/**
 * checkForNoCharge
 * @param {*} productJson  - the json for the product being parsed
 * @returns - true or false
 */
function checkForNoCharge (productJson_i) {
    Logger.info('Checking for no charge based on productJSON');
    var productJson = JSON.parse(JSON.stringify(productJson_i));
    if (productJson['price_adjustments']) {
        while (productJson['price_adjustments'].length > 0) {
            currentPriceAdjustment = productJson['price_adjustments'].shift();
            if(currentPriceAdjustment['_type'] === 'price_adjustment' && currentPriceAdjustment.applied_discount.percentage === 100) {
                return true;
            }
        }
    } 
    // no price adjustments on the products
    // no 100% discounts applied
    return false;
}

/**
 * checkForCoupon
 * @param {*} basketJSON_i - basket for the order
 * @param {*} couponName - name of the coupon we are looking for
 * @returns - true or false
 */
function checkForCoupon(basketJSON_i, couponName) {
    Logger.info('Checking for coupon based on  basketJSON');
    var basketJSON = JSON.parse(JSON.stringify(basketJSON_i));
    if (basketJSON['coupon_items']) {
        while(basketJSON['coupon_items'].length > 0) {
            currentCoupon = basketJSON['coupon_items'].shift();
            if (currentCoupon.code === couponName) {
                Logger.error('Found coupon');
                return true;
            }
        }
    }
    return false;
}

/**
 * 
 * @param {*} productJson - the json for the product being parsed
 * @returns - returns the ID of the priceadjustment
 */
function getAdjustmentId(productJson_i) {
    var productJson = JSON.parse(JSON.stringify(productJson_i));
    if (productJson['price_adjustments']) {
        while (productJson['price_adjustments'].length > 0) {
            var currentPriceAdjustment = productJson['price_adjustments'].shift();
            if(currentPriceAdjustment['_type'] === 'price_adjustment' && currentPriceAdjustment.applied_discount.percentage === 100) {
                return currentPriceAdjustment['price_adjustment_id'];
            }
        }
    } 
}

/**
 * 
 * @param {*} basketJSON_i - test
 * @param {*} couponCode - test
 * @returns - test
 */
function getCouponId(basketJSON_i, couponCode) {
    Logger.info('Retrieving coupon ID for : ' + couponCode );
    var basketJSON = JSON.parse(JSON.stringify(basketJSON_i));
    Logger.info(JSON.stringify(basketJSON));
    if (basketJSON['coupon_items']) {
        while(basketJSON['coupon_items'].length > 0) {
            var currentCoupon = basketJSON['coupon_items'].shift();
            if (currentCoupon['code'] === couponCode) {
                return currentCoupon['coupon_item_id'];
            }
        }
    }
}

module.exports.getCouponId = getCouponId;
module.exports.getAdjustmentId = getAdjustmentId;
module.exports.getProductJson = getProductJson;
module.exports.checkForNoCharge = checkForNoCharge;
module.exports.checkForCoupon = checkForCoupon;