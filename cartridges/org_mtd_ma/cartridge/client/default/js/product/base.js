'use strict';

var base = require('lyonscg/product/base');
var zoomConfigs = require('lyonscg/config/zoomConfigs');
var imagesloaded = require('imagesloaded');
var utils = require('lyonscg/util/utils');
var carousels = require('../components/carousels');

/**
 * Disable PDP Zoom
 * @param {Object} carouselObj - Product slider
 */
function disableZoom(carouselObj) {
    $(carouselObj).find('.slide-link').trigger('zoom.destroy');
}

/**
 * Init PDP Zoom
 * @param {Object} carouselObj - Product slider
 */
function initZoom(carouselObj) {
    disableZoom($(carouselObj));

    var isDesktop = utils.mediaBreakpointUp('lg');
    var $activeSlide = $(carouselObj).find('.slick-active');
    var $image = $activeSlide.find('.slide-link.zoom-hires');
    var url = $image.data('src');

    if ($image.length > 0 && url && url !== 'null' && isDesktop) {
        var config = {
            url: url
        };
        config = $.extend({}, zoomConfigs, config);

        $image.zoom(config);
    }
}


/**
 * Retrieves the relevant pid value
 * @param {jquery} $el - DOM container for a given add to cart button
 * @return {string} - value to be used when adding product to cart
 */
function getPidValue($el) {
    var pid;

    if ($('#quickViewModal').hasClass('show') && !$('.product-set').length) {
        pid = $($el).closest('.modal-content').find('.product-quickview').data('pid');
    } else if ($('.product-set-detail').length || $('.product-set').length) {
        pid = $($el).closest('.product-detail').find('.product-id').text();
    } else {
        pid = $('.product-detail:not(".bundle-item")').data('pid');
    }

    return pid;
}

/**
 * Retrieve contextual quantity selector
 * @param {jquery} $el - DOM container for the relevant quantity
 * @return {jquery} - quantity selector DOM container
 */
function getQuantitySelector($el) {
    return $el && $('.set-items').length
        ? $($el).closest('.product-detail').find('.quantity-select')
        : $('.quantity-select');
}

/**
 * Retrieves the value associated with the Quantity pull-down menu
 * @param {jquery} $el - DOM container for the relevant quantity
 * @return {string} - value found in the quantity input
 */
function getQuantitySelected($el) {
    return getQuantitySelector($el).val();
}

/**
 * Process the attribute values for an attribute that has image swatches
 *
 * @param {Object} attr - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {Object[]} attr.values - Array of attribute value objects
 * @param {string} attr.values.value - Attribute coded value
 * @param {string} attr.values.url - URL to de/select an attribute value of the product
 * @param {boolean} attr.values.isSelectable - Flag as to whether an attribute value can be
 *     selected.  If there is no variant that corresponds to a specific combination of attribute
 *     values, an attribute may be disabled in the Product Detail Page
 * @param {jQuery} $productContainer - DOM container for a given product
 */
function processSwatchValues(attr, $productContainer) {
    attr.values.forEach(function (attrValue) {
        var $attrValue = $productContainer.find('[data-attr="' + attr.id + '"] [data-attr-value="' +
            attrValue.value + '"]');
        var $swatchAnchor = $attrValue.parent();

        if (attrValue.selected) {
            $attrValue.addClass('selected');
        } else {
            $attrValue.removeClass('selected');
        }

        if (attrValue.url) {
            $swatchAnchor.attr('href', attrValue.url);
        } else {
            $swatchAnchor.removeAttr('href');
        }

        // Disable if not selectable
        $attrValue.removeClass('selectable unselectable');

        $attrValue.addClass(attrValue.selectable ? 'selectable' : 'unselectable');
    });
}

