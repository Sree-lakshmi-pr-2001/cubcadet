/* eslint-disable no-alert */
/* eslint-disable camelcase */
/* eslint-disable */
'use strict';

var productMap = new Map();
var globalBasketId = null;
var globalCommerceSite = null;
var globalShowNoChargePermission = document.getElementById('canSeeNoChargeButton').value;
var globalShowDiscountPermission = null;
var globalShowNoChargeReasonCode = false;
// var globalCartIsEmpty = true;
var globalNoChargeAddedToBasket = false;
var globalAllItemsAreNoCharged = false;
let currentSite = document.getElementById('hiddenSite').value;
// var globalNoChargeReasonCodesOnItems = false;

var isCARBEnabled = document.getElementById('isCARBEnabled').value;
var isCARBProductRemoved = null;
var aletrnativeProdId = null;
var CARBshippingState = null;
if(document.getElementById('CARBProductRemoved')){
    isCARBProductRemoved = document.getElementById('CARBProductRemoved').value;
}

if(document.getElementById('aletrnativeProductId')){
    aletrnativeProdId = document.getElementById('aletrnativeProductId').value;
}

if(document.getElementById('CARBshippingState')){
    CARBshippingState = document.getElementById('CARBshippingState').value;
}



/**
 * Sets the text on the cart to either be estimate or standard text
 */
function setEstimateText() {
    document.getElementById('miniCartShippingLabel').textContent = 'Estimated Shipping';
    document.getElementById('miniCartTaxLabel').textContent = 'Estimated Total Tax';
    document.getElementById('miniCartTotalLabel').textContent = 'Estimated Total';
}

/**
 * generate html template for basket item
 * @param {Object} productJSON - val of checkbox
 * @returns {boolean} expediate - is item expeditable
 */
function isBasketItemExpeditable(productJSON) {
    let expediate = false;

    // a product can be expedited if :
    // item is a part , Accessary and should not backordered
    if ((productJSON['c_product-type'] === 'PARTS' || productJSON['c_product-type'] === 'ACCESSORY') && productJSON.actualMTDInventory > 0) {
        expediate = true;
    }

    return expediate;
}

/**
 * clear any status fields
 */
function clearStatuses() {
    // mini cart status on top of the page
    if (document.getElementById('miniCartStatus')) {
        document.getElementById('miniCartStatus').innerHTML = '';
    }

    if (document.getElementById('couponStatus')) {
        document.getElementById('couponStatus').innerHTML = '';
    }

    if (document.getElementById('status')) {
        document.getElementById('status').innerHTML = '';
    }

    if (document.getElementById('priceAdjustmentStatus')) {
        document.getElementById('priceAdjustmentStatus').innerHTML = '';
    }

    if (document.getElementById('noChargeStatus')) {
        document.getElementById('noChargeStatus').innerHTML = '';
    }

    if (document.getElementById('removeNoChargeStatus')) {
        document.getElementById('removeNoChargeStatus').innerHTML = '';
    }
}


/**
 * generate html template for basket item
 * @param {Object} productJSON - val of checkbox
 * @returns {Object} carbDetails - carb compliant details
 */
function getCARBDetails(productJSON) {
    let carbDetails = {};

    // a product can be expedited if :
    // item is a part
    if (productJSON['c_carb-compliant'] === false) {
        carbDetails.compliant = false;
        if (productJSON['c_carb-compliant-replacement'] === 'none') {
            carbDetails.replacement = null;
        } else {
            carbDetails.replacement = productJSON['c_carb-compliant-replacement'];
        }
    } else {
        carbDetails.compliant = true;
    }
    return carbDetails;
}

/**
 * caseNumberSearch
 * @param {number} caseNumber - caseNumber
 * @param {string} basketId - basketID
 */
function caseNumberSearch(caseNumber, basketId) {
    document.getElementById('caseStatus').innerHTML = 'Fetching Details';

    if (caseNumber.length === 0) {
        document.getElementById('miniCartStatus').innerHTML = 'Case Number Cannot be blank';
        document.getElementById('caseStatus').innerHTML = 'Case Number Cannot be blank';
    } else {
        jQuery.ajax({
            type: 'POST',
            url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AJAXGetSfdcCaseDetails',
            data: {
                caseNumber: caseNumber,
                basketId: basketId
            },
            success: function (response) {
                console.log(response.response);
                if (response.response.error === false && response.response.statusCode === 'OK' && response.response.Result) {
                    let Contact = response.response.Result.Contact;
                    console.log(Contact);
                    if (Contact) {
                        // updating customers Billling Contact Details
                        $('#billing_firstName').val(Contact.FirstName);
                        $('#billing_lastName').val(Contact.LastName);
                        $('#billing_email').val(Contact.Email);
                        $('#billing_phone').val(Contact.Phone);

                        // updating customers Shipping Contact Details
                        $('#shipping_firstName').val(Contact.FirstName);
                        $('#shipping_lastName').val(Contact.LastName);
                        $('#shipping_phone').val(Contact.Phone);

                        // updating customers Billing Address Details
                        $('#billing_address1').val(Contact.MailingStreet);
                        $('#billing_city').val(Contact.MailingCity);
                        $('#billing_state').val(Contact.MailingState);
                        $('#billing_postalCode').val(Contact.MailingPostalCode);

                        // updating customers Shipping Address Details
                        $('#shipping_address1').val(Contact.MailingStreet);
                        $('#shipping_city').val(Contact.MailingCity);
                        $('#shipping_state').val(Contact.MailingState);
                        $('#shipping_postalCode').val(Contact.MailingPostalCode);
                    }

                    document.getElementById('miniCartStatus').innerHTML = 'Case Billing and Shipping Details Updated Successfully';
                    document.getElementById('caseStatus').innerHTML = 'Case Billing and Shipping Details Updated Successfully';

                    $('#sfdcCaseNumber').attr('disabled', true);
                    $('#sfdcCase-search-btn').attr('disabled', true);
                } else if (response.response.error === true && response.response.errorCode === 400 && response.response.errorMessage) {
                    document.getElementById('miniCartStatus').innerHTML = response.response.errorMessage[0].message;
                    document.getElementById('caseStatus').innerHTML = response.response.errorMessage[0].message;
                } else {
                    document.getElementById('miniCartStatus').innerHTML = 'Service Unavailable! Please Try again';
                    document.getElementById('caseStatus').innerHTML = 'Service Unavailable! Please Try again';
                }
            },
            error: function (req, status, error) {
                alert(req + ' ' + status + ' ' + error);
            }
        });
    }
}

/**
 * generate html template for basket item
 * @param {string} text - val of checkbox
 * @param {boolean} outputAsHTML - option to include as HTML
 * @returns {html} miniCartDetailsLineInstance - generated html
 */
function generateBasketItemDetailLine(text, outputAsHTML) {
    const miniCartDetailsLine = document.getElementById('minicart-product-details');
    const miniCartDetailsLineInstance = document.importNode(miniCartDetailsLine.content, true);
    if (outputAsHTML) {
        miniCartDetailsLineInstance.querySelector('.minicart-product-details-line').innerHTML = text;
    } else {
        miniCartDetailsLineInstance.querySelector('.minicart-product-details-line').textContent = text;
    }

    return miniCartDetailsLineInstance;
}

/**
 * generate html template for basket item
 * @param {Object} productJSON - val of checkbox
 * @param {boolean} isOrderView - is this just the order view
 * @returns {Object} obj - html for the product row and discount total
 */
function generateBasketItem(productJSON, isOrderView) {
    let productDiscountTotal = 0;
    let productBeforeDiscountTotal = productJSON.price;
    console.log(productJSON);
    const miniCartTemplate = document.getElementById('minicart-row-template');
    const miniCartTemplateInstance = document.importNode(miniCartTemplate.content, true);
    miniCartTemplateInstance.querySelector('.removeButton').id = 'remove-item-' + productJSON.item_id;
    miniCartTemplateInstance.querySelector('.updateButton').id = 'update-item-' + productJSON.item_id;
    miniCartTemplateInstance.querySelector('.noChargeButton').id = 'noCharge-item-' + productJSON.item_id;
    miniCartTemplateInstance.querySelector('.miniCartQuantity').value = productJSON.quantity;
    miniCartTemplateInstance.querySelector('.miniCartQuantity').id = 'quantity-' + productJSON.item_id;
    miniCartTemplateInstance.querySelector('.miniCartName').textContent = productJSON.product_name;
    miniCartTemplateInstance.querySelector('.miniCartItemNumber').textContent = productJSON.product_id;
    miniCartTemplateInstance.querySelector('.product').id = 'product-' + productJSON.product_id
    miniCartTemplateInstance.querySelector('.miniCartPrice').textContent = '$' + productJSON.price.toFixed(2);
    miniCartTemplateInstance.querySelector('.miniCartPrice').id = 'miniCart-price-' + productJSON.item_id;
    if (currentSite === 'epcotus') {
        miniCartTemplateInstance.querySelector('.calculateItemWiseDiscount').id = 'calculate-item-wise-discount-' + productJSON.item_id;
        miniCartTemplateInstance.querySelector('.itemLevelDiscount').id = 'item-Level-Discount-' + productJSON.item_id;
        miniCartTemplateInstance.querySelector('.itemDiscountType').value = productJSON.itemDiscountType ? productJSON.itemDiscountType : 'percentage';
        miniCartTemplateInstance.querySelector('.itemDiscountType').id = 'itemDiscountType-' + productJSON.item_id;
        miniCartTemplateInstance.querySelector('.itemdiscountValue').value = productJSON.itemdiscountValue;
        miniCartTemplateInstance.querySelector('.itemdiscountValue').id = 'itemdiscountValue-' + productJSON.item_id;
    }

    if (globalShowNoChargePermission !== 'true') {
        // miniCartTemplateInstance.querySelector('.noChargeButton').id = 'cannot-no-charge-item';
        miniCartTemplateInstance.querySelector('.noChargeButton').style.visibility = 'hidden';
    }
    let expeditable = isBasketItemExpeditable(productJSON);
    let detailsHeader = miniCartTemplateInstance.querySelector('.miniCartItemDetails');

    if (isOrderView !== true) {
        if (expeditable) {
            detailsHeader.appendChild(generateBasketItemDetailLine('Expedited Shipping Eligible'));
        }

        let mtdInventory = 0;

        if (productJSON.actualMTDInventory) {
            mtdInventory = productJSON.actualMTDInventory;
        }

        let carbDetails = getCARBDetails(productJSON);
        console.log('carb details  : ' + JSON.stringify(carbDetails));

        if (carbDetails.compliant === false) {
            let carbText = 'This product cannot be shipped to California (not CARB Compliant)';

            if (carbDetails.replacement) {
                carbText += '<br/>Replace with ' + carbDetails.replacement;
            } else {
                carbText += '<br/>There is not CARB equivalent model';
            }

            detailsHeader.appendChild(generateBasketItemDetailLine(carbText, true));
        }

        detailsHeader.appendChild(generateBasketItemDetailLine('Quantity In-Stock: ' + mtdInventory));
        if (productJSON['c_ltl-shipment-required'] === 'true' || productJSON['c_ltl-shipment-required'] === true) {
            detailsHeader.appendChild(generateBasketItemDetailLine('Ships LTL'));
        } else {
            detailsHeader.appendChild(generateBasketItemDetailLine('Ships non-LTL'));
        }

        if (productJSON['c_dealer-required'] === 'true' || productJSON['c_dealer-required'] === true) {
            detailsHeader.appendChild(generateBasketItemDetailLine('Dealer Required'));
        } else if (productJSON['c_edealer-eligible'] === 'true' || productJSON['c_edealer-eligible'] === true) {
            detailsHeader.appendChild(generateBasketItemDetailLine('Dealer Eligible'));
        }
    }

    if (productJSON.price_adjustments) {
        productJSON.price_adjustments.forEach(function (discount) {
            if (discount.applied_discount.percentage === 100) {
                miniCartTemplateInstance.querySelector('.miniCartPrice').innerHTML = '<s>$' + productJSON.price.toFixed(2) + '</s> <br />No Charge';
                miniCartTemplateInstance.querySelector('.noChargeButton').textContent = 'Remove No Charge';
                miniCartTemplateInstance.querySelector('.noChargeButton').id = 'remove-noCharge-item-' + productJSON.price_adjustments[0].price_adjustment_id;
                if (currentSite === 'epcotus') {
                    miniCartTemplateInstance.querySelector('#calculate-item-wise-discount-' + productJSON.item_id).disabled = true;
                    miniCartTemplateInstance.querySelector('#itemDiscountType-' + productJSON.item_id).disabled = true;
                    miniCartTemplateInstance.querySelector('#itemdiscountValue-' + productJSON.item_id).disabled = true;
                }
            } else if (productJSON.price.toFixed(2) !== productJSON.price_after_order_discount.toFixed(2)) {
                miniCartTemplateInstance.querySelector('.miniCartPrice').innerHTML = '<s>$' + productJSON.price.toFixed(2) + '</s> <br />$' + productJSON.price_after_order_discount.toFixed(2);
                if (discount.price) {
                    if (discount.coupon_code) {
                        detailsHeader.appendChild(generateBasketItemDetailLine('Coupon Code <strong>' + discount.coupon_code + '</strong><br/>Discount :  <strong>$' + discount.price.toFixed(2) + '</strong>', true));
                    }

                    productDiscountTotal += discount.price;
                }

                if (discount.applied_discount) {
                    miniCartTemplateInstance.querySelector('.calculateItemWiseDiscount').textContent = 'Remove Discount';
                    miniCartTemplateInstance.querySelector('.calculateItemWiseDiscount').id = 'remove-calculate-item-wise-discount-' + productJSON.price_adjustments[0].price_adjustment_id;
                    var itemDiscountType = miniCartTemplateInstance.querySelector('#itemDiscountType-' + productJSON.item_id);
                    itemDiscountType.value = discount.applied_discount.type;
                    var itemDiscountValue = miniCartTemplateInstance.querySelector('#itemdiscountValue-' + productJSON.item_id);
                    itemDiscountType.disabled = true;
                    if (itemDiscountType.value === 'amount') {
                        itemDiscountValue.value = discount.applied_discount.amount;
                    } else {
                        itemDiscountValue.value = discount.applied_discount.percentage;
                    }
                    itemDiscountValue.disabled = true;
                    miniCartTemplateInstance.querySelector('#noCharge-item-' + productJSON.item_id).disabled = true;
                }
            }
        });
    }

    /*
    <template id="minicart-product-details">
        <li class="minicart-product-details-line"></li>
    </template>

    let headers = document.getElementById('miniCartItems');
    headers.appendChild(productRow);

    */

    // if (expeditable) {
    //     const miniCartTemplateInstance = document.importNode(miniCartTemplate.content, true);
    //     miniCartTemplateInstance.querySelector('.miniCartItemDetails').innerHTML = 'expeditable';
    // }
    console.log(expeditable);
    return ({
        productRow: miniCartTemplateInstance, discount: productDiscountTotal, preDiscountPrice: productBeforeDiscountTotal
    });
}

