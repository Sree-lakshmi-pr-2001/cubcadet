/* eslint-disable */
/* global empty */
'use strict';
var BasketMgr = require('dw/order/BasketMgr');
var storeMgr = require('dw/catalog/StoreMgr');
var Site = require('dw/system/Site');
var Money = require('dw/value/Money');
var ProductMgr = require('dw/catalog/ProductMgr');
var ShippingMgr = require('dw/order/ShippingMgr');
var LinkedHashMap = require('dw/util/LinkedHashMap');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var dealerHelpers = require('org_cubcadet/cartridge/scripts/dealer/dealerHelpers');
/**
 * Get Product states converted into links and button states
 * @param {string} productID - product ID
 * @returns {Object} button states on PDP
 *
 */
exports.getStates = function (productID) {
    var buttonStates = {};
    var setup = {};
    var product = ProductMgr.getProduct(productID);
    var dealerId = storeMgr.getStoreIDFromSession();
    var dealer = null;

    setup.dealer_is_selected = false;
    setup.DF_dealer_exists = false;
    setup.selected_dealer_will_deliver = false;
    setup.dealerDeliveryCost = 0;
    setup.selected_dealer_is_DF_dealer = false;
    setup.selected_dealer_authorized_for_product = false;
    setup.selected_dealer_has_in_stock = false;
    setup.selected_dealer_can_get_from_MTD = false;
    // setup.ANY_DF_dealer_can_get_from_MTD = false;
    setup.ANY_DF_dealer_will_deliver = false;
    setup.MTD_has_in_stock_to_ship_to_home = false;
    setup.Dealer_Required_Product = product.custom['dealer-required'] === true ? true : false;
    setup.productIsEdealerEligible = product.custom['edealer-eligible'] === false ? false : true;
    setup.cartIsEdealerEligible = false;
    setup.cartNotEdealerEligible = false;
    buttonStates.MTDdisableAddToCart = false;
    setup.cartIsDealerRequired = false;
    setup.deliverymethod = "";
    setup.basketIsEmpty = true;
    setup.allProductsInCartAvailable = true;
    setup.MTDHasAllProductsInStock = true;
    setup.dealerHasAllProductsInStock = true;
    setup.autoShip_available = false;
    setup.MTD_shipTohomeOnly = false;
    setup.enableAddToCart = false;
    setup.enableFindDealer = false;
    setup.enableAddToCartNoDealer = false;
    setup.unavailableProduct = false;
    setup.unavailableEnabled = false;

    var auto_ship = (product.custom['edealer-product-type'].value === 'AUTO_WG' || product.custom['edealer-product-type'].value === 'PT_ACC');
    var wholeGood = product.custom['edealer-product-type'].value === 'WG';
    setup.Cub_Buyable_Product = product.custom['cub-buyable'] === false ? false : true;
    // setup.ANY_DF_dealer_can_get_from_MTD = checkMTDstock(product); // appears to not be used after recent updates.
    setup.MTD_has_in_stock_to_ship_to_home = product.getAvailabilityModel().isOrderable();

    // var countrySitePref = Site.getCurrent().getCustomPreferenceValue('countryCode');
    // var countryCode = 'value' in countrySitePref ? countrySitePref.value : 'US';
    //var countryCurrency = (countryCode === 'US') ? 'USD' : 'CAD';
    var cartAmount = 0;
    var currentBasket = BasketMgr.getCurrentBasket();
    if (currentBasket) {
        cartAmount = currentBasket.getTotalNetPrice();
        setup.cartIsEdealerEligible = isCartEdealerEligible(currentBasket);
        setup.cartNotEdealerEligible = CartNotEdealerEligible(currentBasket);
        setup.cartIsDealerRequired = isCartDealerRequired(currentBasket);
        var shipment = currentBasket.getDefaultShipment();
        setup.deliverymethod = shipment.getShippingMethodID();
        setup.basketIsEmpty = !currentBasket.getProductLineItems();
        setup.MTDHasAllProductsInStock = MTDHasAllProductsInStock(currentBasket);
        setup.basketHasAutoshipProducts = basketContainAutoshipProducts(currentBasket);
    }

    if (dealerId) {
        dealer = storeMgr.getStore(dealerId);
        if (dealer) {
            setup.dealer_is_selected = true;
            if (currentBasket) {
                setup.allProductsInCartAvailable = allProductsInCartAvailable(currentBasket, dealer);
            }
            setup.dealerHasAllProductsInStock = selectedDealerHasAllProductsInStock(currentBasket, dealer, product);
            setup.selected_dealer_is_DF_dealer = dealer.custom.dealer_fulfillment_enabled;
            var productPrice = product.priceModel.price;
            var actualRadius = parseRadius(dealer, cartAmount + productPrice);
            if (actualRadius[3] > 0) {
                // Uses dealer zip code if delivery zip code is not set, in the same way it is done in refineSelectedDealer template.
                var postalCode = dealerHelpers.getDeliveryZipCode() || dealer.postalCode;

                setup.selected_dealer_will_deliver = willDillerDeliver(actualRadius[3], dealer, postalCode);
                setup.dealerDeliveryCost = actualRadius[2];
            }

            var productAvailability = getDealerAvailability(product, dealer);
            if(productAvailability && productAvailability.inventoryRecord) {
                setup.selected_dealer_authorized_for_product = true;
                setup.selected_dealer_can_get_from_MTD = productAvailability.isOrderable() && !productAvailability.isInStock();
                setup.selected_dealer_has_in_stock = (productAvailability.isInStock())?true:false;
                setup.selected_dealer_orderable = (productAvailability.isOrderable())?true:false;
            } else if (!auto_ship && !setup.MTD_has_in_stock_to_ship_to_home && !setup.Dealer_Required_Product) {
                setup.unavailableEnabled = true;
                buttonStates.shipToHome = false;
                buttonStates.dealerDelivery = false;
                buttonStates.pickUp = false;
            }
            // */
            setup.DF_dealer_exists = findEDealerInArea();
            setup.ANY_DF_dealer_will_deliver = anyDillerWillDeliver(product);
        }
    } else {
        if (!auto_ship && setup.MTD_has_in_stock_to_ship_to_home && !setup.Dealer_Required_Product) {
            setup.enableAddToCart = true;
            buttonStates.shipToHome = true;
            buttonStates.dealerDelivery = false;
            buttonStates.pickUp = false;
        } else {
            setup.enableAddToCart = false;
            setup.enableAddToCartNoDealer = true;
            buttonStates.shipToHome = false;
            buttonStates.dealerDelivery = false;
            buttonStates.pickUp = false;
        }
    }

    if (auto_ship) {
        var productAvailability = getMTDavailability(product);
        if (productAvailability) {
            setup.selected_dealer_authorized_for_product = setup.dealer_is_selected;
            setup.autoShip_available = productAvailability.isOrderable();
        }
    }

    var buyableProduct = setup.dealer_is_selected && setup.Cub_Buyable_Product; // Dealer ID is in Session and Product is CubBuyable
    var availableProduct = buyableProduct && setup.selected_dealer_authorized_for_product; // ^^ and Delaer has current product record in Inventory list
    var unavailableProduct = (setup.dealer_is_selected && !setup.selected_dealer_authorized_for_product && setup.Dealer_Required_Product) || (!setup.selected_dealer_authorized_for_product && setup.dealer_is_selected && !setup.Dealer_Required_Product && !setup.MTD_has_in_stock_to_ship_to_home && !auto_ship) || setup.unavailableEnabled; // buy
    var isInStock = availableProduct && setup.selected_dealer_has_in_stock; // Prodcut is in Delaer inventory list and it is in stock qith qty > then requested
    var isOrderable = availableProduct && setup.selected_dealer_orderable; //
    var isOutOfStock = ((auto_ship && !setup.autoShip_available) && (setup.deliverymethod === 'dealer-delivery' || setup.deliverymethod === 'dealer-pickup')) || (availableProduct && !setup.selected_dealer_orderable && !setup.MTD_has_in_stock_to_ship_to_home && !setup.autoShip_available && setup.selected_dealer_is_DF_dealer) || (availableProduct && !setup.selected_dealer_orderable && setup.Dealer_Required_Product && !setup.autoShip_available && setup.selected_dealer_is_DF_dealer) || (((auto_ship && !setup.autoShip_available) || !auto_ship) && !setup.MTD_has_in_stock_to_ship_to_home && !setup.Dealer_Required_Product && !setup.dealer_is_selected );

    if (setup.Cub_Buyable_Product){
        if ((setup.cartIsDealerRequired || setup.Dealer_Required_Product) && (setup.cartIsEdealerEligible || setup.basketIsEmpty)) {
            buttonStates.scenarioID = "DealerRequired";
            buttonStates.dealerCantSell = unavailableProduct;
            buttonStates.dealerDelivery = (isOrderable || setup.autoShip_available || (!setup.Dealer_Required_Product && !wholeGood && setup.MTD_has_in_stock_to_ship_to_home)) && setup.selected_dealer_will_deliver && setup.dealer_is_selected && setup.productIsEdealerEligible && setup.selected_dealer_is_DF_dealer;
            buttonStates.dealerDeliveryCost = auto_ship ? "" : setup.dealerDeliveryCost;
            buttonStates.deliveryMethod =  setup.deliverymethod;
            buttonStates.dealerDeliveryTimeShort = setup.selected_dealer_has_in_stock && setup.dealerHasAllProductsInStock && !auto_ship && !setup.basketHasAutoshipProducts;
            buttonStates.dealerDeliveryTime = buttonStates.dealerDeliveryTimeShort ? "dealer-delivery_direct-estimate" : "dealer-delivery_dropship-estimate";
            buttonStates.pickUp = (isOrderable || setup.autoShip_available || (!setup.Dealer_Required_Product && !wholeGood && setup.MTD_has_in_stock_to_ship_to_home)) && setup.dealer_is_selected && setup.productIsEdealerEligible && setup.selected_dealer_is_DF_dealer;
            buttonStates.pickUpTimeShort = setup.selected_dealer_has_in_stock && selectedDealerHasAllProductsInStock && !auto_ship && !setup.basketHasAutoshipProducts;
            buttonStates.pickUpTime = buttonStates.pickUpTimeShort ? "dealer-pickup_direct-estimate" : "dealer-pickup_dropship-estimate";
            buttonStates.shipToHome = false;
        } else if (setup.productIsEdealerEligible && (setup.cartIsEdealerEligible || setup.basketIsEmpty)) {
            if (auto_ship) {
                buttonStates.scenarioID = "autoShip_available";
                buttonStates.dealerDelivery = setup.autoShip_available && setup.dealer_is_selected && setup.selected_dealer_will_deliver && (setup.deliverymethod === 'dealer-delivery' || setup.deliverymethod === 'dealer-pickup') && setup.selected_dealer_is_DF_dealer;
                buttonStates.dealerDeliveryCost = auto_ship ? "" : setup.dealerDeliveryCost;
                buttonStates.deliveryMethod =  setup.deliverymethod;
                buttonStates.dealerDeliveryTime = "dealer-delivery_dropship-estimate";
                buttonStates.pickUp = setup.autoShip_available && setup.dealer_is_selected && (setup.deliverymethod === 'dealer-delivery' || setup.deliverymethod === 'dealer-pickup') && setup.selected_dealer_is_DF_dealer;
                buttonStates.pickUpTime = "dealer-pickup_dropship-estimate";
                buttonStates.shipToHome = (setup.autoShip_available || setup.MTD_has_in_stock_to_ship_to_home) && !buttonStates.dealerDelivery && setup.MTDHasAllProductsInStock;
            } else if (availableProduct) {
                buttonStates.scenarioID = "availableProduct";
                buttonStates.dealerDelivery = (isOrderable || (!wholeGood && setup.MTD_has_in_stock_to_ship_to_home)) && setup.dealer_is_selected && setup.selected_dealer_will_deliver && (setup.allProductsInCartAvailable || setup.basketIsEmpty) && setup.selected_dealer_is_DF_dealer;
                buttonStates.dealerDeliveryCost = auto_ship ? "" : setup.dealerDeliveryCost;
                buttonStates.deliveryMethod =  setup.deliverymethod;
                buttonStates.dealerDeliveryTimeShort = setup.selected_dealer_has_in_stock && setup.dealerHasAllProductsInStock && !auto_ship && !setup.basketHasAutoshipProducts;
                buttonStates.dealerDeliveryTime = buttonStates.dealerDeliveryTimeShort ? "dealer-delivery_direct-estimate" : "dealer-delivery_dropship-estimate";
                buttonStates.pickUp = (isOrderable || (!wholeGood && setup.MTD_has_in_stock_to_ship_to_home)) && setup.dealer_is_selected && (setup.allProductsInCartAvailable || setup.basketIsEmpty) && setup.selected_dealer_is_DF_dealer;
                buttonStates.pickUpTimeShort = setup.dealerHasAllProductsInStock && setup.selected_dealer_has_in_stock && !auto_ship && !setup.basketHasAutoshipProducts;
                buttonStates.pickUpTime = buttonStates.pickUpTimeShort ? "dealer-pickup_direct-estimate" : "dealer-pickup_dropship-estimate";
                buttonStates.shipToHome = !buttonStates.dealerDelivery && setup.MTD_has_in_stock_to_ship_to_home && setup.MTDHasAllProductsInStock;
            } else if (unavailableProduct && setup.MTD_has_in_stock_to_ship_to_home) {
                buttonStates.scenarioID = "unavailableProduct2";
                buttonStates.dealerDelivery = (!auto_ship || setup.deliverymethod === 'dealer-delivery' || setup.deliverymethod === 'dealer-pickup') && setup.dealer_is_selected && (!wholeGood && setup.MTD_has_in_stock_to_ship_to_home) && setup.selected_dealer_will_deliver && (setup.allProductsInCartAvailable || setup.basketIsEmpty) && setup.selected_dealer_is_DF_dealer;
                buttonStates.dealerDeliveryCost = "";
                buttonStates.deliveryMethod =  setup.deliverymethod;
                buttonStates.dealerDeliveryTimeShort = false;
                buttonStates.dealerDeliveryTime = "dealer-delivery_dropship-estimate";
                buttonStates.pickUp = (!auto_ship || setup.deliverymethod === 'dealer-delivery' || setup.deliverymethod === 'dealer-pickup') && setup.dealer_is_selected && (!wholeGood && setup.MTD_has_in_stock_to_ship_to_home) && (setup.allProductsInCartAvailable || setup.basketIsEmpty) && setup.selected_dealer_is_DF_dealer; // && setup.itemsInCartAvailableForStore;
                // we still need to get a helper to check if any items in the basket are eigible for pick up if they are we show pick on products on the cart page
                buttonStates.pickUpTimeShort = false;
                buttonStates.pickUpTime = buttonStates.pickUp ? "dealer-pickup_dropship-estimate" : "";
                buttonStates.shipToHome = setup.MTD_has_in_stock_to_ship_to_home && setup.MTDHasAllProductsInStock && !buttonStates.dealerDelivery;
            } else if (setup.MTD_has_in_stock_to_ship_to_home && !setup.Dealer_Required_Product && setup.Cub_Buyable_Product) {
                buttonStates.scenarioID = "MTD_has_in_stock_to_ship_to_home";
                setup.enableAddToCart = (setup.MTD_has_in_stock_to_ship_to_home && setup.MTDHasAllProductsInStock) || (setup.MTD_has_in_stock_to_ship_to_home && (setup.allProductsInCartAvailable && (setup.deliverymethod === 'dealer-delivery' || setup.deliverymethod === 'dealer-pickup')));
                buttonStates.dealerDelivery = (!wholeGood && setup.MTD_has_in_stock_to_ship_to_home) && setup.dealer_is_selected && setup.selected_dealer_will_deliver && (setup.allProductsInCartAvailable && (setup.deliverymethod === 'dealer-delivery' || setup.deliverymethod === 'dealer-pickup')) && setup.selected_dealer_is_DF_dealer;
                buttonStates.dealerDeliveryCost = "";
                buttonStates.deliveryMethod =  setup.deliverymethod;
                buttonStates.dealerDeliveryTimeShort = false;
                buttonStates.dealerDeliveryTime = "";
                buttonStates.pickUp = (!wholeGood && setup.MTD_has_in_stock_to_ship_to_home) && setup.dealer_is_selected && (setup.allProductsInCartAvailable && (setup.deliverymethod === 'dealer-delivery' || setup.deliverymethod === 'dealer-pickup')) && setup.selected_dealer_is_DF_dealer;
                // && setup.itemsInCartAvailableForStore;
                // we still need to get a helper to check if any items in the basket are eigible for pick up if they are we show pick on products on the cart page
                buttonStates.pickUpTimeShort = setup.MTD_has_in_stock_to_ship_to_home && setup.dealer_is_selected && setup.selected_dealer_will_deliver && (setup.allProductsInCartAvailable && (setup.deliverymethod === 'dealer-delivery' || setup.deliverymethod === 'dealer-pickup'));
                buttonStates.dealerDeliveryCost = "";;
                buttonStates.pickUpTime = buttonStates.pickUp ? "dealer-pickup_dropship-estimate" : "";
                buttonStates.shipToHome = setup.MTD_has_in_stock_to_ship_to_home && setup.MTDHasAllProductsInStock && !buttonStates.dealerDelivery;
            } else {
                buttonStates.scenarioID = "EligibleElse";
                buttonStates.MTDdisableAddToCart = true;
                buttonStates.dealerDelivery = false;
                buttonStates.pickUp = false;
                buttonStates.shipToHome = false;
            }
        } else {
            buttonStates.scenarioID = "ElseElse";
            setup.MTD_shipTohomeOnly = setup.MTD_has_in_stock_to_ship_to_home && setup.Cub_Buyable_Product && setup.MTDHasAllProductsInStock && !setup.Dealer_Required_Product && ((setup.deliverymethod != 'dealer-delivery' && setup.deliverymethod != 'dealer-pickup') || setup.basketIsEmpty);
            buttonStates.shipToHome =  setup.MTD_has_in_stock_to_ship_to_home && setup.Cub_Buyable_Product && setup.MTDHasAllProductsInStock && !setup.Dealer_Required_Product && ((setup.deliverymethod != 'dealer-delivery' && setup.deliverymethod != 'dealer-pickup') || setup.basketIsEmpty);
            buttonStates.dealerDelivery = false;
            buttonStates.pickUp = false;
        }
    } else {
        buttonStates.scenarioID = "NotCubBuyable";
        buttonStates.dealerDelivery = false;
        buttonStates.pickUp = false;
        buttonStates.shipToHome = false;
    }

    var shipToHomeMethod = ShippingMgr.getDefaultShippingMethod();
    var shiptoHomeCost = '';

    buttonStates.shiptoHomeTime = "home_delivery-estimate";
    buttonStates.shiptoHomeCost = shiptoHomeCost;

    buttonStates.findDelivery = isOrderable && setup.ANY_DF_dealer_will_deliver && !setup.selected_dealer_will_deliver;
    buttonStates.checkAnotherDealer = !auto_ship && (isOutOfStock || unavailableProduct) && !setup.MTD_shipTohomeOnly && setup.Cub_Buyable_Product;

    buttonStates.dealerDeliveryClasses = (buttonStates.dealerDelivery)?"enabled":"disabled";
    buttonStates.storePickupDeliveryClasses = (buttonStates.pickUp)?"enabled":"disabled";
    buttonStates.shiptoHomeDeliveryClasses = (buttonStates.shipToHome)?"enabled":"disabled";

    switch (setup.deliverymethod) {
        case 'dealer-delivery':
            buttonStates.isDealerDeliverySelected = true;
            break;

        case 'dealer-pickup':
            buttonStates.isStorePickupSelected = true;
            break;

        default :
            buttonStates.isShiptoHomeSelected = true;
            break;
    }

    buttonStates.addToCart = buttonStates.dealerDelivery || buttonStates.pickUp || buttonStates.shipToHome;
    buttonStates.addToCartNoDealer = setup.enableAddToCartNoDealer;
    buttonStates.unavailable = unavailableProduct;
    buttonStates.outOfStock = isOutOfStock && !setup.autoShip_available && (setup.Dealer_Required_Product || !setup.MTD_has_in_stock_to_ship_to_home);
    buttonStates.findDealer = setup.enableFindDealer || (!setup.dealer_is_selected && !setup.Cub_Buyable_Product && !setup.autoShip_available && !setup.MTD_has_in_stock_to_ship_to_home);
    buttonStates.cubBuyableProduct = setup.Cub_Buyable_Product;
    buttonStates.dealerIsSelected = setup.dealer_is_selected;
    buttonStates.contactDealer = (setup.dealer_is_selected && !setup.Cub_Buyable_Product && setup.selected_dealer_authorized_for_product) || (!setup.selected_dealer_is_DF_dealer && setup.dealer_is_selected && setup.selected_dealer_authorized_for_product && !setup.autoShip_available && !setup.MTD_has_in_stock_to_ship_to_home); // || (setup.enableContactDealer && !setup.enableAddToCartNoDealer); removed as not needed
    var seeDetails = Site.getCurrent().getCustomPreferenceValue('see-details-link');
    if (seeDetails) {
        buttonStates.seeDetailsLink = seeDetails;
    }

    return buttonStates;
};