/**
 * Process attribute values associated with an attribute that does not have image swatches
 *
 * @param {Object} attr - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {Object[]} attr.values - Array of attribute value objects
 * @param {string} attr.values.value - Attribute coded value
 * @param {string} attr.values.url - URL to de/select an attribute value of the product
 * @param {boolean} attr.values.isSelectable - Flag as to whether an attribute value can be
 *     selected.  If there is no variant that corresponds to a specific combination of attribute
 *     values, an attribute may be disabled in the Product Detail Page
 * @param {jQuery} $productContainer - DOM container for a given product
 */
function processNonSwatchValues(attr, $productContainer) {
    var $attr = '[data-attr="' + attr.id + '"]';
    var $defaultOption = $productContainer.find($attr + ' .select-' + attr.id + ' option:first');
    $defaultOption.attr('value', attr.resetUrl);

    attr.values.forEach(function (attrValue) {
        var $attrValue = $productContainer
            .find($attr + ' [data-attr-value="' + attrValue.value + '"]');
        $attrValue.attr('value', attrValue.url)
            .removeAttr('disabled');

        if (!attrValue.selectable) {
            $attrValue.attr('disabled', true);
        }
    });
}

/**
 * Routes the handling of attribute processing depending on whether the attribute has image
 *     swatches or not
 *
 * @param {Object} attrs - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {jQuery} $productContainer - DOM element for a given product
 */
function updateAttrs(attrs, $productContainer) {
    // Currently, the only attribute type that has image swatches is Color.
    var attrsWithSwatches = ['color'];

    attrs.forEach(function (attr) {
        if (attrsWithSwatches.indexOf(attr.id) > -1) {
            processSwatchValues(attr, $productContainer);
        } else {
            processNonSwatchValues(attr, $productContainer);
        }
    });
}

/**
 * Updates the availability status in the Product Detail Page
 *
 * @param {Object} response - Ajax response object after an
 *                            attribute value has been [de]selected
 * @param {jQuery} $productContainer - DOM element for a given product
 */
function updateAvailability(response, $productContainer) {
    var availabilityValue = '';
    var availabilityMessages = response.product.availability.messages;
    if (!response.product.readyToOrder) {
        availabilityValue = '<div>' + response.resources.info_selectforstock + '</div>';
    } else {
        availabilityMessages.forEach(function (message) {
            availabilityValue += '<div>' + message + '</div>';
        });
    }

    $($productContainer).trigger('product:updateAvailability', {
        product: response.product,
        $productContainer: $productContainer,
        message: availabilityValue,
        resources: response.resources
    });
}

/**
 * Generates html for promotions section
 *
 * @param {array} promotions - list of promotions
 * @return {string} - Compiled HTML
 */
function getPromotionsHtml(promotions) {
    if (!promotions) {
        return '';
    }

    var html = '';

    promotions.forEach(function (promotion) {
        html += '<div class="callout" title="' + promotion.details + '">' + promotion.calloutMsg +
            '</div>';
    });

    return html;
}

/**
 * Generates html for product attributes section
 *
 * @param {array} attributes - list of attributes
 * @return {string} - Compiled HTML
 */
function getAttributesHtml(attributes) {
    if (!attributes) {
        return '';
    }

    var html = '';

    attributes.forEach(function (attributeGroup) {
        if (attributeGroup.ID === 'mainAttributes') {
            attributeGroup.attributes.forEach(function (attribute) {
                html += '<div class="attribute-values">' + attribute.label + ': '
                    + attribute.value + '</div>';
            });
        }
    });

    return html;
}

/**
 * @typedef UpdatedOptionValue
 * @type Object
 * @property {string} id - Option value ID for look up
 * @property {string} url - Updated option value selection URL
 */

/**
 * @typedef OptionSelectionResponse
 * @type Object
 * @property {string} priceHtml - Updated price HTML code
 * @property {Object} options - Updated Options
 * @property {string} options.id - Option ID
 * @property {UpdatedOptionValue[]} options.values - Option values
 */

/**
 * Updates DOM using post-option selection Ajax response
 *
 * @param {OptionSelectionResponse} options - Ajax response options from selecting a product option
 * @param {jQuery} $productContainer - DOM element for current product
 */