/**
 * generate html for price adjustment
 * @param {Object} priceAdjustment - val of checkbox
 * @param {string} couponItemId - coupon id
 * @param {boolean} priceAdjustmentApplied - as price adjustment been applied in basket?
 * @returns {string} priceAdjustmentTemplateInstance - html
 */
function generateBasketPriceAdjustment(priceAdjustment, couponItemId, priceAdjustmentApplied) {
    console.log(priceAdjustment);
    var priceAdjustmentTemplate = document.getElementById('minicart-discount');
    var priceAdjustmentTemplateInstance = document.importNode(priceAdjustmentTemplate.content, true);
    let description = priceAdjustment.description;
    if (priceAdjustment.coupon_code) {
        priceAdjustmentTemplateInstance.querySelector('.removeAdjustment').id = 'remove-coupon-' + couponItemId;
        let couponCode = priceAdjustment.coupon_code;
        if (couponCode === 'CSR_FREESHIP') {
            couponCode = 'Waived Shipping';
            priceAdjustmentTemplateInstance.querySelector('.miniCartDiscountName').textContent = couponCode;
        } else {
            priceAdjustmentTemplateInstance.querySelector('.miniCartDiscountName').textContent = 'Coupon Code : ' + couponCode;
        }
    } else {
        priceAdjustmentTemplateInstance.querySelector('.removeAdjustment').id = 'remove-adjustment-' + priceAdjustment.price_adjustment_id;
        console.log('not a coupon');
        description = 'Custom Discount';
    }
    if (priceAdjustmentApplied === true) {
        if (priceAdjustment.applied_discount.type === 'percentage') {
            // priceAdjustmentTemplateInstance.querySelector('.miniCartPercentageAmountDiscountType').textContent = priceAdjustment.applied_discount.type;
            // priceAdjustmentTemplateInstance.querySelector('.miniCartPercentageAmountDiscountPercentage').textContent = priceAdjustment.applied_discount.percentage + '%';
            priceAdjustmentTemplateInstance.querySelector('.miniCartDiscountPrice').textContent = '$' + (Math.round(priceAdjustment.price * 100) / 100).toFixed(2);
            description = 'Percent Discount : ' + priceAdjustment.applied_discount.percentage + '%';
        }
        if (priceAdjustment.applied_discount.type === 'amount') {
            // priceAdjustmentTemplateInstance.querySelector('.miniCartFixedAmountReasonCode').textContent = priceAdjustment.reason_code;
            // priceAdjustmentTemplateInstance.querySelector('.miniCartFixedAmountDiscountType').textContent = priceAdjustment.applied_discount.type;
            priceAdjustmentTemplateInstance.querySelector('.miniCartDiscountPrice').textContent = '$' + (Math.round(priceAdjustment.price * 100) / 100).toFixed(2);
        }
    }

    if (description) {
        priceAdjustmentTemplateInstance.querySelector('.miniCartDiscountDescription').textContent = description;
    }


    // if (priceAdjustment.applied_discount.type === 'percentage') {
    //     const priceAdjustmentTemplate = document.getElementById('minicart-discount-percentage-amount');
    //     priceAdjustmentTemplateInstance = document.importNode(priceAdjustmentTemplate.content, true);
    //     priceAdjustmentTemplateInstance.querySelector('.removeAdjustment').id = 'remove-adjustment-' + priceAdjustment.price_adjustment_id;
    //     priceAdjustmentTemplateInstance.querySelector('.miniCartPercentageAmountReasonCode').textContent = priceAdjustment.reason_code;
    //     priceAdjustmentTemplateInstance.querySelector('.miniCartPercentageAmountDiscountType').textContent = priceAdjustment.applied_discount.type;
    //     priceAdjustmentTemplateInstance.querySelector('.miniCartPercentageAmountDiscountPercentage').textContent = priceAdjustment.applied_discount.percentage + '%';
    //     priceAdjustmentTemplateInstance.querySelector('.miniCartPercentageAmountDiscountAmount').textContent = '$' + (Math.round(priceAdjustment.price * 100) / 100).toFixed(2);
    // }

    // if (priceAdjustment.applied_discount.type === 'amount') {
    //     const priceAdjustmentTemplate = document.getElementById('minicart-discount-fixed-amount');
    //     priceAdjustmentTemplateInstance = document.importNode(priceAdjustmentTemplate.content, true);
    //     priceAdjustmentTemplateInstance.querySelector('.removeAdjustment').id = 'remove-adjustment-' + priceAdjustment.price_adjustment_id;
    //     priceAdjustmentTemplateInstance.querySelector('.miniCartFixedAmountReasonCode').textContent = priceAdjustment.reason_code;
    //     priceAdjustmentTemplateInstance.querySelector('.miniCartFixedAmountDiscountType').textContent = priceAdjustment.applied_discount.type;
    //     priceAdjustmentTemplateInstance.querySelector('.miniCartFixedAmountDiscountAmount').textContent = '$' + (Math.round(priceAdjustment.price * 100) / 100).toFixed(2);
    // }

    return priceAdjustmentTemplateInstance;
}

/**
 *  generate product list for basket
 *  @param {Object} basketJSON - basketJSON
 *  @param {boolean} isOrderView - is this an orderView only
 * */
