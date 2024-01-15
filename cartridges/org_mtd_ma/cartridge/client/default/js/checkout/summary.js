'use strict';

var base = require('base/checkout/summary');

/**
 * updates the totals summary
 * @param {Object} order - order object
 */
function updateTotals(order) {
    var totals = order.totals;
    $('.shipping-total-cost').text(totals.totalShippingCost);
    $('.tax-total').text(totals.totalTax);
    $('.sub-total').text(totals.subTotal);
    $('.grand-total-sum').text(totals.grandTotal);

    if (totals.orderLevelDiscountTotal.value > 0) {
        $('.order-discount').show();
        $('.order-discount-total').text('- ' + totals.orderLevelDiscountTotal.formatted);
    } else {
        $('.order-discount').hide();
    }

    if (totals.shippingLevelDiscountTotal.value > 0) {
        $('.shipping-discount').show();
        $('.shipping-discount-total').text('- ' +
            totals.shippingLevelDiscountTotal.formatted);
    } else {
        $('.shipping-discount').hide();
    }
}

/**
 * updates the order product shipping summary for an order model
 * @param {Object} order - the order model
 */
function updateOrderProductSummaryInformation(order) {
    var $productSummary = $('<div />');
    order.shipping.forEach(function (shipping) {
        shipping.productLineItems.items.forEach(function (lineItem) {
            var pli = $('[data-product-line-item=' + lineItem.UUID + ']');
            pli.attr('id', lineItem.id);
            $productSummary.append(pli);
        });

        var address = shipping.shippingAddress || {};
        var selectedMethod = shipping.selectedShippingMethod;

        var nameLine = address.firstName ? address.firstName + ' ' : '';
        if (address.lastName) nameLine += address.lastName;

        var address1Line = address.address1;
        var address2Line = address.address2;

        var phoneLine = address.phone;

        var shippingCost = selectedMethod ? selectedMethod.shippingCost : '';
        var methodNameLine = selectedMethod ? selectedMethod.displayName : '';
        var methodArrivalTime = selectedMethod && selectedMethod.estimatedArrivalTime
            ? '( ' + selectedMethod.estimatedArrivalTime + ' )'
            : '';

        var tmpl = $('#pli-shipping-summary-template').clone();

        if (shipping.productLineItems.items && shipping.productLineItems.items.length > 1) {
            $('h5 > span').text(' - ' + shipping.productLineItems.items.length + ' '
                + order.resources.items);
        } else {
            $('h5 > span').text('');
        }

        var stateRequiredAttr = $('#shippingState').attr('required');
        var isRequired = stateRequiredAttr !== undefined && stateRequiredAttr !== false;
        var stateExists = (shipping.shippingAddress && shipping.shippingAddress.stateCode)
            ? shipping.shippingAddress.stateCode
            : false;
        var stateBoolean = false;
        if ((isRequired && stateExists) || (!isRequired)) {
            stateBoolean = true;
        }

        var shippingForm = $('.multi-shipping input[name="shipmentUUID"][value="' + shipping.UUID + '"]').parent();

        if (shipping.shippingAddress
            && shipping.shippingAddress.firstName
            && shipping.shippingAddress.address1
            && shipping.shippingAddress.city
            && stateBoolean
            && shipping.shippingAddress.countryCode
            && (shipping.shippingAddress.phone || shipping.productLineItems.items[0].fromStoreId)) {
            $('.ship-to-name', tmpl).text(nameLine);
            $('.ship-to-address1', tmpl).text(address1Line);
            $('.ship-to-address2', tmpl).text(address2Line);
            $('.ship-to-city', tmpl).text(address.city);
            if (address.stateCode) {
                $('.ship-to-st', tmpl).text(address.stateCode);
            }
            $('.ship-to-zip', tmpl).text(address.postalCode);
            $('.ship-to-phone', tmpl).text(phoneLine);

            if (!address2Line) {
                $('.ship-to-address2', tmpl).hide();
            }

            if (!phoneLine) {
                $('.ship-to-phone', tmpl).hide();
            }

            shippingForm.find('.ship-to-message').text('');
        } else {
            shippingForm.find('.ship-to-message').text(order.resources.addressIncomplete);
        }

        if (shipping.isGift) {
            $('.gift-message-summary', tmpl).text(shipping.giftMessage);
        } else {
            $('.gift-summary', tmpl).addClass('d-none');
        }

        // checking h5 title shipping to or pickup
        var $shippingAddressLabel = $('.shipping-header-text', tmpl);
        $('body').trigger('shipping:updateAddressLabelText',
            { selectedShippingMethod: selectedMethod, resources: order.resources, shippingAddressLabel: $shippingAddressLabel });

        if (shipping.selectedShippingMethod) {
            $('.display-name', tmpl).text(methodNameLine);
            $('.arrival-time', tmpl).text(methodArrivalTime);
            $('.price', tmpl).text(shippingCost);
        }

        var $shippingSummary = $('<div class="multi-shipping" data-shipment-summary="'
            + shipping.UUID + '" />');
        $shippingSummary.html(tmpl.html());
        $productSummary.append($shippingSummary);

        $('.product-summary-block').html($productSummary.html());
        if (order.CARBCompliantItemInCart && address.stateCode === 'CA') {
            $('.CARBCompliantMessage').addClass('d-block');
            $('.submit-shipping').prop('disabled', true);
            var CARBCompliantItemHtml;
            for (var i = 0; i < order.items.items.length; i++) {
                if (order.items.items[i].CARBCompliantItem) {
                    var product = order.items.items[i];
                    var removeAlert = '#' + product.id + '.product-line-item';
                    var removeSuggestion = '#' + product.id + ' .CARBSuggestion';
                    var removeCARBIcon = '#' + product.id + ' .CARBIcon';
                    var removeProductButton = '#' + product.id + ' .remove-product';
                    $(removeAlert).removeClass('alert alert-danger');
                    $(removeSuggestion).remove();
                    $(removeCARBIcon).remove();
                    $(removeProductButton).remove();
                    var CARBCompliantItem = '<div class="alert CARBSuggestion">' +
                    '<p>This model cannot be shipped to an address in California. If you have questions, please contact customer service.<br><br>' +
                    '<strong class ="alterPro">Alternative Products:</strong> </p>' +
                    '<div class="alterContent">';
                    var item = order.items.items[i];
                    var text = '#' + item.id + '.product-line-item';
                    $(text).addClass('alert alert-danger');
                    for (var j = 0; j < item.CARBProductSuggestions.length; j++) {
                        var suggestionProdName2 = item.CARBProductSuggestions[j].name2 ? item.CARBProductSuggestions[j].name2 : '';
                        CARBCompliantItem = CARBCompliantItem + '<div id="'+item.CARBProductSuggestions[j].id+' "class="removeCARBProduct" data-mainproductid="'+ item.id +'" '+
                        ' data-mainproductname=" '+ item.productName + '" data-mainproductaction="'+ item.removeCARBProductUrl + 
                        '" data-mainproductuuid="'+item.UUID+'" data-removecheckoutproduct="true" data-suggestionproducturl="'+item.CARBProductSuggestions[j].pdpUrl +'">'
                        + '<a href="' + item.CARBProductSuggestions[j].pdpUrl + '">' +
                                '<img src="' + item.CARBProductSuggestions[j].imageUrl + '" alt="' + item.CARBProductSuggestions[j].name + '" class="suggestion-img">' +
                                '<strong>' + item.CARBProductSuggestions[j].name + '</strong>' +
                                '<p>' + suggestionProdName2 + '</p></a></div>';
                    }
                    CARBCompliantItemHtml = CARBCompliantItem + '</div></div>';
                    var addMsg = '#' + item.id + ' .CARBCompliantItem';
                    $(addMsg).append(CARBCompliantItemHtml);
                    var CARBIcon = '<div class="CARBIcon position-absolute w-100 flex justify-content-center align-items-center p-xl-3">' +
                                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" class="w-100">' +
                                    '<path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" class="iconPath"></path>' +
                                '</svg> </div>';
                    var CARBWarning = '#' + item.id + ' .CARBWarning';
                    $(CARBWarning).append(CARBIcon);
                    var removeButtonHtml = '<a href="#" class="remove-product" data-toggle="modal" data-target="#removeProductModal" data-pid="'+ item.id +'" '+
                    'data-name=" '+ item.productName + '" data-action="'+ item.removeCARBProductUrl + '" data-uuid="'+item.UUID+'" data-removecheckoutproduct="true" aria-label="remove"> <span aria-hidden="true"></span> Remove </a>';
                    var CARBRemoveButton = '#' + item.id + ' .remove-line-item';
                    $(CARBRemoveButton).append(removeButtonHtml);

                }
            }
        } else if (address.stateCode !== 'CA') {
            $('.CARBCompliantMessage').addClass('d-none');
            $('.CARBCompliantMessage').removeClass('d-block');
            for (var k = 0; k < order.items.items.length; k++) {
                if (order.items.items[k].CARBCompliantItem) {
                    var product = order.items.items[k];
                    var removeAlert = '#' + product.id + '.product-line-item';
                    var removeSuggestion = '#' + product.id + ' .CARBSuggestion';
                    var removeCARBIcon = '#' + product.id + ' .CARBIcon';
                    var removeProductButton = '#' + product.id + ' .remove-product';
                    $(removeAlert).removeClass('alert alert-danger');
                    $(removeSuggestion).remove();
                    $(removeCARBIcon).remove();
                    $(removeProductButton).remove();
                }
            }
        }
    });
}