function updateOptions(options, $productContainer) {
    options.forEach(function (option) {
        var $optionEl = $productContainer.find('.product-option[data-option-id*="' + option.id
            + '"]');
        option.values.forEach(function (value) {
            var valueEl = $optionEl.find('option[data-value-id*="' + value.id + '"]');
            valueEl.val(value.url);
        });
    });
}

/**
 * Parses JSON from Ajax call made whenever an attribute value is [de]selected
 * @param {Object} response - response from Ajax call
 * @param {Object} response.product - Product object
 * @param {string} response.product.id - Product ID
 * @param {Object[]} response.product.variationAttributes - Product attributes
 * @param {Object[]} response.product.images - Product images
 * @param {boolean} response.product.hasRequiredAttrsSelected - Flag as to whether all required
 *     attributes have been selected.  Used partially to
 *     determine whether the Add to Cart button can be enabled
 * @param {jQuery} $productContainer - DOM element for a given product.
 */
function handleVariantResponse(response, $productContainer) {
    var isChoiceOfBonusProducts =
        $productContainer.parents('.choose-bonus-product-dialog').length > 0;
    var isVaraint;
    if (response.product.variationAttributes) {
        updateAttrs(response.product.variationAttributes, $productContainer);
        isVaraint = response.product.productType === 'variant';
        if (isChoiceOfBonusProducts && isVaraint) {
            $productContainer.parent('.bonus-product-item')
                .data('pid', response.product.id);

            $productContainer.parent('.bonus-product-item')
                .data('ready-to-order', response.product.readyToOrder);
        }
    }

    if (response.product.images.large.length > 0) {
        $('#pdpCarousel-' + response.product.masterId).slick('destroy').html('');
        $('#pdpCarouselNav-' + response.product.masterId).slick('destroy').html('');

        var images = response.product.images;
        var imagesZoom = response.product.imagesZoom['hi-res'];
        var htmlString = '<!-- Product Image slides -->';
        var htmlStringNav = '<!-- Product Nav Image slides -->';

        images.large.forEach(function (image, idx) {
            var zoomImage = imagesZoom[idx] ? imagesZoom[idx] : image;
            var zoomClass = imagesZoom[idx] ? 'zoom-hires' : 'zoom-disabled';

            var htmlSlide = '<div class="slide">' +
                '<span data-src="' + zoomImage.url + '" class="slide-link ' + zoomClass + '" title="' + zoomImage.title + '">' +
                '<img src="' + image.url + '" class="slide-img" alt="' + image.alt + '" />' +
                '</span>' +
                '</div>';

            htmlString += htmlSlide;
        });

        images.xsmall.forEach(function (image) {
            var htmlSlide = '<div class="slide">' +
                '<span>' +
                '<img src="' + image.url + '" class="slide-img" alt="' + image.alt + '" />' +
                '</span>' +
                '</div>';

            htmlStringNav += htmlSlide;
        });

        $('#pdpCarousel-' + response.product.masterId).html(htmlString);
        $('#pdpCarouselNav-' + response.product.masterId).html(htmlStringNav);

        carousels.pdpCarousel();
    }

    // Update pricing
    if (!isChoiceOfBonusProducts) {
        var $priceSelector = $('.prices .price', $productContainer).length
            ? $('.prices .price', $productContainer)
            : $('.prices .price');
        $priceSelector.replaceWith(response.product.price.html);
    }

    // Update promotions
    $('.promotions').empty().html(getPromotionsHtml(response.product.promotions));

    // Update qty URL
    if ('qtyUrl' in response.product) {
        var qtySelector = getQuantitySelector($productContainer);
        qtySelector.data('url', response.product.qtyUrl);
    }

    updateAvailability(response, $productContainer);

    if (isChoiceOfBonusProducts) {
        var $selectButton = $productContainer.find('.select-bonus-product');
        $selectButton.trigger('bonusproduct:updateSelectButton', {
            product: response.product, $productContainer: $productContainer
        });
    } else {
        // Enable "Add to Cart" button if all required attributes have been selected
        $('button.add-to-cart, button.add-to-cart-global, button.update-cart-product-global').trigger('product:updateAddToCart', {
            product: response.product, $productContainer: $productContainer
        }).trigger('product:statusUpdate', response.product);
    }

    // Update attributes
    $productContainer.find('.main-attributes').empty()
        .html(getAttributesHtml(response.product.attributes));
}