function updateMiniCart(basketJSON, isOrderView) {
    // clear existing status div tags
    clearStatuses();
    console.log('in updateMiniCart - isOrderView : ' + isOrderView);
    document.getElementById('miniCartItems').innerHTML = '';

    // if (basketJSON && basketJSON.product_items) {
    if (basketJSON) {
        if (isOrderView !== true && basketJSON.basket_id) {
            globalBasketId = basketJSON.basket_id;

            // adds globalBasketID to the URL
            var url = new URL(window.location);
            url.searchParams.set('basketId', globalBasketId);
            window.history.pushState({}, '', url);
        }

        var miniCartItemsHeaders = document.getElementById('miniCartItems');
        var totalQuantity = 0;
        var couponMap = new Map();
        var discountTotal = 0.0;
        var productTotalBeforeDiscounts = 0.0;
        var noChargeReasonCodeAppliedToItems = false;

        if (basketJSON.coupon_items) {
            basketJSON.coupon_items.forEach(function (coupon) {
                couponMap.set(coupon.code, coupon.coupon_item_id);
            });
        }

        // loop through all product items
        // get the discountTotal
        // get the productTotalBeforeDiscounts
        // determine if theres a no charge on the item to show the reason code div
        // determine if the reason code has been applied to the order already
        if (basketJSON.product_items) {
            // globalCartIsEmpty = false;
            $('#mainCartDiv').data('globalCartIsEmpty', 'false');
            globalShowNoChargeReasonCode = false;
            basketJSON.product_items.forEach(function (product) {
                totalQuantity += product.quantity;
                var basketItemDetails = generateBasketItem(product, isOrderView);
                var productRow = basketItemDetails.productRow;
                console.log('discount ' + basketItemDetails.discount);
                if (basketItemDetails.discount !== 0) {
                    discountTotal += basketItemDetails.discount;
                }

                // determine if there's a no charge on the item
                var NoChargeItem = false;
                if (product.price_adjustments) {
                    product.price_adjustments.forEach(discount => {
                        // eslint-disable-next-line no-underscore-dangle
                        if (discount._type === 'price_adjustment' && discount.applied_discount._type === 'discount' && discount.applied_discount.percentage === 100) {
                            globalShowNoChargeReasonCode = true;
                            NoChargeItem = true;
                            console.log('Value of global no charge reason code : ' + globalShowNoChargeReasonCode);
                        }
                    });
                }
                if (!NoChargeItem) {
                    productTotalBeforeDiscounts += product.price;
                }
                miniCartItemsHeaders.appendChild(productRow);

                if( isCARBEnabled == 'true' && CARBshippingState == 'CA') {
                    updateCARTCARBSection(product.product_id);
                }

                // determine if there's a reason code applied to the order already
                if (product.c_noChargeModelNumber) {
                    noChargeReasonCodeAppliedToItems = true;
                    document.getElementById('noChargeStatusDiv').style.display = 'block';
                    document.getElementById('noChargeStatusTextDiv').innerHTML = 'No charge reason code successfully added to ' + (currentSite === 'epcotus' ? 'cart' : 'basket');
                    document.getElementById('noChargeModelNumber').value = product.c_noChargeModelNumber;
                    document.getElementById('noChargeSerialNumber').value = product.c_noChargeSerialNumber;
                    // set the selected field in the drop down to match the index found to match the code on the basket
                    var codeOptions = document.getElementById('noChargeReasonCode');
                    for (var i = 0; i < codeOptions.options.length; i++) {
                        var code = codeOptions[i].value;
                        if (Number(code) === Number(product.c_noChargeReasonCode)) {
                            document.getElementById('noChargeReasonCode').selectedIndex = i;
                        }
                    }
                }
            });
            $('#miniCartCommerceStore').val(basketJSON.c_commerceStore);
            $('#globalBasketId').val(globalBasketId);
        }

        let couponItemId = null;
        let waivedShipping = false;

        if (basketJSON.order_price_adjustments) {
            basketJSON.order_price_adjustments.forEach(function (discount) {
                if (discount.coupon_code && couponMap.has(discount.coupon_code)) {
                    couponItemId = couponMap.get(discount.coupon_code);
                    couponMap.delete(discount.coupon_code);
                }
                let adjustmentItem = generateBasketPriceAdjustment(discount, couponItemId, true);
                miniCartItemsHeaders.appendChild(adjustmentItem);
                if (discount.price) {
                    discountTotal += discount.price;
                }
            });
        }
        document.getElementById('miniCartDiscountTotal').innerHTML = '$' + discountTotal.toFixed(2);

        if (basketJSON.shipping_items && basketJSON.shipping_items.length > 0) {
            basketJSON.shipping_items.forEach(function (shippingItem) {
                if (shippingItem.price_adjustments) {
                    shippingItem.price_adjustments.forEach(function (discount) {
                        if (discount.coupon_code && couponMap.has(discount.coupon_code)) {
                            if (discount.coupon_code === 'CSR_FREESHIP') {
                                waivedShipping = true;
                            }
                            couponItemId = couponMap.get(discount.coupon_code);
                            couponMap.delete(discount.coupon_code);
                        }
                        let adjustmentItem = generateBasketPriceAdjustment(discount, couponItemId, true);
                        miniCartItemsHeaders.appendChild(adjustmentItem);
                    });
                }
            });
        }

        for (let [couponCode, value] of couponMap) {
            couponItemId = couponMap.get(couponCode);
            if (couponCode === 'CSR_FREESHIP') {
                waivedShipping = true;
            }
            console.log(value);
            console.log(couponCode + ' is in cart but not applied');
            let adjustmentItem = generateBasketPriceAdjustment({
                coupon_code: couponCode,
                description: 'In cart'
            }, couponItemId, false);
            miniCartItemsHeaders.appendChild(adjustmentItem);
        }


        // This handles the state management of if you can see the waive shipping button or not
        if ($('#waiveShipping').length) {
            console.log('waiveShipping exists ');
            if (waivedShipping || isOrderView === true) {
                $('#waiveShipping').hide();
                $('#shippingAlreadyWaived').show();
            } else {
                $('#waiveShipping').show();
                $('#shippingAlreadyWaived').hide();
            }
        } else {
            console.log('waiveShipping does not exist ');
        }


        $('#miniCartHeader').html('# of items in cart : ' + totalQuantity);
        console.log('basketJSON.product_sub_total : ' + basketJSON.product_sub_total);

        // jmiyamoto - because basketJSON.product_sub_total already substracts any item level discount, we want to display the subtotal at the sum of all the product prices before discounts
        if (productTotalBeforeDiscounts < 0.00) {
            document.getElementById('miniCartProductTotal').innerHTML = '';
        } else {
            document.getElementById('miniCartProductTotal').innerHTML = '$' + productTotalBeforeDiscounts.toFixed(2);
        }

        console.log('basketJSON.order_total : ' + basketJSON.order_total);
        if (basketJSON.order_total || basketJSON.order_total === 0.00) {
            document.getElementById('miniCartTotal').innerHTML = '$' + basketJSON.order_total.toFixed(2);
        } else {
            document.getElementById('miniCartTotal').innerHTML = '';
        }

        if (basketJSON.tax_total || basketJSON.tax_total === 0.0) {
            document.getElementById('miniCartTotalTax').innerHTML = '$' + basketJSON.tax_total.toFixed(2);
        } else {
            document.getElementById('miniCartTotalTax').innerHTML = '';
        }
        console.log('basketJSON.tax_total : ' + basketJSON.tax_total);

        let shipmentMethod = null;
        let shippingMethodId = null;
        let estimatedArrivalTime = null;
        let shippingAddress = null;
        let billingAddress = null;
        if (basketJSON.billing_address) {
            billingAddress = basketJSON.billing_address;
        }

        if (basketJSON.shipments && basketJSON.shipments.length > 0) {
            console.log('Shipping =>');
            basketJSON.shipments.forEach(shipment => {
                console.log(JSON.stringify(shipment));
                if (shipment.shipping_address) {
                    shippingAddress = shipment.shipping_address;
                }
                if (shipment.shipping_method) {
                    shipmentMethod = shipment.shipping_method.name;
                    shippingMethodId = shipment.shipping_method.id;
                    if (shipment.shipping_method.c_estimatedArrivalTime) {
                        estimatedArrivalTime = shipment.shipping_method.c_estimatedArrivalTime;
                    }

                    document.getElementById('globalShippingMethod').value = shipment.shipping_method.name;
                }
            });
        } else {
            console.log('no shipment or shipment length = 0');
            // what to do if there is no shipment
        }
        console.log('basketJSON.shipping_total : ' + basketJSON.shipping_total);
        if (basketJSON.shipping_total || basketJSON.shipping_total === 0) {
            document.getElementById('miniCartShippingMethodPrice').innerHTML = '$' + basketJSON.shipping_total.toFixed(2);
        }

        console.log('shipmentMethod : ' + shipmentMethod);
        console.log('shippingMethodId : ' + shippingMethodId);

        console.log($('#pageName').val());

        // state management of the minicart button
        if ($('#pageName').val() === 'productSearch') {
            console.log('is startBasket');
            $('#checkoutForm').attr('action', '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-StartCheckout');
            $('#miniCartButton').html('Start Checkout');
            $('#miniCartButton').removeClass('btn-primary');
            $('#miniCartButton').addClass('btn-danger');
        } else if ($('#pageName').val() === 'address') {
            console.log('is address');
            $('#checkoutForm').attr('action', '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-ReturnToStartBasket');
            $('#miniCartButton').html('Back to Product Search');
        } else if ($('#pageName').val() === 'discounts') {
            console.log('is discount');
            $('#checkoutForm').attr('action', '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-StartCheckout');
            $('#miniCartButton').html('Back to Address Page');
        }
        $('#minicart-discounts').show();

        if (shipmentMethod) {
            if (!noChargeReasonCodeAppliedToItems && globalShowNoChargeReasonCode) {
                $('#paymentDiv').hide();
                console.log('No Charge Discount Codes not applied to order');
                $('#noChargeReasonCodeOnOrderStatus').show();
                document.getElementById('noChargeReasonCodeOnOrderStatus').innerHTML = 'No Charge Discount Codes need to be applied in order to continue with this order';
            } else {
                $('#paymentDiv').show();
                if (!isOrderView) {
                    // document.getElementById('noChargeReasonCodeOnOrderStatus').innerHTML = '';
                    $('#noChargeReasonCodeOnOrderStatus').hide();
                }
                if ($('#paymentCheckoutButton').length) {
                    if (basketJSON && basketJSON.order_total === 0.00) {
                        $('#paymentCheckoutButton').html('Complete No Charge Order');
                    } else {
                        $('#paymentCheckoutButton').html('Continue to Credit Card Entry');
                    }
                }
            }
        } else {
            $('#paymentDiv').hide();
        }

        // determine shipping information
        if (!isOrderView && shipmentMethod) {
            if (waivedShipping) {
                document.getElementById('shippingMethodNoCharge').style.display = 'block';
                document.getElementById('shippingMethod').style.display = 'none';
                var selectedNoChargeIndex = document.getElementById('shippingMethodNoCharge').selectedIndex;
                document.getElementById('shippingMethod').selectedIndex = selectedNoChargeIndex;
            } else {
                document.getElementById('shippingMethodNoCharge').style.display = 'none';
                document.getElementById('shippingMethod').style.display = 'block';
                var selectedRegularIndex = document.getElementById('shippingMethod').selectedIndex;
                document.getElementById('shippingMethodNoCharge').selectedIndex = selectedRegularIndex;
            }
        }

        if (isOrderView === true) {
            let createdByDiv = document.getElementById('orderCreatedBy');
            if (basketJSON.created_by && createdByDiv) {
                createdByDiv.innerHTML = basketJSON.created_by;
            }

            let orderCreatedOnDiv = document.getElementById('orderCreatedOn');
            if (basketJSON.creation_date && orderCreatedOnDiv) {
                var formatDate = new Date(basketJSON.creation_date);
                orderCreatedOnDiv.innerHTML = formatDate;
            }

            let orderExportStatusDiv = document.getElementById('orderExportStatus');
            if (basketJSON.export_status && orderExportStatusDiv) {
                orderExportStatusDiv.innerHTML = basketJSON.export_status;
            }

            let orderStatusDiv = document.getElementById('orderStatus');
            if (basketJSON.status && orderStatusDiv) {
                console.log('updating order status to ' + basketJSON.status);
                orderStatusDiv.innerHTML = basketJSON.status;
            }

            console.log('shipmentMethod : ' + shipmentMethod);
            if (shipmentMethod) {
                const shippingMethodDiv = document.getElementById('minicart-shipping');
                const shippingMethodDivInstance = document.importNode(shippingMethodDiv.content, true);
                shippingMethodDivInstance.querySelector('.miniCartShippingDescription').textContent = 'Shipping Method : ' + shipmentMethod;
                if (estimatedArrivalTime) {
                    shippingMethodDivInstance.querySelector('.miniCartShippingEstimate').textContent = 'Estimated Delivery : ' + estimatedArrivalTime;
                }
                miniCartItemsHeaders.appendChild(shippingMethodDivInstance);
                console.log(shippingMethodDivInstance);
            }

            if (billingAddress && shippingAddress) {
                const miniCartAddresses = document.getElementById('minicart-addresses');
                const miniCartAddressesInstance = document.importNode(miniCartAddresses.content, true);
                miniCartAddressesInstance.querySelector('.miniCartAddressBillingAddressName').innerHTML = billingAddress.full_name;
                miniCartAddressesInstance.querySelector('.miniCartAddressBillingAddressAddress1').textContent = billingAddress.address1;
                if (billingAddress.address2) {
                    miniCartAddressesInstance.querySelector('.miniCartAddressBillingAddressAddress2').textContent = billingAddress.address2;
                }
                miniCartAddressesInstance.querySelector('.miniCartAddressBillingAddressCity').textContent = billingAddress.city + ', ';
                miniCartAddressesInstance.querySelector('.miniCartAddressBillingAddressState').textContent = billingAddress.state_code + ', ';
                miniCartAddressesInstance.querySelector('.miniCartAddressBillingAddressPostalCode').textContent = billingAddress.postal_code;
                miniCartAddressesInstance.querySelector('.miniCartAddressBillingAddressCountryCode').textContent = billingAddress.country_code;
                miniCartAddressesInstance.querySelector('.miniCartAddressBillingAddressPhone').textContent = billingAddress.phone;
                if (basketJSON.customer_info && basketJSON.customer_info.email) {
                    miniCartAddressesInstance.querySelector('.miniCartAddressBillingAddressEmail').textContent = basketJSON.customer_info.email;
                }

                miniCartAddressesInstance.querySelector('.miniCartAddressShippingAddressName').textContent = shippingAddress.full_name;
                miniCartAddressesInstance.querySelector('.miniCartAddressShippingAddressAddress1').textContent = shippingAddress.address1;
                if (shippingAddress.address2) {
                    miniCartAddressesInstance.querySelector('.miniCartAddressShippingAddressAddress2').textContent = shippingAddress.address2;
                }
                miniCartAddressesInstance.querySelector('.miniCartAddressShippingAddressCity').textContent = shippingAddress.city + ', ';
                miniCartAddressesInstance.querySelector('.miniCartAddressShippingAddressState').textContent = shippingAddress.state_code + ', ';
                miniCartAddressesInstance.querySelector('.miniCartAddressShippingAddressPostalCode').textContent = shippingAddress.postal_code;
                miniCartAddressesInstance.querySelector('.miniCartAddressShippingAddressCountryCode').textContent = shippingAddress.country_code;
                miniCartItemsHeaders.appendChild(miniCartAddressesInstance);

                $('#miniCartAccordion').find('button').hide();
                $('#miniCartAccordion').find('input').attr('disabled', 'disabled');
                $('#miniCartAccordion').find('select').attr('disabled', 'disabled');
                $('#minicart-discounts').hide();
                $('#cartHeading').hide();

                // TODO: attach template for no charge info here
                if (basketJSON.product_items[0].c_noChargeModelNumber) {
                    const minicartAdditionalInfo = document.getElementById('minicart-additionalInformation-noCharge');
                    const minicartAdditionalInfoInstance = document.importNode(minicartAdditionalInfo.content, true);
                    // Additional Information on orderview page
                    minicartAdditionalInfoInstance.querySelector('.orderViewNoChargeModel').textContent = basketJSON.product_items[0].c_noChargeModelNumber;
                    // get all values
                    var codeOptions = document.getElementById('noChargeReasonCode');
                    for (var i = 0; i < codeOptions.options.length; i++) {
                        var code = codeOptions[i].value;
                        console.log(code);
                        if (code === basketJSON.product_items[0].c_noChargeReasonCode) {
                            console.log('match');
                            minicartAdditionalInfoInstance.querySelector('.orderViewNoChargeReason').textContent = codeOptions[i].innerHTML;
                        }
                    }
                    minicartAdditionalInfoInstance.querySelector('.orderViewNoChargeNumber').textContent = basketJSON.product_items[0].c_noChargeSerialNumber;
                    miniCartItemsHeaders.appendChild(minicartAdditionalInfoInstance);
                }

                var audit = false;
                var auditField = document.getElementById('allowAudit');
                var approval = false;
                var approvalField = document.getElementById('allowApproval');

                if (auditField && auditField.value === 'true') {
                    audit = true;
                }
                if (approvalField && approvalField.value === 'true') {
                    approval = true;
                }

                if (audit) {
                    // if on the audit page, allow notes to be edited
                    $('#miniCartAccordion').find('.addNotesButton').show();
                    document.getElementById('notes1input').disabled = false;
                    document.getElementById('notes2input').disabled = false;
                }

                if (audit && (basketJSON.c_noChargeNeedsApproval === true || basketJSON.c_noChargeNeedsApproval === 'true')) {
                    // audit buttons
                    var auditSectionTemplate = document.getElementById('minicart-audit');
                    var auditSectionTemplateInstance = document.importNode(auditSectionTemplate.content, true);
                    var auditDiv = document.getElementById('auditDiv');
                    auditDiv.appendChild(auditSectionTemplateInstance);
                    if (approval) {
                        document.getElementById('approveOrder').style.display = 'block';
                    }
                }
            }
        }

        if (globalShowNoChargeReasonCode === true) {
            if ($('#pageName').val() === 'discounts') {
                $('#noChargeReasonCodeDiv').show();
                $('#removeNoChargeOrder').show();
                $('#noChargeOrder').hide();
                if ($('#removeNoChargeOrder').is(':visible')) {
                    let shippingMethod = $('#shippingMethod').val();
                    if (shippingMethod === '' && shippingMethod.length === 0) {
                        $('select[name=shippingMethod] option:eq(1)').attr('selected', 'selected').trigger('change');
                    }
                }
            } else {
                $('#noChargeReasonCodeDiv').hide();
                $('#removeNoChargeOrder').show();
                $('#noChargeOrder').hide();
            }
        } else {
            $('#noChargeReasonCodeDiv').hide();
            $('#removeNoChargeOrder').hide();
            $('#noChargeOrder').show();
        }

        if (basketJSON.billing_address && basketJSON.billing_address.first_name === 'ESTIMATE ONLY') {
            setEstimateText();
            document.getElementById('miniCartPostalCodeEstimate').textContent = basketJSON.billing_address.postal_code;
            document.getElementById('miniCartStateProvinceEstimate').textContent = basketJSON.billing_address.state_code;
        }

        // hide the estimate on the discounts page so the customer data cant be overwritten
        if (document.getElementById('pageName').value === 'discounts') {
            $('#estimateDetailsDiv').hide();
        }

        // populate notes fields with notes from basket
        if (basketJSON.c_note1) {
            document.getElementById('notes1input').value = basketJSON.c_note1;
        }
        if (basketJSON.c_note2) {
            document.getElementById('notes2input').value = basketJSON.c_note2;
        }

        // populate SFDC CaseNumber from basket
        if (basketJSON.c_SfdcCaseNumber) {
            document.getElementById('sfdcCaseNumber').value = basketJSON.c_SfdcCaseNumber;
            $('#sfdcCaseNumber').attr('disabled', true);
            $('#sfdcCase-search-btn').attr('disabled', true);

            if (!basketJSON.billing_address && !basketJSON.shippingAddress) {
                caseNumberSearch(basketJSON.c_SfdcCaseNumber, basketJSON.globalBasketId);
            }
        }
    } else {
        // basketJSON is null
        console.log('basketJSON is null');
        document.getElementById('miniCartHeader').innerHTML('Cart is empty');
    }

    // miniCartDiv.appendChild(miniCartTemplateInstance);
}

