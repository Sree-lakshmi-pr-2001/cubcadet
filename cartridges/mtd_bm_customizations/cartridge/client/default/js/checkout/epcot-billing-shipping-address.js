/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-alert */
/* eslint-disable camelcase */
/* eslint-disable */
'use strict';
var epcotMiniCartjs = require('./epcot-minicart'); 
var isCARBEnabled = document.getElementById('isCARBEnabled').value;
var isGoogleAddressValidationEnabled =  document.getElementById('isGoogleAddressValidationEnabled').value;
$(function () {
    if ($('#shippingStateSet').val()) {
        console.log($('#shippingStateSet').val());
        $('#shipping_state').val($('#shippingStateSet').val());
    }
    if ($('#billingStateSet').val()) {
        console.log('billing state set');
        console.log($('#billingStateSet').val());
        $('#billing_state').val($('#billingStateSet').val());
    }
});

/**
 * fill shipping address with billing address values
 * @param {Object} val - val of checkbox
 */
function swapSameAsBilling() {
    document.getElementById('shipping_firstName').value = document.getElementById('billing_firstName').value;
    document.getElementById('shipping_lastName').value = document.getElementById('billing_lastName').value;
    document.getElementById('shipping_address1').value = document.getElementById('billing_address1').value;
    document.getElementById('shipping_address2').value = document.getElementById('billing_address2').value;
    document.getElementById('shipping_city').value = document.getElementById('billing_city').value;
    document.getElementById('shipping_state').value = document.getElementById('billing_state').value;
    document.getElementById('shipping_postalCode').value = document.getElementById('billing_postalCode').value;
    document.getElementById('shipping_countryCode').value = document.getElementById('billing_countryCode').value;
    document.getElementById('shipping_phone').value = document.getElementById('billing_phone').value;
    if(isCARBEnabled == 'true'){
        $('#shipping_state').trigger('change');
    }
}

/**
 * valiate from fields for both billing and shipping address.
 * @returns {boolean} validation status of the form.
 */
function validateAddressForm() {
    var firstName = document.getElementById('billing_firstName').value;
    var lastName = document.getElementById('billing_lastName').value;
    var address = document.getElementById('billing_address1').value;
    var city = document.getElementById('billing_city').value;
    var state = document.getElementById('billing_state').value;
    var zip = document.getElementById('billing_postalCode').value;
    var country = document.getElementById('billing_countryCode').value;
    var phone = document.getElementById('billing_phone').value;
    var email = document.getElementById('billing_email').value;

    // check for empty fields in billing address
    if (!firstName || !lastName || !address || !city || !state || !zip || !country || !phone || !email) {
        alert('Please fill out all required fields for the billing address');
        return false;
    }

    // verify the shipping address
    if (document.getElementById('sameAsBilling').checked === true) {
        console.log('same as billing cleared');
        // if the check box is checked, then there doesn't need to be any additional validation since it would have validated the previous fields
        return true;
    }
    // verify that all of the shipping information is filled out
    var s_firstName = document.getElementById('shipping_firstName').value;
    var s_lastName = document.getElementById('shipping_lastName').value;
    var s_address = document.getElementById('shipping_address1').value;
    var s_city = document.getElementById('shipping_city').value;
    var s_state = document.getElementById('shipping_state').value;
    var s_zip = document.getElementById('shipping_postalCode').value;
    var s_country = document.getElementById('shipping_countryCode').value;
    var s_phone = document.getElementById('shipping_phone').value;

    if (!s_firstName || !s_lastName || !s_address || !s_city || !s_state || !s_zip || !s_country || !s_phone) {
        alert('Please fill out all required fields for the shipping address');
        return false;
    }

    return true;
}


/**
 * update address in form from mtd address validate call.
 * @param {Object} address - the corrected address.
 * @param {Object} type - type of the address (bill/ship)
 */
function addressUpdate(address, type) {
    if (type === 'bill') {
        $('#billing_address1').val(address.address1);
        $('#billing_address2').val(address.address2);
        $('#billing_city').val(address.city);
        $('#billing_state').val(address.state);
        $('#billing_postalCode').val(address.postalCode);
    } else {
        $('#shipping_address1').val(address.address1);
        $('#shipping_address2').val(address.address2);
        $('#shipping_city').val(address.city);
        $('#shipping_state').val(address.state);
        $('#shipping_postalCode').val(address.postalCode);
    }
}