/**
 * Get Delivery States
 * @param {dw.catalog.Store} dealer - dealer
 * @param {string} productId - productId
 * @param {number} quantity - quantity
 * @param {boolean} isProductFromCart - isProductFromCart
 * @param {boolean} isUpdatedExistingProductQuantity - if productId exists in cart and we need update total amount related to quantity
* @param {boolean} existingProductQuantity - if productId exists in cart and we need update total amount related to quantity
 * @returns {Object} stateResults - stateResults
 *
 */
exports.getDeliveryStates = function (dealer, productId, quantity, isProductFromCart, isUpdatedExistingProductQuantity, existingProductQuantity) {
    var buttonStates = {};
    var setup = {};
    var product = ProductMgr.getProduct(productId);

    setup.dealer_is_selected = false;
    setup.selected_dealer_will_deliver = false;
    setup.selected_dealer_is_DF_dealer = false;
    setup.selected_dealer_authorized_for_product = false;
    setup.selected_dealer_has_in_stock = false;
    setup.selected_dealer_can_get_from_MTD = false;
    setup.MTD_has_in_stock_to_ship_to_home = false;
    setup.Dealer_Required_Product = product.custom['dealer-required'] === true ? true : false;
    setup.productIsEdealerEligible = product.custom['edealer-eligible'] === false ? false : true;
    setup.cartIsEdealerEligible = false;
    setup.cartNotEdealerEligible = false;
    setup.cartIsDealerRequired = false;
    setup.deliverymethod = "";
    setup.basketIsEmpty = true;
    setup.allProductsInCartAvailable = true;
    setup.MTDHasAllProductsInStock = true;
    setup.dealerHasAllProductsInStock = true;
    setup.autoShip_available = false;
    setup.MTD_shipTohomeOnly = false;
    setup.itemsInCartAvailableForStore = false;
    setup.unavailableEnabled = false;

    var auto_ship = (product.custom['edealer-product-type'].value === 'AUTO_WG' || product.custom['edealer-product-type'].value === 'PT_ACC');
    var wholeGood = product.custom['edealer-product-type'].value === 'WG';
    var partOrAccessory = product.custom['edealer-product-type'].value === 'PT_ACC';
    setup.Cub_Buyable_Product = product.custom['cub-buyable'] === false ? false : true;
    // setup.ANY_DF_dealer_can_get_from_MTD = checkMTDstock(product);
    // this was replaced by setup.selected_dealer_can_get_from_MTD since that the back order inventory that stores can order.
    // otherwise autoship and site inventory are used elsewhere in the code
    setup.MTD_has_in_stock_to_ship_to_home = product.getAvailabilityModel().isOrderable();

   // var countrySitePref = Site.getCurrent().getCustomPreferenceValue('countryCode');
    // countryCode = 'value' in countrySitePref ? countrySitePref.value : 'US';
   // var countryCurrency = (countryCode === 'US') ? 'USD' : 'CAD';
    var cartAmount = 0;
    var productPrice = product.priceModel.price;
    var totalAmount = 0;
    var currentBasket = BasketMgr.getCurrentBasket();
    if (currentBasket) {
        cartAmount = currentBasket.getTotalNetPrice();
        setup.cartIsEdealerEligible = isCartEdealerEligible(currentBasket);
        setup.cartNotEdealerEligible = CartNotEdealerEligible(currentBasket);
        setup.cartIsDealerRequired = isCartDealerRequired(currentBasket);
        var shipment = currentBasket.getDefaultShipment();
        setup.deliverymethod = shipment.getShippingMethodID();
        setup.basketIsEmpty = !currentBasket.getProductLineItems();
        setup.MTDHasAllProductsInStock = MTDHasAllProductsInStock(currentBasket);
        setup.basketHasAutoshipProducts = basketContainAutoshipProducts(currentBasket);
        // set quantity of product in basket + quantity of a new product which is the same product
        if (isUpdatedExistingProductQuantity) {
            productQuantity = existingProductQuantity + quantity;
        }
        if (isProductFromCart) {
            if (!isUpdatedExistingProductQuantity) {
                totalAmount = cartAmount;
            } else {
                totalAmount = cartAmount + productPrice.multiply(quantity);
            }
        } else {
            totalAmount = cartAmount + productPrice.multiply(quantity);
        }
    } else if (!isProductFromCart) {
        totalAmount = productPrice.multiply(quantity);
    }
    var productQuantity = quantity;

    if (dealer) {
        setup.dealer_is_selected = true;
        setup.selected_dealer_is_DF_dealer = dealer.custom.dealer_fulfillment_enabled;
        if (currentBasket) {
            setup.allProductsInCartAvailable = allProductsInCartAvailable(currentBasket, dealer);
            setup.itemsInCartAvailableForStore = itemsInCartAvailableForStore(currentBasket, dealer, product, quantity);
        }

        if (isProductFromCart) {
            if (!isUpdatedExistingProductQuantity) {
                setup.dealerHasAllProductsInStock = selectedDealerHasAllProductsInStock(currentBasket, dealer);
            } else {
                setup.dealerHasAllProductsInStock = selectedDealerHasAllProductsInStock(currentBasket, dealer, product, quantity);
            }
        } else {
            setup.dealerHasAllProductsInStock = selectedDealerHasAllProductsInStock(currentBasket, dealer, product, quantity);
        }

        setup.selected_dealer_is_DF_dealer = dealer.custom.dealer_fulfillment_enabled;
        var actualRadius = parseRadius(dealer, totalAmount);
        if (actualRadius[3] > 0) {
            setup.selected_dealer_will_deliver = willDillerDeliver(actualRadius[3], dealer, dealerHelpers.getDeliveryZipCode());
            setup.dealerDeliveryCost = actualRadius[2];
        }

        var productAvailability = getDealerAvailability(product, dealer);
        if(productAvailability && productAvailability.inventoryRecord) {
            setup.selected_dealer_authorized_for_product = true;
            setup.selected_dealer_can_get_from_MTD = productAvailability.isOrderable(productQuantity) && !productAvailability.isInStock(productQuantity);
            setup.selected_dealer_has_in_stock = (productAvailability.isInStock(productQuantity))?true:false;
            setup.selected_dealer_orderable = (productAvailability.isOrderable(productQuantity))?true:false;
        } else if (!auto_ship && !setup.MTD_has_in_stock_to_ship_to_home && !setup.Dealer_Required_Product) {
            setup.unavailableEnabled = true;
            buttonStates.shipToHome = false;
            buttonStates.dealerDelivery = false;
            buttonStates.pickUp = false;
        }

        setup.DF_dealer_exists = findEDealerInArea();
        setup.ANY_DF_dealer_will_deliver = anyDillerWillDeliver(product);
    } else {
        if (!auto_ship && setup.MTD_has_in_stock_to_ship_to_home && !setup.Dealer_Required_Product){
            setup.enableAddToCart = true;
            buttonStates.shipToHome = true;
            buttonStates.dealerDelivery = false;
            buttonStates.pickUp = false;
        } else {
            setup.enableAddToCart = false;
            setup.enableAddToCartNoDealer = true;
            buttonStates.shipToHome = false;
            buttonStates.dealerDelivery = false;
            buttonStates.pickUp = false;
        }
    }

    if (auto_ship) {
        var productAvailability = getMTDavailability(product);
        if (productAvailability) {
            setup.selected_dealer_authorized_for_product = setup.dealer_is_selected;
            setup.autoShip_available = productAvailability.isOrderable(productQuantity);
        }
    }



    var buyableProduct = setup.dealer_is_selected && setup.Cub_Buyable_Product; // Dealer ID is in Session and Product is CubBuyable
    var availableProduct = buyableProduct && setup.selected_dealer_authorized_for_product; // ^^ and Delaer has current product record in Inventory list
    var unavailableProduct = (setup.dealer_is_selected && !setup.selected_dealer_authorized_for_product && setup.Dealer_Required_Product && !auto_ship) || (!setup.selected_dealer_authorized_for_product && setup.dealer_is_selected && !setup.Dealer_Required_Product && !setup.MTD_has_in_stock_to_ship_to_home && !auto_ship) || setup.unavailableEnabled; // buy
    var isInStock = availableProduct && setup.selected_dealer_has_in_stock; // Prodcut is in Delaer inventory list and it is in stock qith qty > then requested
    var isOrderable = availableProduct && setup.selected_dealer_orderable; //
    var isOutOfStock = ((auto_ship && !setup.autoShip_available) && (setup.deliverymethod === 'dealer-delivery' || setup.deliverymethod === 'dealer-pickup')) || (availableProduct && !setup.selected_dealer_orderable && !setup.MTD_has_in_stock_to_ship_to_home && !setup.autoShip_available && setup.selected_dealer_is_DF_dealer) || (availableProduct && !setup.selected_dealer_orderable && setup.Dealer_Required_Product && !setup.autoShip_available && setup.selected_dealer_is_DF_dealer) || (((auto_ship && !setup.autoShip_available) || !auto_ship) && !setup.MTD_has_in_stock_to_ship_to_home && !setup.Dealer_Required_Product && !setup.dealer_is_selected );

    if ((setup.cartIsDealerRequired || setup.Dealer_Required_Product) && (setup.cartIsEdealerEligible || setup.basketIsEmpty) && setup.Cub_Buyable_Product) {
        buttonStates.scenarioID = "DealerRequired";
        buttonStates.dealerCantSell = unavailableProduct;
        buttonStates.dealerDelivery = (isOrderable || setup.autoShip_available || (!setup.Dealer_Required_Product && !wholeGood && setup.MTD_has_in_stock_to_ship_to_home)) && setup.selected_dealer_will_deliver && setup.dealer_is_selected && setup.productIsEdealerEligible && setup.selected_dealer_is_DF_dealer;
        buttonStates.dealerDeliveryCost = auto_ship ? "" : setup.dealerDeliveryCost;
        buttonStates.deliveryMethod =  setup.deliverymethod;
        buttonStates.dealerDeliveryTimeShort = setup.selected_dealer_has_in_stock && setup.dealerHasAllProductsInStock && !auto_ship && !setup.basketHasAutoshipProducts;
        buttonStates.dealerDeliveryTime = buttonStates.dealerDeliveryTimeShort ? "dealer-delivery_direct-estimate" : "dealer-delivery_dropship-estimate";
        buttonStates.pickUp = (isOrderable || setup.autoShip_available || (!setup.Dealer_Required_Product && !wholeGood && setup.MTD_has_in_stock_to_ship_to_home)) && setup.dealer_is_selected && setup.productIsEdealerEligible && setup.selected_dealer_is_DF_dealer;
        buttonStates.pickUpTimeShort = setup.selected_dealer_has_in_stock && selectedDealerHasAllProductsInStock && !auto_ship && !setup.basketHasAutoshipProducts;
        buttonStates.pickUpTime = buttonStates.pickUpTimeShort ? "dealer-pickup_direct-estimate" : "dealer-pickup_dropship-estimate";
        buttonStates.shipToHome = false;
    } else if (setup.productIsEdealerEligible && (setup.cartIsEdealerEligible || setup.basketIsEmpty)) {
        if (auto_ship) {
            buttonStates.scenarioID = "autoShip_available";
            buttonStates.dealerDelivery = setup.autoShip_available && setup.dealer_is_selected && setup.selected_dealer_will_deliver && (setup.deliverymethod === 'dealer-delivery' || setup.deliverymethod === 'dealer-pickup') && setup.selected_dealer_is_DF_dealer;
            buttonStates.dealerDeliveryCost = auto_ship ? "" : setup.dealerDeliveryCost;
            buttonStates.deliveryMethod =  setup.deliverymethod;
            buttonStates.dealerDeliveryTime = "dealer-delivery_dropship-estimate";
            buttonStates.pickUp = setup.autoShip_available && setup.dealer_is_selected && (setup.deliverymethod === 'dealer-delivery' || setup.deliverymethod === 'dealer-pickup') && setup.selected_dealer_is_DF_dealer;
            buttonStates.pickUpTime = "dealer-pickup_dropship-estimate";
            buttonStates.shipToHome = (setup.autoShip_available || setup.MTD_has_in_stock_to_ship_to_home) && !buttonStates.dealerDelivery && setup.MTDHasAllProductsInStock ;
        } else if (availableProduct) {
            buttonStates.scenarioID = "availableProduct";
            buttonStates.dealerDelivery = (isOrderable || (!wholeGood && setup.MTD_has_in_stock_to_ship_to_home)) && setup.selected_dealer_will_deliver && setup.dealer_is_selected && (setup.allProductsInCartAvailable || setup.basketIsEmpty) && setup.selected_dealer_is_DF_dealer;
            buttonStates.dealerDeliveryCost = auto_ship ? "" : setup.dealerDeliveryCost;
            buttonStates.deliveryMethod =  setup.deliverymethod;
            buttonStates.dealerDeliveryTimeShort = setup.selected_dealer_has_in_stock && setup.dealerHasAllProductsInStock && !auto_ship && !setup.basketHasAutoshipProducts;
            buttonStates.dealerDeliveryTime = buttonStates.dealerDeliveryTimeShort ? "dealer-delivery_direct-estimate" : "dealer-delivery_dropship-estimate";
            buttonStates.pickUp = (isOrderable || (!wholeGood && setup.MTD_has_in_stock_to_ship_to_home)) && setup.dealer_is_selected && (setup.allProductsInCartAvailable || setup.basketIsEmpty) && setup.selected_dealer_is_DF_dealer;
            buttonStates.pickUpTimeShort = setup.dealerHasAllProductsInStock && setup.selected_dealer_has_in_stock && !auto_ship && !setup.basketHasAutoshipProducts;
            buttonStates.pickUpTime = buttonStates.pickUpTimeShort ? "dealer-pickup_direct-estimate" : "dealer-pickup_dropship-estimate";
            buttonStates.shipToHome = !buttonStates.dealerDelivery && setup.MTD_has_in_stock_to_ship_to_home && setup.MTDHasAllProductsInStock ;
        } else if (unavailableProduct && setup.MTD_has_in_stock_to_ship_to_home) {
            buttonStates.scenarioID = "unavailableProduct2";
            buttonStates.dealerDelivery = (!auto_ship || setup.deliverymethod === 'dealer-delivery' || setup.deliverymethod === 'dealer-pickup') && setup.dealer_is_selected && (!wholeGood && setup.MTD_has_in_stock_to_ship_to_home) && setup.selected_dealer_will_deliver && (setup.allProductsInCartAvailable || setup.basketIsEmpty) && setup.selected_dealer_is_DF_dealer;
            buttonStates.dealerDeliveryCost = "";
            buttonStates.deliveryMethod =  setup.deliverymethod;
            buttonStates.dealerDeliveryTimeShort = false;
            buttonStates.dealerDeliveryTime = "dealer-delivery_dropship-estimate";
            buttonStates.pickUp = (!auto_ship || setup.deliverymethod === 'dealer-delivery' || setup.deliverymethod === 'dealer-pickup') && setup.dealer_is_selected && (!wholeGood && setup.MTD_has_in_stock_to_ship_to_home) && (setup.allProductsInCartAvailable || setup.basketIsEmpty) && setup.selected_dealer_is_DF_dealer; // && setup.itemsInCartAvailableForStore;
            // we still need to get a helper to check if any items in the basket are eigible for pick up if they are we show pick on products on the cart page
            buttonStates.pickUpTimeShort = false;
            buttonStates.pickUpTime = buttonStates.pickUp ? "dealer-pickup_dropship-estimate" : "";
            buttonStates.shipToHome = setup.MTD_has_in_stock_to_ship_to_home && setup.MTDHasAllProductsInStock && !buttonStates.dealerDelivery;
        } else if (setup.MTD_has_in_stock_to_ship_to_home && !setup.Dealer_Required_Product && setup.Cub_Buyable_Product) {
            buttonStates.scenarioID = "MTD_has_in_stock_to_ship_to_home";
            setup.enableAddToCart = (setup.MTD_has_in_stock_to_ship_to_home && setup.MTDHasAllProductsInStock) || (setup.MTD_has_in_stock_to_ship_to_home && (setup.allProductsInCartAvailable && (setup.deliverymethod === 'dealer-delivery' || setup.deliverymethod === 'dealer-pickup')));
            buttonStates.dealerDelivery = (!wholeGood && setup.MTD_has_in_stock_to_ship_to_home) && setup.selected_dealer_will_deliver && setup.dealer_is_selected && (setup.allProductsInCartAvailable && (setup.deliverymethod === 'dealer-delivery' || setup.deliverymethod === 'dealer-pickup')) && setup.selected_dealer_is_DF_dealer;
            buttonStates.dealerDeliveryCost = "";
            buttonStates.deliveryMethod =  setup.deliverymethod;
            buttonStates.dealerDeliveryTimeShort = false;
            buttonStates.dealerDeliveryTime = "";
            buttonStates.pickUp = (!wholeGood && setup.MTD_has_in_stock_to_ship_to_home) && setup.dealer_is_selected && (setup.allProductsInCartAvailable && (setup.deliverymethod === 'dealer-delivery' || setup.deliverymethod === 'dealer-pickup')) && setup.selected_dealer_is_DF_dealer;
            // && setup.itemsInCartAvailableForStore;
            // we still need to get a helper to check if any items in the basket are eigible for pick up if they are we show pick on products on the cart page
            buttonStates.pickUpTimeShort = setup.MTD_has_in_stock_to_ship_to_home && setup.selected_dealer_will_deliver && (setup.allProductsInCartAvailable && (setup.deliverymethod === 'dealer-delivery' || setup.deliverymethod === 'dealer-pickup'));
            buttonStates.dealerDeliveryCost = "";;
            buttonStates.pickUpTime = buttonStates.pickUp ? "dealer-pickup_dropship-estimate" : "";
            buttonStates.shipToHome = setup.MTD_has_in_stock_to_ship_to_home && setup.MTDHasAllProductsInStock && !buttonStates.dealerDelivery;
        } else {
            buttonStates.scenarioID = "EligibleElse";
            buttonStates.MTDdisableAddToCart = true;
            buttonStates.dealerDelivery = false;
            buttonStates.pickUp = false;
            buttonStates.shipToHome = false;
        }
    } else {
        buttonStates.scenarioID = "ElseElse";
        setup.MTD_shipTohomeOnly = setup.MTD_has_in_stock_to_ship_to_home && setup.Cub_Buyable_Product && setup.MTDHasAllProductsInStock && !setup.Dealer_Required_Product && ((setup.deliverymethod != 'dealer-delivery' && setup.deliverymethod != 'dealer-pickup') || setup.basketIsEmpty);
        buttonStates.shipToHome =  setup.MTD_has_in_stock_to_ship_to_home && setup.MTDHasAllProductsInStock && setup.Cub_Buyable_Product && !setup.Dealer_Required_Product && ((setup.deliverymethod != 'dealer-delivery' && setup.deliverymethod != 'dealer-pickup') || setup.basketIsEmpty);
        buttonStates.dealerDelivery = false;
        buttonStates.pickUp = false;
    }

    var shipToHomeMethod = ShippingMgr.getDefaultShippingMethod();
    var shiptoHomeCost = '';// set to blank since different items can require different shipping methods and tiers inside the shipping method

    var shipToHomeTimeWholeGoodAssetId = "home_delivery-estimate";
    var shipToHomeTimePartOrAccessoryAssetId = "home_delivery-estimate-accessories"

    buttonStates.shiptoHomeTime = partOrAccessory ? shipToHomeTimePartOrAccessoryAssetId : shipToHomeTimeWholeGoodAssetId;
    buttonStates.shiptoHomeCost = shiptoHomeCost;

    buttonStates.findDelivery = isOrderable && setup.ANY_DF_dealer_will_deliver && !setup.selected_dealer_will_deliver && setup.Cub_Buyable_Product;
    buttonStates.checkAnotherDealer = !auto_ship && (isOutOfStock || unavailableProduct) && !setup.MTD_shipTohomeOnly && setup.Cub_Buyable_Product;

    buttonStates.dealerDeliveryClasses = (buttonStates.dealerDelivery)?"enabled":"disabled";
    buttonStates.storePickupDeliveryClasses = (buttonStates.pickUp)?"enabled":"disabled";
    buttonStates.shiptoHomeDeliveryClasses = (buttonStates.shipToHome)?"enabled":"disabled";

    switch (setup.deliverymethod) {
        case 'dealer-delivery':
            buttonStates.dealerDeliveryClasses += " selected";
            buttonStates.isDealerDeliverySelected = true;
            break;

        case 'dealer-pickup':
            buttonStates.storePickupDeliveryClasses += " selected";
            buttonStates.isStorePickupSelected = true;
            break;

        default :
            buttonStates.shiptoHomeDeliveryClasses += " selected";
            buttonStates.isShiptoHomeSelected = true;
            break;
    }
    var seeDetails = Site.getCurrent().getCustomPreferenceValue('see-details-link');
    if (seeDetails) {
        buttonStates.seeDetailsLink = seeDetails;
    }
    return buttonStates;
};