/**
 * @typespec UpdatedQuantity
 * @type Object
 * @property {boolean} selected - Whether the quantity has been selected
 * @property {string} value - The number of products to purchase
 * @property {string} url - Compiled URL that specifies variation attributes, product ID, options,
 *     etc.
 */

/**
 * updates the product view when a product attribute is selected or deselected or when
 *         changing quantity
 * @param {string} selectedValueUrl - the Url for the selected variation value
 * @param {jQuery} $productContainer - DOM element for current product
 */
function attributeSelect(selectedValueUrl, $productContainer) {
    if (selectedValueUrl) {
        $('body').trigger('product:beforeAttributeSelect',
            { url: selectedValueUrl, container: $productContainer });
        $.ajax({
            url: selectedValueUrl,
            method: 'GET',
            success: function (data) {
                handleVariantResponse(data, $productContainer);
                updateOptions(data.product.options, $productContainer);
                $('body').trigger('product:afterAttributeSelect',
                    { data: data, container: $productContainer });
                $.spinner().stop();
            },
            error: function () {
                $.spinner().stop();
            }
        });
    }
}

/**
 * Retrieves url to use when adding a product to the cart
 *
 * @return {string} - The provided URL to use when adding a product to the cart
 */
function getAddToCartUrl() {
    return $('.add-to-cart-url').val();
}

/**
 * Parses the html for a modal window
 * @param {string} html - representing the body and footer of the modal window
 *
 * @return {Object} - Object with properties body and footer.
 */
function parseHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));

    var body = $html.find('.choice-of-bonus-product');
    var footer = $html.find('.modal-footer').children();

    return { body: body, footer: footer };
}

/**
 * Retrieves url to use when adding a product to the cart
 *
 * @param {Object} data - data object used to fill in dynamic portions of the html
 */
