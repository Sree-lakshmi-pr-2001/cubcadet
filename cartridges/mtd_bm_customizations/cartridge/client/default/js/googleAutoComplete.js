/* eslint-disable */

var autocomplete;
var autocomplete1;
var isCARBEnabled = document.getElementById('isCARBEnabled').value;
function autoFillAddress(address, form, formtype) {
    if (!formtype) return;
    $('input[name=' + formtype + '_address1]', form).val(
        address.Address1 + ' ' + address.Address2
    );
    $('input[name=' + formtype + '_address2]', form).val('');
    $('input[name=' + formtype + '_city]', form).val(address.City);
    $('input[name=' + formtype + '_postalCode]', form).val(address.ZipCode);
    $('select[name=' + formtype + '_state],input[name=' + formtype + '_state]', form).val(
        address.State
    );
    $('#billing_address1').removeClass('billing-form-filled');
    $('#shipping_address1').removeClass('shipping-form-filled');

    if(formtype == 'shipping' &&  address.State) {
        if(isCARBEnabled == 'true'){
            var state = $('#shipping_state').val();
            var basketId = $('#globalBasketId').val();
            $('.CARBSuggestion').remove();
            if (state === 'CA') {
                $spinner().start();
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
            } else if(state !== 'CA') {
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
    }
}

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
            for(var k = 0; k < productHit.length; k++ ){
                if(productHit[k].id == productId){
                    var mainProd = productHit[k]
                    var carbSection
                    if(mainProd.c_CARBCompliantItem){
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
                                                var suggestionProdName2 = suggestionProdHit[l].name.default ?suggestionProdHit[l].name.default : '';
                                                suggestionProData = '<div id="'+ suggestionProdHit[l].id+' "class="removeCARBProduct" data-mainproductid="'+ removeProductId +'" '+
                                                ' data-mainproductname=" '+ mainProd.name.default + '" data-mainproductaction="'+ removeProductId + '" data-alterprodid= " '+ suggestionProdHit[l].id + '"> <img src="' + suggestionProdHit[l].image.abs_url + '" alt="' + suggestionProdHit[l].name.default + '" class="suggestion-img"><br>' +
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
            $spinner().stop();
        },
        error: function () {
            console.log('product search error');
        }
    })
}

var componentForm = {
    street_number: 'short_name',
    route: 'long_name',
    locality: 'long_name',
    administrative_area_level_1: 'short_name',
    country: 'long_name',
    postal_code: 'short_name'
};

function geolocate() {
    var google;
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var geolocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            var circle = new google.maps.Circle({
                center: geolocation,
                radius: position.coords.accuracy
            });
            autocomplete.setBounds(circle.getBounds());
            autocomplete1.setBounds(circle.getBounds());
        });
    }
}


function fillInAddress() {
    var place = autocomplete.getPlace();
    var place1 = autocomplete1.getPlace();
    var address = {
        Address1: '',
        Address2: '',
        City: '',
        State: '',
        Country: '',
        ZipCode: ''
    };
    var address1 = {
        Address1: '',
        Address2: '',
        City: '',
        State: '',
        Country: '',
        ZipCode: ''
    };

    // Get each component of the address from the place details
    // and fill the corresponding field on the form.
    var googleValidationCountry = $('input[name=googleAutofillCountry]').val();
    if (place && place.address_components) {
        for (var i = 0; i < place.address_components.length; i++) {
            var addressType = place.address_components[i].types[0];
            var val = place.address_components[i][componentForm[addressType]];
            switch (addressType) {
                case 'street_number':
                    address.Address1 = val;
                    break;
                case 'route':
                    address.Address2 = val;
                    break;
                case 'locality':
                    address.City = val;
                    break;
                case 'country':
                    if (googleValidationCountry === 'us') {
                        val =
                            val === 'USA' || val === 'United States'
                                ? 'US'
                                : val;
                    } else {
                        val = val === 'CA' || val === 'CANADA' ? 'CA' : val;
                    }

                    address.Country = val;
                    break;
                case 'administrative_area_level_1':
                    address.State = val;
                    break;
                case 'postal_code':
                    address.ZipCode = val;
                    break;
            }
        }
    }
    if (place1 && place1.address_components) {
        for (var i = 0; i < place1.address_components.length; i++) {
            var addressType = place1.address_components[i].types[0];
            var val = place1.address_components[i][componentForm[addressType]];
            switch (addressType) {
                case 'street_number':
                    address1.Address1 = val;
                    break;
                case 'route':
                    address1.Address2 = val;
                    break;
                case 'locality':
                    address1.City = val;
                    break;
                case 'country':
                    if (googleValidationCountry === 'us') {
                        val = val === 'USA' || val === 'United States' ? 'US' : val;
                    } else {
                        val = val === 'CA' || val === 'CANADA' ? 'CA' : val;
                    }
                    address1.Country = val;
                    break;
                case 'administrative_area_level_1':
                    address1.State = val;
                    break;
                case 'postal_code':
                    address1.ZipCode = val;
                    break;
            }
        }
    }

    if ($('#billing_address1.billing-form-filled').length > 0) {
        var form = $('.billing').closest('form');
        autoFillAddress(address, form, 'billing');
    }

    if ($('#shipping_address1.shipping-form-filled').length > 0) {
        var form1 = $('.shipping').closest('form');
        autoFillAddress(address1, form1, 'shipping');
    }
}

function initAutocomplete() {
    autocomplete = new google.maps.places.Autocomplete(
        document.getElementById('billing_address1'),
        {
            types: ['geocode']
        }
    );

    autocomplete1 = new google.maps.places.Autocomplete(
        document.getElementById('shipping_address1'),
        {
            types: ['geocode']
        }
    );

    $('#billing_address1').bind('change click select', function () {
        $('#billing_address1').addClass('billing-form-filled');
    });

    $('#shipping_address1').bind('change click select', function () {
        $('#billing_address1').removeClass('billing-form-filled');
        $('#shipping_address1').addClass('shipping-form-filled');
    });

    var googleValidationCountry = $('input[name]').val();

    autocomplete.setComponentRestrictions({
        country: [googleValidationCountry]
    });
    autocomplete1.setComponentRestrictions({
        country: [googleValidationCountry]
    });
    autocomplete.setFields(['address_component']);
    autocomplete.addListener('place_changed', fillInAddress);
    autocomplete1.setFields(['address_component']);
    autocomplete1.addListener('place_changed', fillInAddress);
}

window.initAutocomplete = initAutocomplete;