/**
 * Check if basket contains auto_ship product
 * @param {Cart} basket we check
 * @returns {Bollean} availability
 */
function basketContainAutoshipProducts(basket) {
    var isAutoship = false;
    if (basket) {
        var items = basket.getProductLineItems().iterator();
        while(items.hasNext()){
            var item = items.next();
            var product = item.getProduct();
            isAutoship = (product.custom['edealer-product-type'].value === 'AUTO_WG' || product.custom['edealer-product-type'].value === 'PT_ACC');
            if (isAutoship) {
                break;
            }
        }
    }

    return isAutoship;
}

/**
 * Check availability in dealer inventory list
 * @param {Cart} basket we check
 * @param {Store} store we check
 * @returns {Bollean} availability
 */
function allProductsInCartAvailable(basket, store) {
    var items = basket.getProductLineItems().iterator();
    var inventoryList = store.getInventoryList();
    if (inventoryList) {
        while(items.hasNext()){
            var item = items.next();
            var autoShipWG = item.getProduct().custom['edealer-product-type'].value === 'AUTO_WG';
            var autoShipPA = item.getProduct().custom['edealer-product-type'].value === 'PT_ACC';
            var inventoryListName = inventoryList;
            if (autoShipWG) {
                inventoryListName = Site.current.getCustomPreferenceValue('mtdDealerInventoryListID');
                inventoryList = ProductInventoryMgr.getInventoryList(inventoryListName);
            }
            if (autoShipPA) {
                inventoryListName = Site.current.getCustomPreferenceValue('mtdDealerInventoryListID');
                inventoryList = ProductInventoryMgr.getInventoryList(inventoryListName);
            }
            var availability = item.getProduct().getAvailabilityModel(inventoryList);
            var siteAvailability = item.getProduct().getAvailabilityModel();
            if (!availability.isOrderable(item.quantityValue)) {
                if (!siteAvailability.isOrderable(item.quantityValue)) {
                    return false;
                }
            }
        }
    }

    return true;
}