/**
 * update address in modal from mtd address validate call.
 * @param {Object} address - the corrected address.
 * @param {Object} type - type of the address (bill/ship).
 * @param {Object} corrected - type of the address (bill/ship)
 */
function modalUpdate(address, type, corrected) {
    var city;
    var state;
    var zipcode;
    if (corrected) {
        if (type === 'bill') {
            $('.billing.corrected').find('.street').text(address.address1);
            $('.billing.corrected').find('.street2').text(address.address2);
            city = address.city;
            state = address.state;
            zipcode = address.postalCode;
            $('.billing.corrected').find('.street-city-zip').text(city + ', ' + state + ', ' + zipcode);
            $('.billing.corrected').find('.city').val(city);
            $('.billing.corrected').find('.state').val(state);
            $('.billing.corrected').find('.zip').val(zipcode);
        } else {
            $('.shipping.corrected').find('.street').text(address.address1);
            $('.shipping.corrected').find('.street2').text(address.address2);
            city = address.city;
            state = address.state;
            zipcode = address.postalCode;
            $('.shipping.corrected').find('.street-city-zip').text(city + ', ' + state + ', ' + zipcode);

            $('.shipping.corrected').find('.city').val(city);
            $('.shipping.corrected').find('.state').val(state);
            $('.shipping.corrected').find('.zip').val(zipcode);
        }
    }
}

/**
 *  initializes the address selection modal with both billing and shipping addresses.
 */
function modalInit() {
    $('.billing.original').find('.street').text($('#billing_address1').val());
    $('.billing.original').find('.street2').text($('#billing_address2').val());
    var city = $('#billing_city').val();
    var state = $('#billing_state').val();
    var zipcode = $('#billing_postalCode').val();
    $('.billing.original').find('.street-city-zip').text(city + ', ' + state + ', ' + zipcode);

    $('.billing.original').find('.city').val(city);
    $('.billing.original').find('.state').val(state);
    $('.billing.original').find('.zip').val(zipcode);


    $('.shipping.original').find('.street').text($('#shipping_address1').val());
    $('.shipping.original').find('.street2').text($('#shipping_address2').val());
    city = $('#shipping_city').val();
    state = $('#shipping_state').val();
    zipcode = $('#shipping_postalCode').val();
    $('.shipping.original').find('.street-city-zip').text(city + ', ' + state + ', ' + zipcode);

    $('.shipping.original').find('.city').val(city);
    $('.shipping.original').find('.state').val(state);
    $('.shipping.original').find('.zip').val(zipcode);
}

/**
 * rest call to validate both billing and shipping address.
 */
function checkForSubmit() {
    if (validateAddressForm()) {
        var url;
        if(isGoogleAddressValidationEnabled === 'true'){
            url = '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-VerifyAddressByGoogle';
        } else { 
            url = '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AJAXAddressValidate';
        }
        $.post(url, $('#addressForm').serialize(), function (data) {
            var validatedBill = data.billing;
            var validateShip = data.shipping;
            var corrected = false;
            $('#addressModal').modal('show');
            modalInit();
            if (!validateShip.correctedFlag) {
                console.log('Theres no corrected shipping information to display');
                corrected = false;
                addressUpdate(validateShip.originalAddress, 'ship');
                modalUpdate(validateShip.originalAddress, 'ship', corrected);
                $('.shipping.corrected .radio').hide();
                $('.shipping.corrected .street').hide();
                $('.shipping.corrected .street-city-zip').hide();
                $('.shipping.corrected input[type=radio]').prop('checked', false);
                $('.shipping .message').show();
            } else {
                corrected = true;
                if (validateShip.correctedFlag) {
                    addressUpdate(validateShip.correctedAddress, 'ship');
                    modalUpdate(validateShip.correctedAddress, 'ship', corrected);
                    $('.shipping.corrected').show();
                    $('.shipping.corrected .radio').show();
                    $('.shipping.corrected .street').show();
                    $('.shipping.corrected .street-city-zip').show();
                    $('.shipping .message').hide();
                    $('.corrected-address').show();
                }
            }

            if (!validatedBill.correctedFlag) {
                console.log('Theres no corrected billing information to display');
                corrected = false;
                addressUpdate(validatedBill.originalAddress, 'bill');
                modalUpdate(validatedBill.originalAddress, 'bill', corrected);
                $('.billing.corrected .radio').hide();
                $('.billing.corrected .street').hide();
                $('.billing.corrected .street-city-zip').hide();
                $('.billing .message').show();
                $('.billing.corrected input[type=radio]').prop('checked', false);
            } else {
                corrected = true;
                $('#addressModal').modal('show');
                if (validatedBill.correctedFlag) {
                    addressUpdate(validatedBill.correctedAddress, 'bill');
                    modalUpdate(validatedBill.correctedAddress, 'bill', corrected);
                    $('.billing.corrected').show();
                    $('.billing.corrected .radio').show();
                    $('.billing.corrected .street').show();
                    $('.billing.corrected .street-city-zip').show();
                    $('.billing .message').hide();
                    $('.corrected-address').show();
                }
            }
        })
            .done(function () {
            })
            .fail(function () {
            });
    }
}