/**
 * get basketJSON from OCAPI
 * @param {Object} i_basketId - basketId for basket
 */
function getBasket(i_basketId) {
    console.log('requesting basket for ' + i_basketId);
    if (productMap) {
        console.log('product map do something');
    }
    jQuery.ajax({
        type: 'POST',
        url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AjaxGetBasket',
        data: {
            basketId: i_basketId
        },
        success: function (basketJSON) {
            if (basketJSON && basketJSON.basket_id) {
                globalBasketId = basketJSON.basket_id;
                console.log('basketId : ' + globalBasketId);
                console.log(basketJSON);
                updateMiniCart(basketJSON);
            }
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        }
    });
}

/**
 * mark no charge order as cancelled
 * @param {string} orderId - basketId for basket
 * @param {string} orderStatus - cancelled or OPEN
 */
function updateNoChargeOrder(orderId, orderStatus) {
    console.log('updateNoChargeOrder ' + orderId);
    document.getElementById('updateOrderStatusDiv').innerHTML = 'Updating Order status ...';
    jQuery.ajax({
        type: 'POST',
        url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AjaxUpdateChargeOrder',
        data: {
            orderId: orderId,
            status: orderStatus
        },
        success: function (orderJSON) {
            if (orderJSON.error && orderJSON.c_noChargeApprovalResponse === 'open' && (orderJSON.c_globalComplianceCheckStatus === 'MANUAL' || orderJSON.c_globalComplianceCheckStatus === 'PENDING')) {
                document.getElementById('updateOrderStatusDiv').innerHTML = 'Order status updated- Manually';
            } else if (orderJSON.error && orderJSON.c_noChargeApprovalResponse === 'cancelled') {
                document.getElementById('updateOrderStatusDiv').innerHTML = 'Order status updated as cancelled';
            } else if (orderJSON.error) {
                document.getElementById('updateOrderStatusDiv').innerHTML = orderJSON.error;
            } else if (orderJSON && orderJSON.order_no) {
                document.getElementById('updateOrderStatusDiv').innerHTML = 'Order status updated';
                console.log('order_no : ' + orderJSON.order_no);
                console.log(orderJSON);
                updateMiniCart(orderJSON, true);
            }
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        }
    });
}

/**
 * get order from OCAPI
 * @param {Object} orderId - basketId for basket
 */
function getOrder(orderId) {
    console.log('requesting order for ' + orderId);

    jQuery.ajax({
        type: 'POST',
        url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AjaxGetOrder',
        data: {
            orderId: orderId
        },
        success: function (orderJSON) {
            if (orderJSON && orderJSON.order_no) {
                console.log('orderId : ' + orderId);
                console.log(orderJSON);
                updateMiniCart(orderJSON, true);
            }
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        }
    });
}

/**
 * get product name from JSON
 * @param {Object} product - val of checkbox
 * @returns {string} name - name
 */
function getProductName(product) {
    let name = null;

    if (product && product.name && product.name.default) {
        name = product.name.default;
    }

    return name;
}

/**
 * get product sku from JSON
 * @param {Object} product - val of checkbox
 * @returns {string} sku - rendered html
 */
function getProductSku(product) {
    let sku = null;

    if (product && product.manufacturer_sku) {
        sku = product.manufacturer_sku;
    }

    return sku;
}

/**
 * get long description from JSON
 * @param {Object} product - val of checkbox
 * @returns {string} longDescription - rendered html
 */
function getLongDescription(product) {
    var longDescription = null;

    if (product && product.long_description != null && product.long_description.default != null) {
        longDescription = product.long_description.default.markup;
    }

    return longDescription;
}

/**
 * get product price from JSON
 * @param {Object} product - product JSON
 * @param {string} commerceSite - website for search
 * @returns {string} price - rendered html
 */
function getPrice(product, commerceSite) {
    let price = null;
    if (product && product.price != null) {
        if (product.online_flag['default@' + commerceSite] === true) {
            price = '$' + product.price.toFixed(2);
        } else if (product.online_flag['default@' + commerceSite] === undefined) {
            if (product.online_flag.default === true) {
                price = '$' + product.price.toFixed(2);
            }
        }
    }
    return price;
}

/**
 * get attribute
 * @param {Object} product - product JSON
 * @param {string} attributeName - website for search
 * @param {string} commerceSite - website for search
 * @returns {Object} attributeValue - whatever the attribute is
 */
function getAttribute(product, attributeName, commerceSite) {
    let attributeValue = null;

    let countryCode = 'default@' + commerceSite;

    if (product[attributeName]) {
        if (product[attributeName][countryCode]) {
            attributeValue = product[attributeName][countryCode];
        } else if (product[attributeName].default) {
            attributeValue = product[attributeName].default;
        } else {
            attributeValue = product[attributeName];
        }
    }
    return attributeValue;
}

/**
 * get replacement parts
 * @param {Object} product - product JSON
 * @param {string} commerceSite - website for search
 * @returns {array} replacementParts - whatever the attribute is
 */
function getReplacementParts(product, commerceSite) {
    let replacementParts = [];

    let replacementPartsValue = getAttribute(product, 'c_replaces-parts', commerceSite);

    if (replacementPartsValue && typeof replacementPartsValue !== 'object') {
        console.log('replacementPartsValue : ' + JSON.stringify(replacementPartsValue));
        replacementParts = replacementPartsValue.split(' ');
    }

    return replacementParts;
}

/**
 * get replacement parts
 * @param {Object} searchTerm - product JSON
 * @param {string} replacedParts - website for search
 * @returns {boolean} isAReplacedPart - whatever the attribute is
 */
function isSearchTermAReplacedPart(searchTerm, replacedParts) {
    let cleanedSearchTerm = searchTerm.trim().toUpperCase();
    let isAReplacedPart = replacedParts.includes(cleanedSearchTerm);
    console.log('isSearchTermAReplacedPart for ' + cleanedSearchTerm + ', found : ' + isAReplacedPart);
    return isAReplacedPart;
}

/**
 * get product price from JSON
 * @param {Object} product - product JSON
 * @returns {string} image - rendered html
 */
function getImage(product) {
    let image = null;
    if (product && product.image && product.image.abs_url != null) {
        image = product.image.abs_url;
    }
    return image;
}

/**
 * check for coupon
 * @returns {boolean} boolean - true or false
 */
function isDiscountOnOrder() {
    // check if discount is on order
    var discounts = document.getElementsByClassName('discountName');
    if (discounts.length > 0) {
        return true;
    }
    return false;
}

/**
 * check for any discount on itemlevel
 * @returns {boolean} boolean - true or false
 */
function isDiscountOnanyItem() {
    // check if discount is on any Line Item
    var discountsItems = $("button[id^='remove-calculate-item-wise-discount-']");
    if (discountsItems.length > 0) {
        return true;
    }
    return false;
}

/**
 * check for coupon
 * @param {string} i_basketId - string needed
 */
function isEntireOrderNoCharged(i_basketId) {
    // globalAllItemsAreNoCharged
    jQuery.ajax({
        type: 'POST',
        url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AjaxGetBasket',
        data: {
            basketId: i_basketId
        },
        success: function (basketJSON) {
            if (basketJSON && basketJSON.basket_id) {
                var itemsOnBasket = basketJSON.product_items.length;
                var noChargeCount = 0;
                basketJSON.product_items.forEach(function (item) {
                    if (item.price_adjustments) {
                        item.price_adjustments.forEach(function (discount) {
                            if (discount.applied_discount.type === 'percentage' && discount.applied_discount.percentage === 100) {
                                noChargeCount++;
                            }
                        });
                    }
                });
                console.log('TEST : ' + itemsOnBasket + ' : ' + noChargeCount);
                if (itemsOnBasket === noChargeCount) {
                    globalAllItemsAreNoCharged = true;
                } else {
                    globalAllItemsAreNoCharged = false;
                }
            }
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        },
        async: false
    });
}


