var autocomplete, autocomplete1; 

function autoFillAddress(address, form) {
    if (!form) return; 
    var countryCode = address.countryCode;
    var isShippingForm = false;
    var firstName =  $('input[name$=_firstName]', form).val();
    var lastName =  $('input[name$=_lastName]', form).val();
    $('input[name$=_address1]', form).val(address.Address1 + ' ' + address.Address2); 
    $('input[name$=_address2]', form).val(''); 
    $('input[name$=_city]', form).val(address.City); 
    $('input[name$=_postalCode]', form).val(address.ZipCode); 
    $('select[name$=_stateCode],input[name$=_stateCode]', form).val(address.State);

    for(var i = 0; i < form.length; i++){
        if(form[i].className == 'shipping-form'){
            isShippingForm = true;
        }
    }
    if($('#dwfrm_shipping.shipping-form.ishippingform-filled').length == 0){
        if(isShippingForm){
            $('select[name$="shippingAddress_addressFields_states_stateCode"]').trigger('change');
            $('input[name$=_firstName]', form).val(firstName);
            $('input[name$=_lastName]', form).val(lastName);
        } 
    }
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
 
  function initAutocomplete() { 
    var form = $('.shipping-checkout-field').closest('form'); 
    var address = $('input[name$=_address1]', form);

    autocomplete = new google.maps.places.Autocomplete(
        (document.getElementById($(address).attr('id'))), 
        {types: ['geocode'] 
    });

    var form1 = $('.billing-checkout-field').closest('form'); 
    var address1 = $('input[name$=_address1]', form1);

    autocomplete1 = new google.maps.places.Autocomplete(
        (document.getElementById($(address1).attr('id'))), 
        {types: ['geocode'] 
    });

    var googleValidationCountry = $('input[name]').val();
   
    autocomplete.setComponentRestrictions({ 
        'country': [googleValidationCountry] 
    }); 
    autocomplete1.setComponentRestrictions({ 
        'country': [googleValidationCountry] 
    }); 
    autocomplete.setFields(['address_component']); 
    autocomplete.addListener('place_changed', fillInAddress);
    autocomplete1.setFields(['address_component']); 
    autocomplete1.addListener('place_changed', fillInAddress);
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
    var googleValidationCountry = $('input[name]').val();
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
                if(googleValidationCountry == 'us'){
                    val = val === 'USA' || val === 'United States' ? 'US' : val; 
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
                    if(googleValidationCountry == 'us'){
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
    var form = $('.shipping-checkout-field').closest('form'); 
    autoFillAddress(address, form); 
    var form1 = $('.billing-checkout-field').closest('form'); 
    autoFillAddress(address1, form1); 
 }
 
 window.initAutocomplete = initAutocomplete;