$('#modal-submit').on('click submit', function (e) {
    if (!$('.billing.corrected input[type=radio]').is(':checked') && !$('.billing.original input[type=radio]').is(':checked')) {
            alert('Please select your billing address');
            e.preventDefault();
    }

    if (!$('.shipping.corrected input[type=radio]').is(':checked') && !$('.shipping.original input[type=radio]').is(':checked')) {
            alert('Please select your shipping address');
            e.preventDefault();
    }
});

/**
 * rest call to validate both billing and shipping address.
 */
function customerSearchSubmit() {
    $.get('/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AJAXCustomerSearch', $('#customer-search').serialize(), function (data) {
        if (data.customers.length !== 0) {
            $('.customers-search-msg').find('.loader').hide();
            $('#customer-search-modal').modal('show');

            // eslint-disable-next-line array-callback-return
            data.customers.map(function (customer, index) {
                var classEvenOdd = null;
                if (index % 2 === 0) {
                    classEvenOdd = 'odd';
                } else {
                    classEvenOdd = 'even';
                }
                var billFullName = customer.billing.customerName;
                var shipFullName = customer.shipping.customerName;

                var billFirstName = billFullName.substr(0, billFullName.indexOf(' '));
                var billLastName = billFullName.substr(billFullName.indexOf(' ') + 1);
                var billPhone = customer.billing.phoneNumber ? customer.billing.phoneNumber : '';
                var billEmail = customer.billing.email ? customer.billing.email : '';
                var billAddress1 = customer.billing.address ? customer.billing.address : '';
                var billAddress2 = customer.billing.specialAddress ? customer.billing.specialAddress : '';
                var billCity = customer.billing.city ? customer.billing.city : '';
                var billState = customer.billing.stateCode ? customer.billing.stateCode : '';
                var billZipCode = customer.billing.zipCode ? customer.billing.zipCode : '';

                var shipFirstName = shipFullName.substr(0, shipFullName.indexOf(' '));
                var shipLastName = shipFullName.substr(shipFullName.indexOf(' ') + 1);
                var shipPhone = customer.shipping.phoneNumber ? customer.shipping.phoneNumber : '';
                var shipAddress1 = customer.shipping.address ? customer.shipping.address : '';
                var shipAddress2 = customer.shipping.specialAddress ? customer.shipping.specialAddress : '';
                var shipCity = customer.shipping.city ? customer.shipping.city : '';
                var shipState = customer.shipping.stateCode ? customer.shipping.stateCode : '';
                var shipZipCode = customer.shipping.zipCode ? customer.shipping.zipCode : '';

                var customerDetailTemplate = document.getElementById('customer-detail-template');
                var customerDetail = document.importNode(customerDetailTemplate.content, true);
                customerDetail.querySelector('.customer-detail').classList.add(classEvenOdd);

                customerDetail.querySelector('.name').textContent = billFullName;
                customerDetail.querySelector('.phone').textContent = billPhone;
                customerDetail.querySelector('.email').textContent = billEmail;
                customerDetail.querySelector('.address').textContent = billAddress1;
                customerDetail.querySelector('.street-city-zip').textContent = billZipCode;

                customerDetail.querySelector('#ship-firstName').value = shipFirstName;
                customerDetail.querySelector('#ship-lastName').value = shipLastName;
                customerDetail.querySelector('#ship-address1').value = shipAddress1;
                customerDetail.querySelector('#ship-address2').value = shipAddress2;
                customerDetail.querySelector('#ship-city').value = shipCity;
                customerDetail.querySelector('#ship-state').value = shipState;
                customerDetail.querySelector('#ship-zipCode').value = shipZipCode;
                customerDetail.querySelector('#ship-phone').value = shipPhone;

                customerDetail.querySelector('#bill-firstName').value = billFirstName;
                customerDetail.querySelector('#bill-lastName').value = billLastName;
                customerDetail.querySelector('#bill-address1').value = billAddress1;
                customerDetail.querySelector('#bill-address2').value = billAddress2;
                customerDetail.querySelector('#bill-city').value = billCity;
                customerDetail.querySelector('#bill-state').value = billState;
                customerDetail.querySelector('#bill-zipCode').value = billZipCode;
                customerDetail.querySelector('#bill-phone').value = billPhone;
                customerDetail.querySelector('#bill-email').value = billEmail;

                $('#customer-search-modal').find('.list').append(customerDetail);
            });
        } else {
            $('#customer-search-modal').modal('hide');
            $('.customers-search-msg').find('.loader').hide();
            $('.customers-search-msg').find('.error').append('No customers found!');
        }
    })
        .done(function () {
        })
        .fail(function () {
        });
}