/**
 * submit order discount
 * @param {string} couponCode - promo code / coupon
 * @param {string} basketId - basket id
 */
function submitCoupon(couponCode, basketId) {
    console.log('discountReasonCode : ' + couponCode);
    document.getElementById('couponStatus').innerHTML = 'Submitting Coupon';
    document.getElementById('miniCartStatus').innerHTML = '';
    let couponCodeClean = couponCode.trim();

    if (couponCodeClean.length === 0) {
        document.getElementById('miniCartStatus').innerHTML = 'Coupon code cannot be blank';
        document.getElementById('couponStatus').innerHTML = 'Coupon code cannot be blank';
    } else {
        let spinner = '<div class="spinner-border" role="status"> <span class="sr-only">Loading...</span></div>';
        document.getElementById('miniCartStatus').innerHTML = spinner;

        jQuery.ajax({
            type: 'POST',
            url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AjaxAddCoupon',
            data: {
                couponCode: couponCodeClean,
                basketId: basketId
            },
            success: function (basketJSON) {
                if (basketJSON.success === false) {
                    document.getElementById('miniCartStatus').innerHTML = basketJSON.errorType + ' : ' + basketJSON.errorMessage;
                    document.getElementById('couponStatus').innerHTML = basketJSON.errorType + ' : ' + basketJSON.errorMessage;
                } else if (basketJSON != null) {
                    updateMiniCart(basketJSON);
                    document.getElementById('miniCartStatus').innerHTML = 'Promo Code added to ' + (currentSite === 'epcotus' ? 'cart' : 'basket');
                    document.getElementById('couponStatus').innerHTML = 'Promo Code added to ' + (currentSite === 'epcotus' ? 'cart' : 'Basket');
                } else {
                    document.getElementById('status').innerHTML = 'Update of mini cart did not complete';
                    document.getElementById('couponStatus').innerHTML = 'Error updating Basket';
                }
            },
            error: function (req, status, error) {
                alert(req + ' ' + status + ' ' + error);
            }
        });
    }
}

/**
 * submit order discount
 * @param {string} adjustmentType -type of discount
 * @param {string} discountValue - value of discount
 * @param {string} basketId - basket id
  */
function submitPriceAdjustment(adjustmentType, discountValue, basketId) {
    // console.log('discountReasonCode : ' + discountReasonCode);

    document.getElementById('miniCartStatus').innerHTML = '';
    document.getElementById('priceAdjustmentStatus').innerHTML = '';
    console.log(discountValue);
    let discountOnItems = isDiscountOnanyItem();
    if (discountValue < 0 || discountValue === null || discountValue === '') {
        document.getElementById('miniCartStatus').innerHTML = 'You must enter a discount amount > 0 to apply to order';
        document.getElementById('priceAdjustmentStatus').innerHTML = 'You must enter a discount amount > 0 to apply to order';
    } else if (discountOnItems) {
        alert('There are discount(s) on the items level already - cannot apply discount to an order. Please remove all discounts on item level before continuing to order level');
    } else {
        let spinner = '<div class="spinner-border" role="status"> <span class="sr-only">Loading...</span></div>';
        document.getElementById('miniCartStatus').innerHTML = spinner;

        jQuery.ajax({
            type: 'POST',
            url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AjaxPriceAdjustment',
            data: {
                adjustmentType: adjustmentType,
                discountValue: discountValue,
                basketId: basketId
            },
            success: function (basketJSON) {
                if (basketJSON.success === false) {
                    document.getElementById('priceAdjustmentStatus').innerHTML = basketJSON.errorType + ' : ' + basketJSON.errorMessage;
                    document.getElementById('miniCartStatus').innerHTML = basketJSON.errorType + ' : ' + basketJSON.errorMessage;
                } else if (basketJSON != null) {
                    updateMiniCart(basketJSON);
                    document.getElementById('miniCartStatus').innerHTML = 'Discount added to ' + (currentSite === 'epcotus' ? 'cart' : 'basket');
                    document.getElementById('priceAdjustmentStatus').innerHTML = 'Discount added to ' + (currentSite === 'epcotus' ? 'cart' : 'basket');
                } else {
                    document.getElementById('status').innerHTML = 'Update of mini cart did not complete';
                    document.getElementById('priceAdjustmentStatus').innerHTML = 'Update of mini cart did not complete';
                }
            },
            error: function (req, status, error) {
                alert(req + ' ' + status + ' ' + error);
            }
        });
    }
}

/**
 * add to cart process
 * @param {string} productId - product id to be added to cart
 * @param {string} basketId - basket id for the customer
 * @param {string} commerceStore - commerce site
 * @param {integer} quantity - number to add
 */
function addToCart(productId, basketId, commerceStore, quantity) {
    console.log(' addToCart ' + productId);
    var productJSON = productMap.get(productId);
    console.log(productJSON);
    let quantityToAdd = 1;
    if (quantity) {
        quantityToAdd = quantity;
    }
    jQuery.ajax({
        type: 'POST',
        url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AjaxAddToBasket',
        data: {
            basketId: basketId,
            productJSONString: JSON.stringify(productJSON),
            commerceStore: commerceStore,
            quantity: quantityToAdd
        },
        success: function (basketJSON) {
            let errorId = '#status-' + productId;
            console.log(errorId);

            if (basketJSON.addToCartError) {
                $('#miniCartStatus').text('Error adding to cart. ' + basketJSON.addToCartError);
                console.log(errorId);
                $(errorId).html('Error adding to cart <br/>' + basketJSON.addToCartError);
            } else if (basketJSON.addToCartError === false) {
                $('#miniCartStatus').text(productJSON.id + ' added to ' + (currentSite === 'epcotus' ? 'cart' : 'basket'));
                $(errorId).html('Added successfully');
                console.log('success ' + basketJSON);
                updateMiniCart(basketJSON);
            } else {
                $('#miniCartStatus').text('Error adding to cart. Unknown error');
                console.log(errorId);
                $(errorId).html('Error adding to cart <br/>Unknown error');
            }
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        }

    });
}

/**
 * remove price adjustment
 * @param {string} basketId - basket id for the customer
 * @param {string} adjustmentId - price adjustment id
 */
function removePriceAdjustment(basketId, adjustmentId) {
    console.log(' removePriceAdjustment basketId : ' + basketId + ', adjustmentId : ' + adjustmentId);

    jQuery.ajax({
        type: 'POST',
        async: false,
        url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AjaxRemovePriceAdjustment',
        data: {
            basketId: basketId,
            adjustmentId: adjustmentId
        },
        success: function (basketJSON) {
            console.log('success ' + basketJSON);
            updateMiniCart(basketJSON);
            $('#miniCartStatus').text('Discount successfully removed');
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        }

    });
}

/**
 * remove noCharge
 * @param {string} basketId - basket id for the customer
 * @param {string} adjustmentId - price adjustment id
 * @param {string} removeFlag - price adjustment remove flag
 */
function removeNoCharge(basketId, adjustmentId, removeFlag) {
    console.log(' removeNoCharge basketId : ' + basketId + ', adjustmentId : ' + adjustmentId);

    jQuery.ajax({
        type: 'POST',
        async: false,
        url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AjaxRemoveNoChargeBasketOrItem',
        data: {
            basketId: basketId,
            adjustmentId: adjustmentId
        },
        success: function (basketJSON) {
            console.log('success ' + basketJSON);
            updateMiniCart(basketJSON);
            if (!adjustmentId) {
                $('#miniCartStatus').text('No charge(s) successfully removed from entire order');
            } else if (removeFlag) {
                $('#miniCartStatus').text('Discount successfully removed from item');
            } else {
                $('#miniCartStatus').text('No charge successfully removed from item');
            }
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        }

    });
}

/**
 * remove price adjustment
 * @param {string} basketId - basket id for the customer
 * @param {string} couponCode - coupon
 */
function removeCoupon(basketId, couponCode) {
    console.log(' removeCoupon basketId : ' + basketId + ', couponCode : ' + couponCode);

    jQuery.ajax({
        type: 'POST',
        async: false,
        url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AjaxRemoveCoupon',
        data: {
            basketId: basketId,
            couponCode: couponCode
        },
        success: function (basketJSON) {
            $('#miniCartStatus').text('Discount removed');
            console.log('success ' + basketJSON);
            updateMiniCart(basketJSON);
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        }

    });
}


/**
 * remove product from cart
 * @param {string} basketId - basket id for the customer
 * @param {string} itemId - itemId in cart to delete
 */
function removeBasketItem(basketId, itemId, CARBProductRemoved, aletrnativeProductId) {
    console.log(' removeBasketItem basketId : ' + basketId + ', itemId : ' + itemId);
    var dataObj = {}
    if(isCARBEnabled == 'true'){
        dataObj.basketId = basketId,
        dataObj.itemId = itemId,
        dataObj.aletrnativeProductId = aletrnativeProductId,
        dataObj.CARBProductRemoved = CARBProductRemoved,
        dataObj.shippingState = $('#shipping_state').val()
    } else {
        dataObj.basketId = basketId,
        dataObj.itemId = itemId
    }

    jQuery.ajax({
        type: 'POST',
        url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AjaxRemoveBasketItem',
        data: dataObj,
        success: function (basketJSON) {
            $('#miniCartStatus').text('Item removed from basket');
            $('#mainCartDiv').data('globalCartIsEmpty', 'true');
            console.log('success ' + basketJSON);
            
            updateMiniCart(basketJSON);
            if(isCARBEnabled == 'true'){
                $('#miniCartItems .product').removeClass('carb-item');
                $('#validate-address-btn').removeAttr('disabled');
                $('.CARBSuggestion').remove();
                $('.CARBCompliantMessage').removeClass('d-block');
                $('.CARBCompliantMessage').addClass('d-none');
                $('#miniCartItems .quantity .quantity-input').removeAttr('disabled');
                $('#miniCartItems .updateButton').removeAttr('disabled');
                $('#miniCartItems .noChargeButton').removeAttr('disabled');
                $('#miniCartItems .calculateItemWiseDiscount').removeAttr('disabled');
                $('#miniCartItems .itemDiscountValue').removeAttr('disabled');
                $('#miniCartItems .itemdiscountType').removeAttr('disabled');
                $('#miniCartItems .removeButton').removeClass('btn-primary');
            }
            
            if ( isCARBEnabled == 'true' && CARBProductRemoved){
                $('#carb-edit').trigger('submit');
            } else {
                if (!basketJSON.product_items || basketJSON.product_items.length === 0) {
                    if ($('#pageName') && $('#pageName').val() === 'address') {
                        console.log('no items left in cart for address');
                        console.log($('#addressValidationDiv'));
                        $('#addressValidationDiv').hide();
                        $('#mainCartDiv').hide();
                        console.log($('#returnToProductSearch'));
                        $('#returnToProductSearch').removeClass('hidden');
                    }
                    if ($('#pageName') && $('#pageName').val() === 'discounts') {
                        console.log('no items left in cart for discounts');
                        console.log($('#discountsDiv'));
                        $('#discountsDiv').hide();
                        $('#mainCartDiv').hide();
                        console.log($('#returnToProductSearch'));
                        $('#returnToProductSearch').removeClass('hidden');
                    }
                }
            }
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        }

    });
}

/**
 * update product quantity from basket
 * @param {string} basketId - basket id for the customer
 * @param {string} itemId - itemId in cart to update
 * @param {string} quantity - quantity to update
 * @param {string} price_after_item_discount - price after discount
 */