/**
 * appends params to a url
 * @param {string} url - Original url
 * @param {Object} params - Parameters to append
 * @returns {string} result url with appended parameters
 */
function appendToUrl(url, params) {
    var newUrl = url;
    newUrl += (newUrl.indexOf('?') !== -1 ? '&' : '?') + Object.keys(params).map(function (key) {
        return key + '=' + encodeURIComponent(params[key]);
    }).join('&');

    return newUrl;
}

$('body').on('click', '.removeCARBProduct', function (e) {
    e.preventDefault();

    var productID = $(this).data('mainproductid');
    var url = $(this).data('mainproductaction');
    var uuid = $(this).data('mainproductuuid');
    var removingCARBProFromCheckout = $(this).data('removecheckoutproduct');
    var alternativeProductUrl = $(this).data('suggestionproducturl')
    var urlParams = {
        pid: productID,
        uuid: uuid
    };

    url = appendToUrl(url, urlParams);
    $.spinner().start();
    $.ajax({
        url: url,
        type: 'get',
        dataType: 'json',
        success: function (data) {
            location.replace(alternativeProductUrl);
        },
        error: function (err) {
            if (err.responseJSON.redirectUrl) {
                window.location.href = err.responseJSON.redirectUrl;
            } else {
                createErrorNotification(err.responseJSON.errorMessage);
                $.spinner().stop();
            }
        }
    });
});

var exportBase = $.extend(true, {}, base, {
    updateTotals: updateTotals,
    updateOrderProductSummaryInformation: updateOrderProductSummaryInformation
});

module.exports = exportBase;