/**
 * Submit billing and shipping address form.
 */
function formSubmit() {
    document.getElementById('addressForm').submit();
}

$('#shipping_state').on('change', function(){
    $.spinner().start();
    if(isCARBEnabled == 'true'){
        var state = $('#shipping_state').val();
        var basketId = $('#globalBasketId').val();
        $('#CARBItemInCart').val(false);
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
        if (state === 'CA') {
            $.ajax({
                type: 'POST',
                url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AjaxGetBasket',
                data: {
                    basketId: basketId
                },
                success: function (response) {
                    console.log('basket result : ' + response);
                    var products = response.product_items;
                    for (var i = 0; i < products.length; i++) {
                        var productId = products[i].product_id;
                        updateCARBSection(productId);
                    }
                },
                error: function () {
                    console.log('basket request error');
                }
            });  
        } else {
            $.spinner().stop();
        }
    }
})

function updateCARBSection(productId){
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
                        var carbSection;
                        if(mainProd.c_CARBCompliantItem){
                            $('#CARBItemInCart').val(true);
                            $('#product-'+ productId +'').addClass('carb-item');
                            $('#product-'+ productId +' .quantity .quantity-input').attr('disabled','disabled');
                            $('#product-'+ productId +' .updateButton').attr('disabled','disabled');
                            $('#product-'+ productId +' .noChargeButton').attr('disabled','disabled');
                            $('#product-'+ productId +' .calculateItemWiseDiscount').attr('disabled','disabled');
                            $('#product-'+ productId +' .itemdiscountValue').attr('disabled','disabled');
                            $('#product-'+ productId +' .itemDiscountType').attr('disabled','disabled');
                            $('#product-'+ productId +' .removeButton').addClass('btn-primary');
                            $(window).scrollTop(0);
                            carbSection = '<div class="alert CARBSuggestion">' +
                            '<p class="carb-msg">This model cannot be shipped to an address in California. If you have questions, please contact customer service.<br><br>' +
                            '<strong class ="alterPro">Alternative Products:</strong> </p></div>'
                            $('#product-'+ productId +'').append(carbSection);
                            $('#product-'+ productId +' .CARBSuggestion').append('<div class="alterProduct"> </div>');
                            if(mainProd.c_CARBProductSuggestions){
                                var suggestionProData;
                                var removeProductId = $('#product-'+ productId +' .removeButton').attr('id').substring(12);
                                for (var j = 0; j < mainProd.c_CARBProductSuggestions.length; j++) {
                                    var suggestionProdId = mainProd.c_CARBProductSuggestions[j];
                                    $.ajax({
                                        type: 'POST',
                                        url: '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-AjaxProductSearch',
                                        data: {
                                            searchTerm: suggestionProdId
                                        },
                                        success: function (res) {
                                            console.log('product search' + productId +'response :' + res);
                                            var suggestionProdHit = res.hits;
                                            
                                            for(var l = 0; l < suggestionProdHit.length; l++){
                                                    var suggestionProdName2 = suggestionProdHit[l].c_productName2.default ?suggestionProdHit[l].c_productName2.default : '';
                                                    suggestionProData = '<div id="'+ suggestionProdHit[l].id+' "class="removeCARBProduct" data-mainproductid="'+ removeProductId +'" '+
                                                    ' data-mainproductname=" '+ mainProd.name.default + '" data-mainproductaction="'+ removeProductId + '" data-alterprodid= " '+ suggestionProdHit[l].id + '"> <img src="' + suggestionProdHit[l].image.abs_url + '" alt="' + suggestionProdHit[l].name.default + '" class="suggestion-img"> <br>' +
                                                    '<strong>' + suggestionProdHit[l].name.default + '</strong>' +
                                                    '<p>' + suggestionProdName2 + '</p></a></div>';
                                                $('#product-'+ productId +' .CARBSuggestion .alterProduct').append(suggestionProData);
                                            }
                                            
                                        },
                                        error: function () {
                                            console.log('product search error');
                                        }
                                    })
                                }
                                
                            }
                            $('.CARBCompliantMessage').removeClass('d-none');
                            $('.CARBButton').removeClass('d-none');
                            $('.CARBCompliantMessage').addClass('d-block');
                            $('.CARBButton').addClass('d-flex');
                            $('#validate-address-btn').attr('disabled','disabled');
                        }

                    }
                }
                $.spinner().stop();
            }
        },
        error: function () {
            console.log('product search error');
        }
    })
}