function updateBasketItem(basketId, itemId, quantity, price_after_item_discount) {
    console.log(' updateBasketItem basketId : ' + basketId + ', itemId : ' + itemId + ', quantity : ' + quantity);

    jQuery.ajax({
        type: 'POST',
        url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AjaxUpdateBasketItem',
        data: {
            basketId: basketId,
            itemId: itemId,
            quantity: quantity,
            price_after_item_discount: price_after_item_discount
        },
        success: function (basketJSON) {
            $('#miniCartStatus').text('Quantity updated to ' + quantity);
            console.log('success ' + basketJSON);
            updateMiniCart(basketJSON);
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        }

    });
}

/**
 * update product quantity from basket
 * @param {string} basketId - basket id for the customer
 * @param {array} itemsToUpdate - all items to update
 * @param {string} noChargeModelNumber - no charge model code to be added to each item
 * @param {string} noChargeSerialNumber - no charge serial code to be added to each item
 * @param {string} noChargeReasonCode - no charge reason code to be added to each item
 */
function addNoChargeReasonCodesToOrder(basketId, itemsToUpdate, noChargeModelNumber, noChargeSerialNumber, noChargeReasonCode) {
    // i_basketId, itemsToUpdate, noChargeModelNumber, noChargeSerialNumber, noChargeReasonCode
    var serializedArray = JSON.stringify(itemsToUpdate);
    jQuery.ajax({
        type: 'POST',
        url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AjaxUpdateBasketWithNoChargeReasonCodes',
        data: {
            basketId: basketId,
            itemArray: serializedArray,
            noChargeModelNumber: noChargeModelNumber,
            noChargeSerialNumber: noChargeSerialNumber,
            noChargeReasonCode: noChargeReasonCode
        },
        success: function (basketJSON) {
            globalNoChargeAddedToBasket = true;
            console.log('No charge added to basket => ' + globalNoChargeAddedToBasket);
            updateMiniCart(basketJSON);
            $('#miniCartStatus').text('No charge reason code successfully added to ' + (currentSite === 'epcotus' ? 'cart' : 'basket'));
            document.getElementById('noChargeStatusTextDiv').textContent = 'No charge reason code successfully added to ' + (currentSite === 'epcotus' ? 'cart' : 'basket');
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        }

    });
}

/**
 * get basketJSON from OCAPI
 * @param {Object} i_basketId - basketId for basket
 * @param {string} noChargeModelNumber - no charge model code to be added to each item
 * @param {string} noChargeSerialNumber - no charge serial code to be added to each item
 * @param {string} noChargeReasonCode - no charge reason code to be added to each item
 */
function getBasketForNoChargeCodes(i_basketId, noChargeModelNumber, noChargeSerialNumber, noChargeReasonCode) {
    console.log('requesting basket for ' + i_basketId);
    jQuery.ajax({
        type: 'POST',
        url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AjaxGetBasket',
        data: {
            basketId: i_basketId
        },
        success: function (basketJSON) {
            if (basketJSON && basketJSON.basket_id) {
                globalBasketId = basketJSON.basket_id;
                console.log('basketId : ' + globalBasketId);
                var itemsInBasket = basketJSON.product_items;
                var itemsToUpdate = [];
                itemsInBasket.forEach(item => {
                    var itemId = item.item_id;
                    var quantity = item.quantity;
                    itemsToUpdate.push({ itemId: itemId, quantity: quantity });
                });
                $('#miniCartStatus').text('Adding no charge reason code to basket - please wait...');
                addNoChargeReasonCodesToOrder(i_basketId, itemsToUpdate, noChargeModelNumber, noChargeSerialNumber, noChargeReasonCode);
            }
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        }
    });
}

/**
 * search for product via ocapi
 * @param {string} searchTerm - product search term
 */
function productSearch(searchTerm) {
    console.log('in line product search ' + searchTerm);
    let spinner = '<div class="spinner-border" role="status"> <span class="sr-only">Loading...</span></div>';
    document.getElementById('productResults').innerHTML = spinner;
    console.log(searchTerm);
    $('#miniCartStatus').text('Searching for ' + searchTerm);
    jQuery.ajax({
        type: 'POST',
        url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AjaxProductSearch',
        data: {
            searchTerm: searchTerm
        },
        success: function (searchJSON) {
            $('#miniCartStatus').text('');
            let automaticallyAddIdToCart = null;
            console.log(searchJSON);

            // let html = '';
            let commerceSite = searchJSON.commerceSite;
            console.log('commerceSite : ' + commerceSite);

            var productSearchDiv = document.getElementById('productResults');

            if (searchJSON.hits && searchJSON.hits.length > 0) {
                let numberOfResults = searchJSON.hits.length;
                productSearchDiv.innerHTML = '<span> hits : ' + searchJSON.hits.length + '</span>';
                if (numberOfResults === 25) {
                    // alert('Your search resulted in more than 25 rows and the results have been truncated. Please try again with more specific search parameters');
                    productSearchDiv.innerHTML = '<span> hits : ' + searchJSON.hits.length + ' (Your search resulted in more than 25 rows and the results have been truncated. Please try again with more specific search parameters)</span>';
                }
                searchJSON.hits.unshift(searchJSON.hits.splice(searchJSON.hits.findIndex(item => item.id.toUpperCase() === searchTerm.toUpperCase()), 1)[0]);
                console.log(searchJSON.hits);
                // html += 'hits : ' + searchJSON.hits.length;
                productMap = new Map();

                searchJSON.hits.forEach(product => {
                    console.log(product);
                    var id = product.id;
                    console.log(id);
                    productMap.set(id, product);
                    let productSku = getProductSku(product);
                    let longDescription = getLongDescription(product);
                    let price = getPrice(product, commerceSite);
                    let image = getImage(product);
                    let productName = getProductName(product);
                    const productSearchTemplate = document.getElementById('product-search-row-template');
                    const productSearchTemplateInstance = document.importNode(productSearchTemplate.content, true);
                    productSearchTemplateInstance.querySelector('.addToCartbutton').id = id;
                    productSearchTemplateInstance.querySelector('.addToCartStatus').id = 'status-' + id;
                    productSearchTemplateInstance.querySelector('.productQuantity').id = 'quantity-' + id;
                    productSearchTemplateInstance.querySelector('.longDescription').innerHTML = longDescription;
                    productSearchTemplateInstance.querySelector('.productName').textContent = productName;
                    let ltlRequired = false;
                    if (price) {
                        productSearchTemplateInstance.querySelector('.price').textContent = price;
                    } else {
                        var addToCartElem = productSearchTemplateInstance.querySelector('.addToCartbutton');
                        addToCartElem.parentNode.removeChild(addToCartElem);
                    }

                    if (image) {
                        productSearchTemplateInstance.querySelector('.productImage').src = image;
                    } else {
                        var elem = productSearchTemplateInstance.querySelector('.productImage');
                        elem.parentNode.removeChild(elem);
                    }

                    let replacementParts = getReplacementParts(product, commerceSite);

                    if (replacementParts.length > 0) {
                        let productReplaced = isSearchTermAReplacedPart(searchTerm, replacementParts);
                        if (productReplaced) {
                            productSearchTemplateInstance.querySelector('.productReplaces').textContent = 'This product replaces ' + searchTerm;
                        }
                    }

                    let ltlAttribute = getAttribute(product, 'c_ltl-shipment-required', commerceSite);
                    if (ltlAttribute === 'true' || ltlAttribute === true) {
                        ltlRequired = true;
                    }

                    if (ltlRequired) {
                        productSearchTemplateInstance.querySelector('.ltl').textContent = 'LTL required';
                    }

                    let online = false;

                    let onlineAttribute = getAttribute(product, 'online_flag', commerceSite);

                    if (onlineAttribute === 'true' || onlineAttribute === true) {
                        online = true;
                    }

                    if (!online) {
                        productSearchTemplateInstance.querySelector('.notAvailable').textContent = 'Product not online for ' + commerceSite;
                    }

                    // notAvailable

                    let dfEligible = false;

                    let dfEligibleAttribute = getAttribute(product, 'c_edealer-eligible', commerceSite);

                    if (dfEligibleAttribute === 'true' || dfEligibleAttribute === true) {
                        dfEligible = true;
                    }

                    let dealerRequired = false;

                    let dealerRequiredAttribute = getAttribute(product, 'c_dealer-required', commerceSite);

                    if (dealerRequiredAttribute === 'true' || dealerRequiredAttribute === true) {
                        dealerRequired = true;
                    }

                    // let inStock = false;

                    let commerceCloudInventory = 0;
                    if (product.ats && parseInt(product.ats, 10) > 0) {
                        commerceCloudInventory = parseInt(product.ats, 10);
                    }

                    let mtdInventory = 0;
                    if (product.actualMTDInventory) {
                        mtdInventory = product.actualMTDInventory;
                    }
                    let productType = getAttribute(product, 'c_product-type');
                    let isBackOrderedItem = false;
                    console.log('product type ' + productType);

                    if (price) {
                        if (commerceCloudInventory > 0) {
                            if (mtdInventory > 0) {
                                productSearchTemplateInstance.querySelector('.stock').textContent = 'In Stock : ' + mtdInventory;
                                // inStock = true;
                            } else {
                                productSearchTemplateInstance.querySelector('.stock').textContent = 'Back ordered';
                                isBackOrderedItem = true;
                            }

                            if ((productType === 'PARTS' || productType === 'ACCESSORY') && commerceCloudInventory > 0 && !isBackOrderedItem) {
                                productSearchTemplateInstance.querySelector('.productExp').textContent = 'Expedited Shipping Eligible';
                            }
                            if (dealerRequired) {
                                productSearchTemplateInstance.querySelector('.dealerFulfillment').textContent = 'Dealer Required';
                            } else if (dfEligible) {
                                productSearchTemplateInstance.querySelector('.dealerFulfillment').textContent = 'Dealer Fulfilled';
                            }

                            if (numberOfResults === 1 && searchTerm === id) {
                                automaticallyAddIdToCart = id;
                            }
                        } else {
                            productSearchTemplateInstance.querySelector('.stock').textContent = 'Out of Stock';
                            if (productType !== 'MANUALS') {
                                productSearchTemplateInstance.querySelector('.addToCartbutton').remove();
                                productSearchTemplateInstance.querySelector('.quantityLabel').remove();
                                productSearchTemplateInstance.querySelector('.productQuantity').remove();
                            }
                        }
                    } else {
                        productSearchTemplateInstance.querySelector('.stock').textContent = '';
                        productSearchTemplateInstance.querySelector('.productExp').textContent = '';
                    }

                    productSearchTemplateInstance.querySelector('.productSku').textContent = 'Item #: ' + productSku;
                    productSearchDiv.appendChild(productSearchTemplateInstance);
                });

                if (automaticallyAddIdToCart) {
                    console.log('** auto adding to cart ' + automaticallyAddIdToCart);
                    addToCart(automaticallyAddIdToCart, globalBasketId, globalCommerceSite, 1);
                }
            } else {
                productSearchDiv.innerHTML = '<span> No Results found </span>';
                // html = 'No products found';
            }
            // document.getElementById('productResults').innerHTML = html;
        },
        error: function (req, status, error) {
            $('#miniCartStatus').text('Error searching : ' + error);
            alert(req + ' ' + status + ' ' + error);
        }
    });
}

$(function () {
    var orderNumber = null;

    console.log('window -> on load - epcot-minicart.js');
    $('#noChargeReasonCodeDiv').hide();
    $('#shippingAlreadyWaived').hide();
    $('#removeNoChargeOrder').hide();

    globalShowNoChargePermission = document.getElementById('canSeeNoChargeButton').value;
    globalShowDiscountPermission = document.getElementById('canSeeDiscountButton').value;
    console.log('Can see no charge => ' + globalShowNoChargePermission);
    console.log('Can see discounts => ' + globalShowDiscountPermission);
    var noChargePdict = document.getElementById('canSeeNoChargeButton');
    var discountPdict = document.getElementById('canSeeDiscountButton');

    noChargePdict.remove();
    discountPdict.remove();

    if (document.getElementById('globalBasketId')) {
        globalBasketId = document.getElementById('globalBasketId').value;
    }
    if (document.getElementById('globalCommerceSite')) {
        globalCommerceSite = document.getElementById('globalCommerceSite').value;
    }

    if (document.getElementById('globalOrderNumber')) {
        orderNumber = document.getElementById('globalOrderNumber').value;
    }

    console.log('globalBasketId : ' + globalBasketId + ', globalCommerceSite :' + globalCommerceSite);

    if (globalBasketId) {
        getBasket(globalBasketId);
    } else {
        console.log('globalBasketId is null. do not fetch basket');
        if (orderNumber) {
            getOrder(orderNumber);
        }
    }

    $(function () {
        console.log('window -> on load');
    });
});