/**
 * Check availability in dealer inventory list
 * @param {Cart} basket we check
 * @param {Store} store we check
 * @returns {Bollean} availability
 */
function selectedDealerHasAllProductsInStock(basket, store, product, productQuantity) {
    var inventoryList = store.getInventoryList();
    var safeProductQuantity = productQuantity ? productQuantity : 1;
    var isProductChecked = false;
    if (inventoryList) {
        if (basket) {
            var items = basket.getProductLineItems().iterator();
            while(items.hasNext()){
                var item = items.next();
                var availability = item.getProduct().getAvailabilityModel(inventoryList);
                if (availability) {
                    var quantity = item.quantity.value;
                    if (product && product.ID === item.getProduct().ID) {
                        quantity = quantity + safeProductQuantity;
                        isProductChecked = true;
                    }
                    if (!availability.isInStock(quantity)) {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }

        if (product && !isProductChecked) {
            var productAvailability = product.getAvailabilityModel(inventoryList);
            if (!productAvailability || !productAvailability.isInStock(safeProductQuantity)) {
                return false;
            }
        }
    }

    return true;
}

//  function to see if items in cart are eligible for pick/delivery.
function itemsInCartAvailableForStore(basket, store) {
    var items = basket.getProductLineItems().iterator();
    var inventoryList = store.getInventoryList();
    if (inventoryList) {
        while(items.hasNext()){
            var item = items.next();
            var availability = item.getProduct().getAvailabilityModel(inventoryList);
            if (availability) {
                var quantity = item.quantity.value;
                if (availability.isOrderable(quantity)) {
                    return true;
                }
            } else {
                return false;
            }
        }
    }
    return true;
}

/**
 * Check edealer Eligibal in MTD inventory list
 * @param {Cart} basket we check
 * @returns {Bollean} eligibility
 */
 function isCartEdealerEligible(basket){
    var items = basket.getProductLineItems().iterator();
    while(items.hasNext()){
        var item = items.next();
        var eligible = item.getProduct().custom['edealer-eligible'] === false ? false : true;
        if (!eligible) {
            return false;
        }
    }
    return true;
}

/**
 * Check edealer Eligibal in MTD inventory list
 * @param {Cart} basket we check
 * @returns {Bollean} eligibility
 */
 function CartNotEdealerEligible(basket){
    var items = basket.getProductLineItems().iterator();
    while(items.hasNext()){
        var item = items.next();
        var notEligible = !item.getProduct().custom['edealer-eligible'] === false ? false : true;
        if (notEligible) {
            return true;
        }
    }
    return false;
}

/**
 * Check edealer Eligibal in MTD inventory list
 * @param {Cart} basket we check
 * @returns {Bollean} eligibility
 */
 function isCartDealerRequired(basket){
    var items = basket.getProductLineItems().iterator();
    while(items.hasNext()){
        var item = items.next();
        var dealerRequired = item.getProduct().custom['dealer-required'];
        if (dealerRequired) {
            return true;
        }
    }
    return false;
}

/**
 * Check availability in MTD site and auto ship inventory list
 * @param {Cart} basket we check
 * @returns {Bollean} availability
 */
 function MTDHasAllProductsInStock(basket){
    var items = basket.getProductLineItems().iterator();
    var MTDinventoryListName = Site.current.getCustomPreferenceValue('mtdDealerInventoryListID');
    if (MTDinventoryListName) {
        var MTDinventoryList = ProductInventoryMgr.getInventoryList(MTDinventoryListName);
        if (MTDinventoryList) {
            while(items.hasNext()){
                var item = items.next();
                var availability = item.getProduct().getAvailabilityModel(MTDinventoryList);
                if (!availability.isOrderable()) {
                    if (!item.getProduct().getAvailabilityModel().isOrderable()){
                    return false;
                    }
                }
            };
        } else { return false; }
    } else { return false; }

    return true;
}

/**
 * Check availability in dealer inventory list
 * @param {Store} store we check
 * @param {Product} product we check
 * @returns {Bollean} availability
 */
function getDealerAvailability(product, store) {
    var availability = false;
    var inventoryList = store.getInventoryList();
    if (inventoryList != null) {
        var availability = product.getAvailabilityModel(inventoryList);
        if (availability === null){
            availability = false;
        }
    }
    return availability;
}

/**
 * Check availability in MTD Autoship inventory list
 * @param {Product} product we check
 * @returns {Bollean} availability
 */
function getMTDavailability(product) {
    var availability;
    var MTDinventoryListName = Site.current.getCustomPreferenceValue('mtdDealerInventoryListID');
    if (MTDinventoryListName) {
        var MTDinventoryList = ProductInventoryMgr.getInventoryList(MTDinventoryListName);
        if (MTDinventoryList) {
            var availability = product.getAvailabilityModel(MTDinventoryList);
        }
    }
    return availability;
}

/**
 * Check availability in MTD inventory list
 * @param {Product} product we check
 * @returns {Bollean} availability
 *
function checkMTDstock(product) {
    var productInStock = false;
    var availability = getMTDavailability(product);
    if (availability) {
        productInStock = availability.isOrderable();
    }
    return productInStock;
}
*/

/**
 * decide does dealer deliver
 * @param {Store} dealer Store object
 * @param {string} radius - selected radius
 * @param {string} postalCode - postalCode
 * @returns {Bollean} decision
 */
function willDillerDeliver(radius, dealer, postalCode) {
    var closestStores = getStores(radius, postalCode);
    if (closestStores.length) {
        for (var store in closestStores) {
            if (store.ID === dealer.ID) {
                return true;
            }
        }
    }
    return false;
}

/**
 * decide does any dealer will deliver
 * @param {Prodict} product we are looking for
 * @returns {Bollean} decision
 */
function anyDillerWillDeliver(product) {
    var closestStores = getStores(300, dealerHelpers.getDeliveryZipCode());
    for (var store in closestStores) {
        var inventoryList = store.getInventoryList()
        if (inventoryList) {
            var availability = product.getAvailabilityModel(inventoryList);
            if (availability.isOrderable()) {
                var activeRadius = parseRadius(store, product.priceModel.price.decimalValue);
                var distance = closestStores.get(store);
                if (distance < activeRadius[3]) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Searches for stores and create an array of the stores returned by the search
 * @param {string} radius - selected radius
 * @param {string} postalCode - postalCode
 * @returns {Object} a plain object containing the results of the search
*/
function getStores(radius, postalCode) {
    var StoreMgr = require('dw/catalog/StoreMgr');
    var countrySitePref = Site.getCurrent().getCustomPreferenceValue('countryCode');
    var countryCode = 'value' in countrySitePref ? countrySitePref.value : 'US';
    var distanceUnit = countryCode === 'US' ? 'mi' : 'km';
    var searchQuery = 'custom.sells_products = true AND custom.cubcadet = true AND custom.dealer_minisite_enabled = true';
    if(empty(postalCode)) {
        var emptyMap = new LinkedHashMap();
        return emptyMap;
    }
    var storeMgrResult = StoreMgr.searchStoresByPostalCode(
        countryCode,
        postalCode,
        distanceUnit,
        parseInt(radius, 10),
        searchQuery
    );
    return storeMgrResult;
}

/**
 * find ediller in the closest area
 * @returns {Bollean} decision
 */
function findEDealerInArea() {
    var closestStores = getStores(300, dealerHelpers.getDeliveryZipCode());
    if (closestStores.length) {
        for (var store in closestStores) {
            if (store.custom.dealer_fulfillment_enabled) {
                return true;
            }
        }
    }
    return false;
}


/**
 * Store has a custom attribute Radius in format "0,499.99,29,0|500,999.99,69,0|1000,1999.99,99,0|2000,999999,119,0"
 * where each row has 4 parameters minAmount,maxAmount,deliveryFee,distance
 *
 * @param {Store} store Store object
 * @param {Money} amount BasketTotal
 * @returns {number} radius
 */
function parseRadius(store, amount) {
    var radiusesStr = store.custom.delivery_radius;
    if (radiusesStr) {
        var setOfRadiuses = [];
        setOfRadiuses = radiusesStr.split('|');
        if (setOfRadiuses.length) {
            // eslint-disable-next-line no-restricted-syntax
            for (var i in setOfRadiuses) {
                var regeonProperties = setOfRadiuses[i].split(',');
                if (regeonProperties.length && amount >= regeonProperties[0] && amount < regeonProperties[1]) {
                    return regeonProperties;
                }
            }
        }
    }
    return 0;
}

/**
 * isDeliveryInRange
 * @param {dw.catalog.Store} dealer - dealer
 * @param {string} postalCode - postalCode
 * @param {string} productId - productId
 * @param {number} quantity - quantity
 * @returns {Object} stateResults - stateResults
 *
 */
exports.isDeliveryInRange = function (dealer, postalCode, productID, quantity) {
    var isInRange = false;
    if (dealer) {
        var totalAmount = 0;

        var currentBasket = BasketMgr.getCurrentBasket();
        if (currentBasket) {
            var cartAmount = currentBasket.getTotalNetPrice();
            totalAmount = cartAmount;
        }

        if (!productID && !quantity) {
            var product = ProductMgr.getProduct(productID);
            if (product) {
                var productPrice = product.priceModel.price;
                totalAmount = totalAmount + productPrice.multiply(quantity);
            }
        }

        var actualRadius = parseRadius(dealer, totalAmount);
        if (actualRadius[3] > 0) {
            isInRange = willDillerDeliver(actualRadius[3], dealer, postalCode);
        }
    }

    return isInRange;
};

exports.getStores = getStores;