$('body').on('click', '.removeCARBProduct', function (e) {
    if(isCARBEnabled == 'true'){
        e.preventDefault();
        var itemId = $(this).data('mainproductid');
        var basketId = $('#globalBasketId').val();
        var aletrnativeProductId = $(this).data('alterprodid')
        epcotMiniCartjs.methods.removeBasketItem(basketId, itemId, true, aletrnativeProductId);
    }
});

$('.CARBCompliantMessage.CARBButton').on('click', function () {
    if(isCARBEnabled == 'true'){
        $('#CARBShippingStateVal').val($('#shipping_state').val());
    }
});

module.exports = {
    methods: {
        swapSameAsBilling: swapSameAsBilling,
        addressUpdate: addressUpdate,
        validateAddressForm: validateAddressForm,
        checkForSubmit: checkForSubmit,
        modalUpdate: modalUpdate,
        modalInit: modalInit,
        formSubmit: formSubmit
    },

    modalSelect: function () {
        $('input[type=radio][name=bill]').change(function (e) {
            var street = '';
            var street2 = '';
            var city = '';
            var state = '';
            var zip = '';

            if (this.id === 'bill-1') {
                street = $('.billing.original').find('.street').text();
                street2 = $('.billing.original').find('.street2').text();
                city = $('.billing.original').find('.city').val();
                state = $('.billing.original').find('.state').val();
                zip = $('.billing.original').find('.zip').val();
            } else if (this.id === 'bill-2') {
                street = $('.billing.corrected').find('.street').text();
                street2 = $('.billing.corrected').find('.street2').text();
                city = $('.billing.corrected').find('.city').val();
                state = $('.billing.corrected').find('.state').val();
                zip = $('.billing.corrected').find('.zip').val();
            }
            $('#billing_address1').val(street);
            $('#billing_address2').val(street2);
            $('#billing_city').val(city);
            $('#billing_state').val(state);
            $('#billing_postalCode').val(zip);
            e.preventDefault();
        });

        $('input[type=radio][name=ship]').change(function (e) {
            var street = '';
            var street2 = '';
            var city = '';
            var state = '';
            var zip = '';

            if (this.id === 'ship-1') {
                street = $('.shipping.original').find('.street').text();
                street2 = $('.shipping.original').find('.street2').text();
                city = $('.shipping.original').find('.city').val();
                state = $('.shipping.original').find('.state').val();
                zip = $('.shipping.original').find('.zip').val();
            } else if (this.id === 'ship-2') {
                street = $('.shipping.corrected').find('.street').text();
                street2 = $('.shipping.corrected').find('.street2').text();
                city = $('.shipping.corrected').find('.city').val();
                state = $('.shipping.corrected').find('.state').val();
                zip = $('.shipping.corrected').find('.zip').val();
            }
            $('#shipping_address1').val(street);
            $('#shipping_address2').val(street2);
            $('#shipping_city').val(city);
            $('#shipping_state').val(state);
            $('#shipping_postalCode').val(zip);
            e.preventDefault();
        });
    },

    formValidate: function () {
        $('#validate-address-btn').on('click', function (e) {
            if((isCARBEnabled == 'true') && ($('#shipping_state').val() === 'CA') && ($('#CARBItemInCart').val() == 'true')){
                $.spinner().start();
                $('#shipping_state').trigger('change');
            } else {
                e.preventDefault();
                checkForSubmit();
            }
        });
    },

    disableEnterKeyOnBillingShipping: function () {
        $('#addressForm').on('keypress', function (e) {
            return e.which !== 13;
        });
    },

    enableEnterKeySearchForAddress: function () {
        $('#customer-search').on('keypress', function (e) {
            if (e.keyCode === 13) {
                $('.customers-search-msg').find('.error').empty();
                $('#customer-search-modal').find('.list').empty();
                $('.customers-search-msg').find('.loader').show();
                customerSearchSubmit();
            }
        });
    },

    addressSameAS: function () {
        $('#sameAsBilling').change(function () {
            if (this.checked) {
                $.spinner().start();
                swapSameAsBilling();
            } else {
                // document.getElementById('shipping_firstName').value = '';
                // document.getElementById('shipping_lastName').value = '';
                // document.getElementById('shipping_address1').value = '';
                // document.getElementById('shipping_address2').value = '';
                // document.getElementById('shipping_city').value = '';
                // document.getElementById('shipping_state').value = '';
                // document.getElementById('shipping_postalCode').value = '';
                // document.getElementById('shipping_countryCode').value = '';
                // document.getElementById('shipping_phone').value = '';
                if(isCARBEnabled == 'true') {
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
                
            }
        });
    },

    customerSearchClear: function () {
        $('#customer-search-clear-btn').on('click', function (e) {
            e.preventDefault();
            $('#customer-search').trigger('reset');
        });
    },

    customerSearch: function () {
        $('#customer-search-btn').on('click', function (e) {
            e.preventDefault();
            $('.customers-search-msg').find('.error').empty();
            $('#customer-search-modal').find('.list').empty();
            $('.customers-search-msg').find('.loader').show();
            customerSearchSubmit();
        });
    },

    customerSelect: function () {
        $('.customer-info').on('click', 'button', function (e) {
            e.preventDefault();
            $('#billing_firstName').val($(this).parent().find('#bill-firstName').val());
            $('#billing_lastName').val($(this).parent().find('#bill-lastName').val());
            $('#billing_address1').val($(this).parent().find('#bill-address1').val());
            $('#billing_address2').val($(this).parent().find('#bill-address2').val());
            $('#billing_city').val($(this).parent().find('#bill-city').val());
            $('#billing_state').val($(this).parent().find('#bill-state').val());
            $('#billing_postalCode').val($(this).parent().find('#bill-zipCode').val());
            $('#billing_phone').val($(this).parent().find('#bill-phone').val());
            $('#billing_email').val($(this).parent().find('#bill-email').val());

            // 2022/03/13 jmiyamoto - per business requirement, don't copy the shipping address from address validation
            // $('#shipping_firstName').val($(this).parent().find('#ship-firstName').val());
            // $('#shipping_lastName').val($(this).parent().find('#ship-lastName').val());
            // $('#shipping_address1').val($(this).parent().find('#ship-address1').val());
            // $('#shipping_address2').val($(this).parent().find('#ship-address2').val());
            // $('#shipping_city').val($(this).parent().find('#ship-city').val());
            // $('#shipping_state').val($(this).parent().find('#ship-state').val());
            // $('#shipping_postalCode').val($(this).parent().find('#ship-zipCode').val());
            // $('#shipping_phone').val($(this).parent().find('#ship-phone').val());

            $('#customer-search-modal').modal('hide');
        });
    },
    noEmailClicked: function () {
        $('#noEmailButton').on('click', function () {
            console.log('no email address');
            document.getElementById('billing_email').value = 'no_email@mtdproducts.com';
        });
    }
};