/**
 * submit shipping method
 * @param {string} basketId - promo code / coupon
 * @param {string} shippingMethod - basket id
 */
function setShippingMethod(basketId, shippingMethod) {
    console.log('shippingMethod : ' + shippingMethod);

    document.getElementById('miniCartStatus').innerHTML = '';

    let spinner = '<div class="spinner-border" role="status"> <span class="sr-only">Loading...</span></div>';
    document.getElementById('miniCartStatus').innerHTML = spinner;

    jQuery.ajax({
        type: 'POST',
        url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AjaxAssignShippingMethod',
        data: {
            shippingMethod: shippingMethod,
            basketId: basketId
        },
        success: function (basketJSON) {
            if (basketJSON.success === false) {
                document.getElementById('miniCartStatus').innerHTML = basketJSON.errorType + ' : ' + basketJSON.errorMessage;
            } else if (basketJSON != null) {
                updateMiniCart(basketJSON);
                let shippingMethodName = document.getElementById('globalShippingMethod').value;

                document.getElementById('miniCartStatus').innerHTML = 'Shipping method set to ' + shippingMethodName;
                document.getElementById('shippingStatus').innerHTML = 'Shipping method set to ' + shippingMethodName;
            } else {
                document.getElementById('status').innerHTML = 'Shipping method did not complete';
            }
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        }
    });
}

/**
 *
 * @param {string} zipCode - zipcode needed to set the dummy address for the order
 * @param {string} stateOrProvinceCode - state or province needed for the tax call
 * @param {string} countryCode - country needed for the call
 */
function shippingEstimate(zipCode, stateOrProvinceCode, countryCode) {
    console.log('Shipping estimate -> zipCode: ' + zipCode + ' , state/province: ' + stateOrProvinceCode + ', BasketID: ' + globalBasketId);
    jQuery.ajax({
        type: 'POST',
        url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-EstimateAddressSubmit',
        data: {
            basketId: globalBasketId,
            commerceStore: globalCommerceSite,
            countryCode: countryCode,
            zipCode: zipCode,
            stateOrProvinceCode: stateOrProvinceCode,
            email: 'ESTIMATEONLY@mtdproducts.com'
        },
        success: function (basketJSON) {
            updateMiniCart(basketJSON);
            $('#miniCartStatus').text('Shipping estimate successfully applied');
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        }
    });
}

/**
 * noChargeBasketOrItem - no charges either the entire cart OR the individual item passed to the function
 * @param {*} basketId - basketID for the basket to apply the no charge to
 * @param {*} itemId - itemID for the item to have the no charge applied to. If null, applies to the entire cart
 * @param {*} adjustmentType - itemID for the item to have the no charge applied to. If null, applies to the entire cart
 * @param {*} discountValue - discountValue for the item to have the no charge applied to. If null, applies to the entire cart
 * @param {*} isDiscountApply - isDiscountApply for the item to have the no charge applied to. If null, applies to the entire cart
 */
function noChargeBasketOrItem(basketId, itemId, adjustmentType, discountValue, isDiscountApply) {
    let itemPrice = null;
    if (itemId && isDiscountApply && (adjustmentType === 'amount')) {
        itemPrice = document.getElementById('miniCart-price-' + itemId).innerHTML;
        itemPrice = itemPrice ? itemPrice.split('$')[1] : itemPrice;
    }
    if (isDiscountApply && (discountValue < 0 || discountValue === null || discountValue === '')) {
        document.getElementById('miniCartStatus').innerHTML = 'You must enter a discount amount > 0 to apply to item';
        document.getElementById('item-Level-Discount-' + itemId).innerHTML = 'You must enter a discount amount > 0 to apply to item';
    } else if (isDiscountApply && (adjustmentType === 'amount') && (parseFloat(discountValue) >= parseFloat(itemPrice))) {
        document.getElementById('miniCartStatus').innerHTML = 'You must enter a discount amount less than item price';
        document.getElementById('item-Level-Discount-' + itemId).innerHTML = 'You must enter a discount amount less than item price';
    } else if (isDiscountApply && (adjustmentType === 'percentage') && (discountValue >= 100)) {
        document.getElementById('miniCartStatus').innerHTML = 'You must enter a discount less than 100 percentage';
        document.getElementById('item-Level-Discount-' + itemId).innerHTML = 'You must enter a discount less than 100 percentage';
    } else {
        // TODO: This is the no charge method to keep
        console.log('noChargeBasketOrItem called => basketId : ' + basketId + ' | itemId: ' + itemId);
        jQuery.ajax({
            type: 'POST',
            url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AjaxAddNoChargeBasketOrItem',
            data: {
                basketId: basketId,
                itemId: itemId,
                adjustmentType: adjustmentType,
                discountValue: discountValue,
                isDiscountApply: isDiscountApply
            },
            success: function (basketJSON) {
                updateMiniCart(basketJSON);
                if (!itemId) {
                    $('#miniCartStatus').text('No charge successfully applied to entire order');
                } else if (!isDiscountApply) {
                    $('#miniCartStatus').text('No charge successfully applied to item');
                } else {
                    $('#miniCartStatus').text('Discount successfully applied to item');
                    if (adjustmentType === 'amount') {
                        document.getElementById('item-Level-Discount-' + itemId).innerHTML = 'Discount successfully applied to item = $' + discountValue;
                    } else {
                        document.getElementById('item-Level-Discount-' + itemId).innerHTML = 'Discount successfully applied to item = ' + discountValue + '%';
                    }
                }
            },
            error: function (req, status, error) {
                alert(req + ' ' + status + ' ' + error);
            }
        });
    }
}
/**
 * addNotesToOrder
 * @param {string} basketId - basketID
 * @param {string} notes1 - first row of notes
 * @param {string} notes2 - second row of notes
 * @param {boolean} isAudit - determine if we're on the audit page or not
 * @param {orderNumber} orderNumber - orderNumber needed if on the audit page
 */
function addNotesToOrder(basketId, notes1, notes2, isAudit, orderNumber) {
    console.log('is Audit => ' + isAudit);
    console.log('orderNumber => ' + orderNumber);
    jQuery.ajax({
        type: 'POST',
        url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AjaxAddNotesToOrder',
        data: {
            basketId: basketId,
            notes1: notes1,
            notes2: notes2,
            isAudit: isAudit,
            orderNumber: orderNumber
        },
        success: function (basketJSON) {
            if (isAudit) {
                $('.notesSubtext').text('Notes successfully updated on order');
            } else {
                updateMiniCart(basketJSON);
                $('#miniCartStatus').text('Notes successfully added to the ' + (currentSite === 'epcotus' ? 'cart' : 'basket'));
            }
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        }
    });
}

/**
 * updateCaseNumberToOrder
 * @param {number} caseNumber - caseNumber
 * @param {string} basketId - basketID
 */
function updateCaseNumberToBasket(caseNumber, basketId) {
    jQuery.ajax({
        type: 'POST',
        url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-UpdateCaseNumberTOBasket',
        data: {
            basketId: basketId,
            caseNumber: caseNumber
        },
        success: function (basketJSON) {
            if (!basketJSON.c_SfdcCaseNumber) {
                document.getElementById('miniCartStatus').innerHTML = 'Details Clear';
                document.getElementById('caseStatus').innerHTML = 'Details Clear';
            }
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        }
    });
}

if(isCARBEnabled == 'true' && aletrnativeProdId && isCARBProductRemoved ){
    productSearch(aletrnativeProdId);
    document.getElementById('hiddenSite').value = '';
    document.getElementById('CARBProductRemoved').value = '';
    document.getElementById('aletrnativeProductId').value = '';
}

/**
 * updateCARTCARBSEction
 * @param {string} productId - productId
 */

function updateCARTCARBSection(productId) {
    $.ajax({
        type: 'POST',
        url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AjaxProductSearch',
        data: {
            searchTerm: productId
        },
        success: function (res) {
            console.log('product search' + productId +'response :' + res);
            var productHit = res.hits
            if(productHit) {
                for(var k = 0; k < productHit.length; k++ ){
                    if(productHit[k].id == productId){
                        var mainProd = productHit[k]
                        var carbSection
                        if(mainProd.c_CARBCompliantItem){
                            $('#product-'+ productId +'').addClass('carb-item');
                            carbSection = '<div class="alert CARBSuggestion">' +
                            '<p class="carb-msg">This model cannot be shipped to an address in California. If you have questions, please contact customer service.<br><br> </div>'
                            $('#product-'+ productId +'').append(carbSection);
                            $('#product-'+ productId +' .CARBSuggestion').append('<div class="alterProduct"> </div>');
                           
                        }
                    }
                }
            }
        },
        error: function () {
            console.log('product search error');
        }
    });
}