function chooseBonusProducts(data) {
    $('.modal-body').spinner().start();

    if ($('#chooseBonusProductModal').length !== 0) {
        $('#chooseBonusProductModal').remove();
    }
    var bonusUrl;
    if (data.bonusChoiceRuleBased) {
        bonusUrl = data.showProductsUrlRuleBased;
    } else {
        bonusUrl = data.showProductsUrlListBased;
    }

    var htmlString = '<!-- Modal -->'
        + '<div class="modal fade" id="chooseBonusProductModal" role="dialog" aria-labelledby="modal-title" data-la-initdispnone="true">'
        + '<div class="modal-dialog choose-bonus-product-dialog" role="document"'
        + 'data-total-qty="' + data.maxBonusItems + '"'
        + 'data-UUID="' + data.uuid + '"'
        + 'data-pliUUID="' + data.pliUUID + '"'
        + 'data-addToCartUrl="' + data.addToCartUrl + '"'
        + 'data-pageStart="0"'
        + 'data-pageSize="' + data.pageSize + '"'
        + 'data-moreURL="' + data.showProductsUrlRuleBased + '"'
        + 'data-bonusChoiceRuleBased="' + data.bonusChoiceRuleBased + '">'
        + '<!-- Modal content-->'
        + '<div class="modal-content">'
        + '<div class="modal-header">'
        + '    <span class="">' + data.labels.selectprods + '</span>'
        + '    <button type="button" class="close pull-right" data-dismiss="modal">&times;</button>'
        + '</div>'
        + '<div class="modal-body"></div>'
        + '<div class="modal-footer"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    $('#main').append(htmlString);
    $('.modal-body').spinner().start();

    $.ajax({
        url: bonusUrl,
        method: 'GET',
        dataType: 'html',
        success: function (html) {
            var parsedHtml = parseHtml(html);
            $('#chooseBonusProductModal .modal-body').empty();
            $('#chooseBonusProductModal .modal-body').html(parsedHtml.body);
            $('#chooseBonusProductModal .modal-footer').html(parsedHtml.footer);
            $('#chooseBonusProductModal').modal('show');
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

/**
 * GA 4 - add_to_cart
 * @param {string} currency - ajax response from clicking the add to cart button
 * @param {string} salevalue - ajax response from clicking the add to cart button
 * @param {string} pid - ajax response from clicking the add to cart button
 * @param {string} productName - ajax response from clicking the add to cart button
 * @param {string} productAttributeType - ajax response from clicking the add to cart button
 * @param {string} salePrice - ajax response from clicking the add to cart button
 * @param {string} quantity - ajax response from clicking the add to cart button
 */
function ga4add_to_cart(currency, salevalue, pid, productName, productAttributeType, salePrice, quantity) {
    window.dataLayer = window.dataLayer || [];
   // window.dataLayer.push({ ecommerce: null });  // Clear the previous ecommerce object.
    dataLayer.push({
      event: "add_to_cart",
      ecommerce: {
        currency: currency,
        value: salevalue,
        items: [
        {
          item_id: pid,
          item_name: productName,      
          item_category: productAttributeType,     
          price: salePrice,
          quantity: quantity
        }
        ]
      }
    });
}

/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 * @param {string} pid - product id of product added to cart
 */
function handlePostCartAdd(response, pid) {
    $('.minicart').trigger('count:update', response);
    var messageType = response.error ? 'alert-danger' : 'alert-success'; 
    // show add to cart toast

    if (response.newBonusDiscountLineItem 
        && Object.keys(response.newBonusDiscountLineItem).length !== 0) {        
        chooseBonusProducts(response.newBonusDiscountLineItem);    
    } else {        
        var productName;        
        var pidStr = typeof pid === 'string' ? pid : pid.toString();        

        if (pidStr.indexOf('{') < 0) {            
            var matchPid = response.cart.items.filter(function (value) {                
                var match;                
                if (value.id === pidStr) {                    
                    match = value;                
                }                
                return match;            
            });            
            productName = matchPid[0].productName;            
            var pid = matchPid[0].id;            
            var itemValue = matchPid[0].priceTotal.price;            
            var salePrice = matchPid[0].price.sales.value;            
            var currency = matchPid[0].price.sales.currency;            
            var quantity = matchPid[0].quantity;            
            var productAttributeType = matchPid[0].productAttributeType;            
            ga4add_to_cart(currency, itemValue, pid, productName, productAttributeType, salePrice, quantity);        
        } else {            
            productName = '';        
        }        

        if ($('.add-to-cart-messages').length === 0) {            
            $('body').append(         
                '<div class="add-to-cart-messages"></div>'
                );        
        }        
        $('.add-to-cart-messages').append(            
            '<div class="alert ' + messageType + ' add-to-basket-alert text-center shadow-block" role="alert">'            
            + '<div class="atc-success-icon"></div>'            
            + '<span><h4>' + response.message + '</h4>'            
            + ' ' + productName + ' <i class="forSR">Added to Cart</i></span>'            
            + '</div>'        
            );        

            setTimeout(function () {            
                $('.add-to-basket-alert').remove();        
            }, 5000);    
        }
}

/**
 * Retrieves the bundle product item ID's for the Controller to replace bundle master product
 * items with their selected variants
 *
 * @return {string[]} - List of selected bundle product item ID's
 */
function getChildProducts() {
    var childProducts = [];
    $('.bundle-item').each(function () {
        childProducts.push({
            pid: $(this).find('.product-id').text(),
            quantity: parseInt($(this).find('label.quantity').data('quantity'), 10)
        });
    });

    return childProducts.length ? JSON.stringify(childProducts) : [];
}

/**
 * Retrieve product options
 *
 * @param {jQuery} $productContainer - DOM element for current product
 * @return {string} - Product options and their selected values
 */
function getOptions($productContainer) {
    var options = $productContainer
        .find('.product-option')
        .map(function () {
            var $elOption = $(this).find('.options-select');
            var urlValue = $elOption.val();
            var selectedValueId = $elOption.find('option[value="' + urlValue + '"]')
                .data('value-id');
            return {
                optionId: $(this).data('option-id'),
                selectedValueId: selectedValueId
            };
        }).toArray();

    return JSON.stringify(options);
}

/**
 * Init the product carousel using a predefined slick configuration
 */
function carouselInit() {
    var $carousels = $('.pdp-carousel');

    if ($carousels.length) {
        $carousels.each(function () {
            imagesloaded($(this)).on('done', function (carousel) {
                var slider = $(carousel.elements);

                // Conditional needed in order for slides past the first to have zoom init
                if (slider[0].slick.slideCount > 1) {
                    slider.on('init afterChange', function () {
                        initZoom(slider);
                    });
                }
                initZoom(slider);
            });
        });
    }
}

/**
 * Enable add all to cart button
 */
function enableAddAllItemsToCart() {
    // using does not equal for cases if value is "none or null"
    var enable = $('.product-availability').toArray().every(function (item) {
        return $(item).data('available') && $(item).data('price-available') && $(item).data('ready-to-order') && $(item).data('buyable') !== false && $(item).data('request-demo') !== true;
    });

    $('button.add-to-cart-global').attr('disabled', !enable);
}

var exportBase = $.extend(true, {}, base, {
    attributeSelect: attributeSelect,
    colorAttribute: function () {
        $(document).on('click', '[data-attr="color"] a', function (e) {
            e.preventDefault();

            if ($(this).attr('disabled')) {
                return;
            }
            var $productContainer = $(this).closest('.set-item');
            if (!$productContainer.length) {
                $productContainer = $(this).closest('.product-detail');
            }

            attributeSelect(e.currentTarget.href, $productContainer);

            var colorName = $(this).find('span.color-value').attr('data-attr-value');
            var labelDisplayName = $(this).siblings('label.color').attr('data-display-name');
            var defaultLabel = $(this).siblings('label.color').attr('data-default-label');

            if (!$(this).find('span.color-value').hasClass('selected')) {
                $(this).siblings('label.color').html(labelDisplayName + ': ' + colorName);
            } else {
                $(this).siblings('label.color').html(defaultLabel + ' ' + labelDisplayName);
            }
        });
    },
    availability: function () {
        $(document).on('change', '.quantity-select', function (e) {
            e.preventDefault();

            var $productContainer = $(this).closest('.product-detail');
            if (!$productContainer.length) {
                $productContainer = $(this)
                    .closest('.modal-content')
                    .find('.product-quickview');
            }

            if ($('.bundle-items', $productContainer).length === 0) {
                var qty = $(this).val();
                var updateQtyUrl = $(e.currentTarget).data('url');
                var url =
                    updateQtyUrl +
                    (updateQtyUrl.indexOf('?') >= 0 ? '&' : '?') +
                    'quantity=' +
                    qty;
                attributeSelect(url, $productContainer);
            }
        });
    },
    addToCart: function () {
        $(document).on(
            'click',
            'button.add-to-cart, button.add-to-cart-global',
            function () {
                var addToCartUrl;
                var pid;
                var pidsObj;
                var setPids;

                $('body').trigger('product:beforeAddToCart', this);

                if (
                    $('.set-items').length &&
                    $(this).hasClass('add-to-cart-global')
                ) {
                    setPids = [];

                    $('.product-detail').each(function () {
                        if (!$(this).hasClass('product-set-detail')) {
                            setPids.push({
                                pid: $(this)
                                    .find('.product-id')
                                    .text(),
                                qty: $(this)
                                    .find('.quantity-select')
                                    .val(),
                                options: getOptions($(this))
                            });
                        }
                    });
                    pidsObj = JSON.stringify(setPids);
                }

                pid = getPidValue($(this));

                var $productContainer = $(this).closest('.product-detail');
                if (!$productContainer.length) {
                    $productContainer = $(this)
                        .closest('.quick-view-dialog')
                        .find('.product-detail');
                }

                addToCartUrl = getAddToCartUrl();

                var form = {
                    pid: pid,
                    pidsObj: pidsObj,
                    childProducts: getChildProducts(),
                    quantity: getQuantitySelected($(this))
                };

                if (!$('.bundle-item').length) {
                    form.options = getOptions($productContainer);
                }

                $(this).trigger('updateAddToCartFormData', form);
                if (addToCartUrl) {
                    $.ajax({
                        url: addToCartUrl,
                        method: 'POST',
                        data: form,
                        success: function (data) {
                            var resPid = form.pidsObj ? form.pidsObj : form.pid;
                            handlePostCartAdd(data, resPid);

                            $('body').trigger('product:afterAddToCart', data);
                            $.spinner().stop();
                        },
                        error: function () {
                            $.spinner().stop();
                        }
                    });
                }
            }
        );

        $('body').on('product:updateAddToCart', function (e, response) {
            // update local add to cart (for sets)
            $('button.add-to-cart', response.$productContainer).attr('disabled',
                (!response.product.readyToOrder || !response.product.available || response.product.isBuyable === false || !response.product.priceAvailability || response.product.requestDemo === true));

            enableAddAllItemsToCart();
        });
        enableAddAllItemsToCart();
    },
    carouselInit: carouselInit,
    pdpSpecsCollapse: function () {
        $('.pdp-specs-nav').on('click', '.nav-link[data-toggle="collapse"]', function () {
            var dataTarget = $(this).data('target');

            if ($(dataTarget).hasClass('show')) {
                event.stopPropagation();
            }

            utils.scrollBrowser($('.nav-link[data-target="' + dataTarget + '"]').closest('.description-and-detail').offset().top - 30);
        });

        // mobile - keep user in accordion section after drawers collapse
        $('.pdp-specs-accordion').on('click', '.btn-link[data-toggle="collapse"]', function () {
            var mobileDataTarget = $(this).data('target');

            utils.scrollBrowser($('.btn-link[data-target="' + mobileDataTarget + '"]').closest('.description-and-detail').offset().top - 30);
        });
    },
    removeBonusProduct: function () {
        $(document).on('click', '.selected-pid', function () {
            $(this).remove();
            var $selected = $('#chooseBonusProductModal .selected-bonus-products .selected-pid');
            var count = 0;
            if ($selected.length) {
                $selected.each(function () {
                    count += parseInt($(this).data('qty'), 10);
                });
            }

            $('.pre-cart-products').html(count);
            $('.selected-bonus-products .bonus-summary').removeClass('alert-danger');

            // handle button state
            if (count !== 0 && count <= $('.choose-bonus-product-dialog').data('total-qty')) {
                $('.add-bonus-products').removeAttr('disabled');
            } else {
                $('.add-bonus-products').attr('disabled', true);
            }
        });
    },
    selectBonusProduct: function () {
        $(document).on('click', '.select-bonus-product', function () {
            var $choiceOfBonusProduct = $(this).parents('.choice-of-bonus-product');
            var pid = $(this).data('pid');
            var maxPids = $('.choose-bonus-product-dialog').data('total-qty');
            var submittedQty = parseInt($(this).parents('.choice-of-bonus-product').find('.quantity-select').val(), 10);
            var totalQty = 0;
            $.each($('#chooseBonusProductModal .selected-bonus-products .selected-pid'), function () {
                totalQty += $(this).data('qty');
            });
            totalQty += submittedQty;
            var optionID = $(this).parents('.choice-of-bonus-product').find('.product-option').data('option-id');
            var valueId = $(this).parents('.choice-of-bonus-product').find('.options-select option:selected').data('valueId');
            if (totalQty <= maxPids) {
                var selectedBonusProductHtml = '' +
                    '<div class="selected-pid row" ' +
                    'data-pid="' + pid + '"' +
                    'data-qty="' + submittedQty + '"' +
                    'data-optionID="' + (optionID || '') + '"' +
                    'data-option-selected-value="' + (valueId || '') + '"' +
                    '>' +
                    '<div class="col bonus-product-name" >' +
                    $choiceOfBonusProduct.find('.product-name').html() +
                    '</div>' +
                    '<div class="col-1"><button class="remove-btn" aria-hidden="true"></button></div>' +
                    '</div>';
                $('#chooseBonusProductModal .selected-bonus-products').append(selectedBonusProductHtml);
                $('.pre-cart-products').html(totalQty);
                $('.selected-bonus-products .bonus-summary').removeClass('alert-danger');
                $('.add-bonus-products').removeAttr('disabled');
            } else {
                $('.selected-bonus-products .bonus-summary').addClass('alert-danger');
            }
        });
    },
    selectAttribute: function () {
        $(document).on('change', 'select[class*="select-"], .options-select', function (e) {
            e.preventDefault();

            var $productContainer = $(this).closest('.set-item');
            if (!$productContainer.length) {
                $productContainer = $(this).closest('.product-detail');
            }
            attributeSelect(e.currentTarget.value, $productContainer);
        });
    },
    addBonusProductsToCart: function () {
        $(document).on('click', '.add-bonus-products', function () {
            var $readyToOrderBonusProducts = $('.choose-bonus-product-dialog .selected-pid');
            var queryString = '?pids=';
            var url = $('.choose-bonus-product-dialog').data('addtocarturl');
            var pidsObject = {
                bonusProducts: []
            };

            $.each($readyToOrderBonusProducts, function () {
                var qtyOption =
                    parseInt($(this)
                        .data('qty'), 10);

                var option = null;
                if (qtyOption > 0) {
                    if ($(this).data('optionid') && $(this).data('option-selected-value')) {
                        option = {};
                        option.optionId = $(this).data('optionid');
                        option.productId = $(this).data('pid');
                        option.selectedValueId = $(this).data('option-selected-value');
                    }
                    pidsObject.bonusProducts.push({
                        pid: $(this).data('pid'),
                        qty: qtyOption,
                        options: [option]
                    });
                    pidsObject.totalQty = parseInt($('.pre-cart-products').html(), 10);
                }
            });
            queryString += JSON.stringify(pidsObject);
            queryString = queryString + '&uuid=' + $('.choose-bonus-product-dialog').data('uuid');
            queryString = queryString + '&pliuuid=' + $('.choose-bonus-product-dialog').data('pliuuid');
            $.spinner().start();
            $.ajax({
                url: url + queryString,
                method: 'POST',
                success: function (data) {
                    $.spinner().stop();
                    if (data.error) {
                        $('.error-choice-of-bonus-products')
                        .html(data.errorMessage);
                    } else {
                        $('.configure-bonus-product-attributes').html(data);
                        $('.bonus-products-step2').removeClass('hidden-xl-down');
                        $('#chooseBonusProductModal').modal('hide');

                        if ($('.add-to-cart-messages').length === 0) {
                            $('body').append(
                            '<div class="add-to-cart-messages"></div>'
                         );
                        }
                        $('.minicart-quantity').html(data.totalQty);
                        $('.add-to-cart-messages').append(
                            '<div class="alert alert-success add-to-basket-alert text-center" role="alert">'
                            + '<div class="atc-success-icon"></div>'
                            + '<h4>' + data.msgSuccess + '</h4>'
                            + '</div>'
                        );

                        setTimeout(function () {
                            $('.add-to-basket-alert').remove();
                            if ($('.cart-page').length) {
                                location.reload();
                            }
                        }, 3000);
                    }
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    }
});

module.exports = exportBase;
