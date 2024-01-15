'use strict';
/* global pageContext */

var dataLayer = window.dataLayer;

/**
 * @param {Object} productObject The product data
 * @description gets the data for a product click
 */
function productClick(productObject) {
    var obj = {
        event: 'productClick',
        ecommerce: {
            click: {
                actionField: {
                    list: 'SearchResults'
                },
                products: []
            }
        }
    };
    obj.ecommerce.click.products.push(productObject);
    dataLayer.push(obj);
}

/**
 * @description Click event for add product to cart
 * @param {Object} productObject The product data
 * @param {string} quantity product quantity
 */
function addToCart(productObject, quantity) {
    var quantityObj = {
        quantity: quantity
    };
    var obj = {
        event: 'addToCart',
        ecommerce: {
            add: {
                products: []
            }
        }
    };
    obj.ecommerce.add.products.push($.extend(productObject, quantityObj));
    dataLayer.push(obj);
}

/**
 *
 * @param {Object} productObject product object
 * @param {string|number} quantity product quantity
 */
function removeFromCart(productObject, quantity) {
    var quantityObj = {
        quantity: quantity
    };
    var obj = {
        event: 'removeFromCart',
        ecommerce: {
            remove: {
                products: []
            }
        }
    };
    obj.ecommerce.remove.products.push($.extend(productObject, quantityObj));
    dataLayer.push(obj);
}

/**
 * Updates the current step in the checkout flow
 * @param {Integer} step the step number the flow is currently on
 */
function updateCheckoutStep(step) {
    var obj = {
        event: 'checkout',
        ecommerce: {
            checkout: {
                actionField: {
                    step: step
                }
            }
        }
    };
    dataLayer.push(obj);
}

/**
 * @description Convenience method for creating a click event.
 * @param {string} event event
 * @param {string} eventCategory event categroy
 * @param {string} eventAction event action
 * @param {string} eventLabel event layer
 */
function pushEvent(event, eventCategory, eventAction, eventLabel) {
    dataLayer.push({
        event: event,
        eventCategory: eventCategory,
        eventAction: eventAction,
        eventLabel: eventLabel
    });
}

var events = {
    account: function () {},
    cart: function () {
        $(document).on('click', '.cart-delete-confirmation-btn', function () {
            removeFromCart($.parseJSON($(this).attr('data-gtmdata')), parseInt($(this).attr('data-qty'), 10));
        });
    },
    checkout: function () {
        $(document).on('click', '.btn-edit-multi-ship, .shipping-summary .edit-button',
            function () {
                updateCheckoutStep(2);
            });

        $(document).on('click',
            '.submit-shipping, .btn-save-multi-ship, .btn-enter-multi-ship',
            function () {
                updateCheckoutStep(3);
            });

        $(document).on('click', '.submit-payment', function () {
            updateCheckoutStep(4);
        });

        $(document).on('click', '.place-order', function () {
            updateCheckoutStep(5);
        });
    },
    compare: function () {},
    product: function () {
        $('.add-to-cart').on('click', function () {
            addToCart($.parseJSON($(this).attr('data-gtmdata')), $('.quantity-select').val());
        });
    },
    search: function () {},
    storefront: function () {},
    wishlist: function () {},
    // events that should happen on every page
    all: function () {
        $('.pdp-link .link').on('click', function () {
            productClick($.parseJSON($(this).attr('data-gtmdata')));
        });
        $('.nav-link.dropdown-toggle').on('click', function () {
            pushEvent('trackEvent', 'User Action', 'Header Click', $(this).html());
        });
        $('.navbar-header.brand').on('click', function () {
            pushEvent('trackEvent', 'User Action', 'Header Click', 'Home Link');
        });
        $(document).on('click', '.add-to-cart-global', function () {
            addToCart($.parseJSON($(this).attr('data-gtmdata')), $('.quantity-select').val());
        });
    }
};


/**
 *
 * @description Initialize the tag manager functionality
 * @param {string} nameSpace The current name space
 */
exports.init = function (nameSpace) {
    var ns = nameSpace || pageContext.ns;
    if (ns && events[ns]) {
        events[ns]();
    }
    events.all();
};