module.exports = {
    methods: {
        generateBasketItem: generateBasketItem,
        updateMiniCart: updateMiniCart,
        getBasket: getBasket,
        addToCart: addToCart,
        getBasketForNoChargeCodes: getBasketForNoChargeCodes,
        addNoChargeReasonCodesToOrder: addNoChargeReasonCodesToOrder,
        shippingEstimate: shippingEstimate,
        setEstimateText: setEstimateText,
        updateNoChargeOrder: updateNoChargeOrder,
        noChargeBasketOrItem: noChargeBasketOrItem,
        addNotesToOrder: addNotesToOrder,
        isDiscountOnOrder: isDiscountOnOrder,
        isEntireOrderNoCharged: isEntireOrderNoCharged,
        isDiscountOnanyItem: isDiscountOnanyItem,
        removeBasketItem: removeBasketItem,
        productSearch: productSearch
    },

    addToCartFunction: function () {
        $('#productResults').on('click', 'button', function () {
            console.log(this.id);
            let errorId = '#status-' + this.id;
            console.log(errorId);
            let quantityId = '#quantity-' + this.id;
            let quantityVal = $(quantityId).val();
            console.log(quantityVal);
            $(errorId).html('Adding to ' + (currentSite === 'epcotus' ? 'cart ' : 'basket ') + quantityVal);
            let commerceStore1 = document.getElementById('commerceStore').value;
            addToCart(this.id, globalBasketId, commerceStore1, quantityVal);
        });
    },

    productSearchButton: function () {
        $('#productSearch').on('click', function () {
            // console.log(event);
            let productSearchTerm = $('#searchTerm').val();
            productSearch(productSearchTerm);
        });
    },

    searchTermField: function () {
        $('#searchTerm').on('keyup', function (env) {
            if (env.which === 13) {
                let productSearchTerm = $('#searchTerm').val();
                productSearch(productSearchTerm);
            }
        });
    },

    discountValueField: function () {
        $('#discountValue').on('keyup', function (env) {
            if (env.which === 13) {
                var adjustmentType = $('#adjustmentType').val();
                var discountValue = $('#discountValue').val();
                var basketId = $('#globalBasketId').val();
                console.log('adjustmentType : ' + adjustmentType);
                console.log('discountValue : ' + discountValue);
                isEntireOrderNoCharged(basketId);
                if (globalAllItemsAreNoCharged) {
                    document.getElementById('miniCartStatus').innerHTML = 'Cannot apply a discount to a no charge order';
                    document.getElementById('priceAdjustmentStatus').innerHTML = 'Cannot apply a discount to a no charge order';
                } else {
                    submitPriceAdjustment(adjustmentType, discountValue, basketId);
                }
            }
        });
    },

    productAdjustmentAddButton: function () {
        $('.addDiscountButton').on('click', function () {
            var adjustmentType = $('#adjustmentType').val();
            var discountValue = $('#discountValue').val();
            var basketId = $('#globalBasketId').val();
            console.log('adjustmentType : ' + adjustmentType);
            console.log('discountValue : ' + discountValue);
            isEntireOrderNoCharged(basketId);
            if (globalAllItemsAreNoCharged) {
                document.getElementById('miniCartStatus').innerHTML = 'Cannot apply a discount to a no charge order';
                document.getElementById('priceAdjustmentStatus').innerHTML = 'Cannot apply a discount to a no charge order';
            } else {
                submitPriceAdjustment(adjustmentType, discountValue, basketId);
            }
        });
    },

    couponCodeField: function () {
        $('#couponCode').on('keyup', function (env) {
            if (env.which === 13) {
                var couponCode = $('#couponCode').val();
                var basketId = $('#globalBasketId').val();
                // productSearch(productSearchTerm);
                console.log('couponCode : ' + couponCode);
                submitCoupon(couponCode, basketId);
            }
        });
    },

    addCouponButton: function () {
        $('.addCouponButton').on('click', function () {
            var couponCode = $('#couponCode').val();
            var basketId = $('#globalBasketId').val();
            // productSearch(productSearchTerm);
            console.log('couponCode : ' + couponCode);
            submitCoupon(couponCode, basketId);
        });
    },

    waiveShippingButton: function () {
        $('.waiveShippingButton').on('click', function () {
            // console.log(event);
            var couponCode = $('#waiveShippingCode').val();
            var basketId = $('#globalBasketId').val();
            // productSearch(productSearchTerm);
            console.log('couponCode : ' + couponCode);
            submitCoupon(couponCode, basketId);
        });
    },

    noChargeEntireOrderButton: function () {
        $('.noChargeOrderButton').on('click', function () {
            console.log('Applying no charge to entire order');
            let basketId = $('#globalBasketId').val();
            let isThereACouponOnTheOrder = isDiscountOnOrder();
            let discountOnItems = isDiscountOnanyItem();
            if (basketId === '') {
                alert('Theres nothing in the cart currently');
            } else if (isThereACouponOnTheOrder) {
                alert('There are discount(s) on the order already - cannot apply a no charge to an order that already has discounts applied. Please remove all discounts before continuing.');
            } else if (discountOnItems) {
                alert('There are discount(s) on the items already - cannot apply a no charge to an order that already has discounts applied. Please remove all discounts before continuing.');
            } else {
                $('#miniCartStatus').text('Applying no charge to entire order ...');
                noChargeBasketOrItem(basketId, null, 'percentage', 100, false);
            }
        });
    },

    removeNoChargeEntireOrderButton: function () {
        $('.removeNoChargeOrderButton').on('click', function () {
            console.log('Removing no charge to entire order');
            $('#miniCartStatus').text('Removing no charge from entire order ...');
            let basketId = $('#globalBasketId').val();
            // removePriceAdjustment(basketId, null);
            removeNoCharge(basketId, null, null);
        });
    },

    miniCartButtons: function () {
        $('#miniCartItems').on('click', 'button', function () {
            console.log(this.id);
            let buttonId = this.id;
            let basketId = $('#globalBasketId').val();
            if (buttonId.startsWith('update-item-')) {
                let itemId = buttonId.substring(12);
                console.log('update item with id : ' + itemId);
                let quantityField = '#quantity-' + itemId;
                let quantity = parseInt($(quantityField).val(), 10);
                $('#miniCartStatus').text('Updating quantity ...');
                updateBasketItem(basketId, itemId, quantity);
            } else if (buttonId.startsWith('remove-item-')) {
                let itemId = buttonId.substring(12);
                console.log('remove item with id : ' + itemId);
                $('#miniCartStatus').text('Removing item from basket ...');
                removeBasketItem(basketId, itemId);
            } else if (buttonId.startsWith('remove-adjustment-')) {
                let adjustmentId = buttonId.substring(18);
                console.log('remove adjustment with id : ' + adjustmentId);
                removePriceAdjustment(basketId, adjustmentId);
            } else if (buttonId.startsWith('remove-coupon-')) {
                let couponCode = buttonId.substring(14);
                console.log('remove coupon with code : ' + couponCode);
                removeCoupon(basketId, couponCode);
            } else if (buttonId.startsWith('noCharge-item-')) {
                let itemId = buttonId.substring(14);
                console.log('add no charge to item id : ' + itemId);
                // addNoChargeToBasketItem(basketId, itemId);
                let discountValue = 100;
                noChargeBasketOrItem(basketId, itemId, 'percentage', discountValue, false);
            } else if (buttonId.startsWith('remove-noCharge-item-')) {
                let couponId = buttonId.substring(21);
                console.log('removing no charge id : ' + couponId);
                removeNoCharge(basketId, couponId, null);
            } else if (buttonId.startsWith('calculate-item-wise-discount-')) {
                // Calculate Item Wise Discount
                let itemId = buttonId.substring(29);
                let adjustmentType = '#itemDiscountType-' + itemId;
                adjustmentType = $(adjustmentType + ' :selected').text();
                let discountValue = '#itemdiscountValue-' + itemId;
                discountValue = $(discountValue).val();
                console.log('itemDiscountType :' + adjustmentType);
                console.log('itemdiscountValue :' + discountValue);
                let applyItemDiscount = true;
                noChargeBasketOrItem(basketId, itemId, adjustmentType, discountValue, applyItemDiscount);
            } else if (buttonId.startsWith('remove-calculate-item-wise-discount-')) {
                let itemId = buttonId.substring(36);
                console.log('remove-calculate-item-wise-discount as item id : ' + itemId);
                var removeFlag = true;
                removeNoCharge(basketId, itemId, removeFlag);
            } else {
                console.log(buttonId);
            }
        });
    },

    miniCartMainCTA: function () {
        $('#checkoutForm').on('click', 'button', function () {
            console.log('minicart clicked');
            var globalCartIsEmpty = $('#mainCartDiv').data('globalCartIsEmpty');
            if (globalCartIsEmpty !== 'false') {
                alert('Basket is empty - Cannot continue to checkout with no items in basket');
            } else {
                $('#checkoutForm').submit();
            }
        });
    },

    shippingMethodChange: function () {
        $('#shippingMethod').on('change', function () {
            let basketId = $('#globalBasketId').val();
            let val = $('#shippingMethod').val();
            console.log('shipping method change -> ' + val);
            if (val.length > 0) {
                console.log(val.length);
                setShippingMethod(basketId, val);
            }
        });
    },

    shippingMethodChangeNoCharge: function () {
        $('#shippingMethodNoCharge').on('change', function () {
            let basketId = $('#globalBasketId').val();
            let val = $('#shippingMethodNoCharge').val();
            console.log('shipping method change -> ' + val);
            if (val.length > 0) {
                console.log(val.length);
                setShippingMethod(basketId, val);
            }
        });
    },

    showNoChargeModals: function () {
        $('#showModalLink').on('click', function (e) {
            e.preventDefault();
            $('#noChargeReasonCodesModal').modal('show');
        });
    },

    showEnterPostalCodeModal: function () {
        $('#estimateButton').on('click', function (e) {
            // check if basket exists first - you cannot apply an estimate to a basket that doesn't exist
            if (globalBasketId === '') {
                alert('There is no basket to apply an estimate to - please add an item to the cart first');
            } else {
                e.preventDefault();
                $('#enterPostalCodeModal').modal('show');
            }
        });
    },

    submitPostalAndZipCode: function () {
        $('.submitEstimate').on('click', 'button', function (e) {
            e.preventDefault();
            // submittedZipCode
            console.log('Estimate started');
            var zipCode = document.getElementById('submittedZipCode').value;
            var selected = document.getElementById('estimateState');
            var countryCode = document.getElementById('estimateCountryCode').textContent;
            var stateOrProvinceCode = selected.options[selected.selectedIndex].value;
            var stateOrProvinceName = selected.options[selected.selectedIndex].textContent;
            if (zipCode === '') {
                alert('You cannot submit an empty zipcode');
                return;
            }
            if (stateOrProvinceCode === '') {
                alert('You cannot submit an empty state or province');
                return;
            }
            // update zip code above mini cart and close modal
            $('#miniCartStatus').text('Calculating shipping estimate...');
            shippingEstimate(zipCode, stateOrProvinceCode, countryCode);
            document.getElementById('miniCartPostalCodeEstimate').textContent = zipCode;
            document.getElementById('miniCartStateProvinceEstimate').textContent = stateOrProvinceName;
            $('#enterPostalCodeModal').modal('hide');
        });
    },

    submitNoChargeCodeButton: function () {
        $('.submitNoChargeDiscountCode').on('click', 'button', function (e) {
            e.preventDefault();
            // validate that neither field is empty
            var noChargeSerialNumber = $('#noChargeSerialNumber').val();
            var noChargeModelNumber = $('#noChargeModelNumber').val();
            var noChargeReasonCode = $('#noChargeReasonCode').val();
            console.log(noChargeReasonCode);
            if (noChargeSerialNumber === '' && noChargeModelNumber === '') {
                alert('No Charge Model Number and No Charge Serial Number both need values entered');
            } else if (noChargeSerialNumber === '') {
                alert('No Charge Serial Number cannot be blank');
            } else if (noChargeModelNumber === '') {
                alert('No Charge Model Number cannot be blank');
            } else {
                // All conditions pass, submit the two values off to be added to all items on the order
                console.log('Submitting no charge order');
                document.getElementById('noChargeStatusDiv').style.display = 'block';
                let basketId = $('#globalBasketId').val();
                getBasketForNoChargeCodes(basketId, noChargeModelNumber, noChargeSerialNumber, noChargeReasonCode);
                document.getElementById('noChargeStatusTextDiv').textContent = 'Adding no charge reason code - please wait...';
            }
        });
    },

    orderAuditDetails: function () {
        $('#auditDetails').on('click', 'button', function () {
            var orderNumber = document.getElementById('globalOrderNumber').value;
            if (this.id === 'cancelOrder') {
                var confirmCancel = confirm('Do you wish to cancel this order? Press OK to cancel order. \n\nThis action cannot be undone');
                if (confirmCancel) {
                    console.log('cancelling order');
                    updateNoChargeOrder(orderNumber, 'cancelled');
                }
            }
            if (this.id === 'approveOrder') {
                updateNoChargeOrder(orderNumber, 'open');
            }
        });
    },

    addNotesToOrderButton: function () {
        $('.notes').on('click', 'button', function (e) {
            e.preventDefault();
            var notes1 = document.getElementById('notes1input').value;
            var notes2 = document.getElementById('notes2input').value;
            var basketId = $('#globalBasketId').val();
            var isAudit = document.getElementById('allowAudit');
            if (basketId === '' && !isAudit) {
                alert('Cannot add notes to order until at least 1 item is in the basket');
            } else if (isAudit) {
                var orderNumber = document.getElementById('globalOrderNumber').value;
                addNotesToOrder(basketId, notes1, notes2, isAudit.value, orderNumber);
            } else {
                addNotesToOrder(basketId, notes1, notes2, false, null);
            }
        });
    },

    sfdcCaseNumberSearch: function () {
        $('#sfdcCase-search-btn').on('click', function (e) {
            e.preventDefault();
            let sfdcCaseNumber = $('#sfdcCaseNumber').val().trim();
            var basketId = $('#globalBasketId').val();
            caseNumberSearch(sfdcCaseNumber, basketId);
        });

        $('#sfdcCase-clear-btn').on('click', function (e) {
            e.preventDefault();
            // $('#addressForm').trigger('reset');
            $('#addressForm input[type="text"],#addressForm select').not('[readonly]').val('');
            $('#sfdcCaseNumber').val('');
            $('#sfdcCase-search-btn').attr('disabled', false);
            $('#sfdcCaseNumber').attr('disabled', false);
            document.getElementById('miniCartStatus').innerHTML = '';
            document.getElementById('caseStatus').innerHTML = '';
            let sfdcCaseNumber = $('#sfdcCaseNumber').val().trim();
            var basketId = $('#globalBasketId').val();
            updateCaseNumberToBasket(sfdcCaseNumber, basketId);
        });
    }
};
