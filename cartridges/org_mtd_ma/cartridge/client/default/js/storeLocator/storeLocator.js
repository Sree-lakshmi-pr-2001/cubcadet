/* globals google */
'use strict';
var base = require('org/storeLocator/storeLocator');
var deviceDetect = require('../components/devicedetect');

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

/**
 * Uses google maps api to render a map
 */
function maps() {
    var map;
    var infowindow = new google.maps.InfoWindow();

    // Init U.S. Map in the center of the viewport
    var latlng = new google.maps.LatLng(37.09024, -95.712891);
    var mapOptions = {
        scrollwheel: false,
        zoom: 4,
        center: latlng
    };

    map = new google.maps.Map($('.map-canvas')[0], mapOptions);
    var mapdiv = $('.map-canvas').attr('data-locations');

    mapdiv = JSON.parse(mapdiv);

    var bounds = new google.maps.LatLngBounds();


    var markerImgRetail = $('.map-canvas').attr('data-retail-marker');
    var markerImgDealer = $('.map-canvas').attr('data-dealer-marker');
    var markerImgElite = $('.map-canvas').attr('data-elite-marker');

    Object.keys(mapdiv).forEach(function (key) {
        var item = mapdiv[key];
        var label = parseInt(key, 10) + 1;
        var storeLocation = new google.maps.LatLng(item.latitude, item.longitude);
        var dealerOrElite = item.isElite ? markerImgElite : markerImgDealer;
        var marker = new google.maps.Marker({
            position: storeLocation,
            map: map,
            title: item.name,
            icon: {
                url: item.isDealer ? dealerOrElite : markerImgRetail,
                scaledSize: new google.maps.Size(34, 34),
                size: {
                    width: 34,
                    height: 54
                },
                labelOrigin: {
                    x: 17,
                    y: 11
                }
            },
            label: {
                text: label.toString(),
                color: 'black',
                fontSize: '10px',
                fontFamily: '"Aaux Pro", "Arial", sans-serif',
                fontWeight: '700'
            }
        });

        marker.addListener('click', function () {
            infowindow.setOptions({
                content: item.infoWindowHtml
            });
            infowindow.open(map, marker);
        });

        // Create a minimum bound based on a set of storeLocations
        bounds.extend(marker.position);
    });

    // Disables Phone Link for IE11 in info window
    google.maps.event.addListener(infowindow, 'domready', function () {
        deviceDetect.disableIEPhoneNumber();
    });

    // Fit the all the store marks in the center of a minimum bounds when any store has been found.
    if (mapdiv && mapdiv.length !== 0) {
        map.fitBounds(bounds);
    }
}

/**
 * Renders the results of the search and updates the map
 * @param {Object} data - Response from the server
 */
function updateStoresResults(data) {
    var $resultsDiv = $('.results');
    var $mapDiv = $('.map-canvas');
    var hasResults = data.stores.length > 0;

    if (!hasResults) {
        $('.store-locator-no-results').show();
        $('.results-message').hide();
    } else {
        $('.store-locator-no-results').hide();
        var resultsMsg = $('.results-message');
        resultsMsg.find('.count').text(data.stores.length);
        resultsMsg.find('.distance').text($('.radius').val());
        resultsMsg.show();
    }

    $resultsDiv.empty()
        .data('has-results', hasResults)
        .data('radius', data.radius)
        .data('search-key', data.searchKey);

    $mapDiv.attr('data-locations', data.locations);

    if ($mapDiv.data('has-google-api')) {
        maps();
    } else {
        $('.store-locator-no-apiKey').show();
    }

    if (data.storesResultsHtml) {
        $resultsDiv.append(data.storesResultsHtml);
        deviceDetect.disableIEPhoneNumber();
    }
}

/**
 * Retrieve Product Filters
 * @returns {array} - filter array
 */
function getProductFilters() {
    var filters = {
        productFrom: '',
        productType: ''
    };

    if ($('.store-locator-container .product-from-list').length) {
        filters.productFrom = $('.store-locator-container .product-from-list').find('.custom-control-input:checked').val();
    } else if ($('#productFrom').length) {
        filters.productFrom = $('#productFrom').val();
    }

    if ($('.store-locator-container .product-type-list').length) {
        filters.productType = $('.store-locator-container .product-type-list').find('.custom-control-input:checked').val();
    } else if ($('[name="store-filter"]:checked').length) {
        var types = [];
        $('[name="store-filter"]:checked').each(function () {
            types.push($(this).val());
        });
        filters.productType = types.join(',');
    } else if ($('#productType').length) {
        filters.productType = $('#productType').val();
    }

    return filters;
}

/**
 * Search for stores with new zip code
 * @param {HTMLElement} element - the target html element
 * @returns {boolean} false to prevent default event
 */
function search(element) {
    $.spinner().start();
    var $form = element.closest('.store-locator');
    var radius = $('.results').data('radius');
    var currentURL = window.location.href;
    var url = $form.attr('action');
    var urlParams = !$form.is('form') ? { radius: radius } : {};
    var filters = getProductFilters();

    // Clear Form errors
    $form.find('.form-control.is-invalid').removeClass('is-invalid');
    $form.find('label.text-danger').removeClass('text-danger');

    var currentSite = '';
    if(document.getElementById('currentSiteId').value == null){
        currentSite ='';
    } else{
        currentSite = document.getElementById('currentSiteId').value;
    }
   
    if ($form.hasClass('use-geolocation')) {
        var params = {
            radius: $('#radius').val(),
            lat: $form.data('lat'),
            long: $form.data('long')
        };

        // Check if any filters has info
        if (filters.productType && filters.productType !== '') {
            params.pc = filters.productType;
        }
        if (filters.productFrom && filters.productFrom !== '') {
            params.rid = filters.productFrom;
        }
       
        url = appendToUrl(url, params);
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                $.spinner().stop();
                if((filters.productFrom ==='cubcare' || filters.productFrom === 'dealers') && currentSite==='cubcadet' && filters.productType==='UTV '){
                    window.location.href = 'utilityVehicleServiceLocator';
                } else {
                    updateStoresResults(data);
                    $('.select-store').prop('disabled', true);
                    // loading the title and description in the modal
                    var $shopChangeModalTitle = $('.store-locator-container .results .shop-dealer-change .modal-header').find('.modal-title');
                    var modalContentTitle = $('.store-locator-container').find('.store-locator-change-shop-msg-title').text();
                    $shopChangeModalTitle.text(modalContentTitle);
                    var $shopChangeModalBody = $('.store-locator-container .results .shop-dealer-change').find('.modal-body');
                    var modalContentDescription = $('.store-locator-container').find('.store-locator-change-shop-msg-description').text();
                    $shopChangeModalBody.text(modalContentDescription);
                }                
            }
        });

        return false;
    }

    if (!$form.get(0).checkValidity()) {
        $form.find('input').trigger('invalid', false);
        $.spinner().stop();
        return false;
    }

    var dataObj = {
        address: $.trim($form.find('[name="address"]').val().replace(/\s/g, ''))
    };

    var payload = $form.is('form') ? $form.serialize() : { postalCode: $form.find('[name="postalCode"]').val() };

    // Check if any filters has info
    if (filters.productType && filters.productType !== '') {
        urlParams.pc = filters.productType;
    }
    if (filters.productFrom && filters.productFrom !== '') {
        urlParams.rid = filters.productFrom;
    }
    url = appendToUrl(url, urlParams);

    // Hide geo coding error message
    $('.geocoding-error').addClass('hidden');   
    // Get Geo Coding data from Google
    var geoCodingUrl = $('.store-locator-container').data('geocodingUrl');
    $.ajax({
        url: geoCodingUrl,
        type: 'GET',
        data: dataObj,
        dataType: 'json',
        success: function (geoData) {

            if((filters.productFrom ==='cubcare' || filters.productFrom=== 'dealers') && currentSite==='cubcadet' && filters.productType==='UTV '){
                window.location.href = 'utilityVehicleServiceLocator';
            } else {
            if (geoData.status === 'OK') {
                var lat = geoData.results[0].geometry.location.lat;
                var long = geoData.results[0].geometry.location.lng;
                if ($form.hasClass('service-locator-form')) {
                    urlParams.showMap = true;
                    urlParams.isServiceLocator = true;
                    urlParams.radius = $('#radius').val();
                    urlParams.lat = lat;
                    urlParams.long = long;
                    window.location.href = appendToUrl(currentURL, urlParams);
                } else {
                    $.ajax({
                        url: url,
                        type: $form.attr('method'),
                        data: payload + '&lat=' + lat + '&long=' + long,
                        dataType: 'json',
                        success: function (data) {
                            $.spinner().stop();
                            updateStoresResults(data);
                            $('.select-store').prop('disabled', true);
                            // loading the title and description in the modal
                            var $shopChangeModalTitle = $('.store-locator-container .results .shop-dealer-change .modal-header').find('.modal-title');
                            var modalContentTitle = $('.store-locator-container').find('.store-locator-change-shop-msg-title').text();
                            $shopChangeModalTitle.text(modalContentTitle);
                            var $shopChangeModalBody = $('.store-locator-container .results .shop-dealer-change').find('.modal-body');
                            var modalContentDescription = $('.store-locator-container').find('.store-locator-change-shop-msg-description').text();
                            $shopChangeModalBody.text(modalContentDescription);
                        },
                        error: function (data) {
                            $.spinner().stop();
                            alert('An error occurred.\n' + data.responseText);
                        }
                    });
                }
            } else {
                $.spinner().stop();
                // Show error message
                $('.geocoding-error').removeClass('hidden');
            }
        }
        },
        error: function (data) {
            $.spinner().stop();
            alert('An error occurred.\n' + data.responseText);
        }
    });

    return false;
}

var exportBase = $.extend({}, base, {
    // need all functions to hit local maps() with custom markers
    init: function () {
        if ($('.map-canvas').data('has-google-api')) {
            maps();
        } else {
            $('.store-locator-no-apiKey').show();
        }

        if (!$('.results').data('has-results')) {
            $('.store-locator-no-results').show();
        }
    },

    detectLocation: function () {
        // clicking on detect location.
        $('.detect-location').on('click', function () {
            $.spinner().start();
            if (!navigator.geolocation) {
                $.spinner().stop();
                return;
            }
            var locationOptions = {};
            // IE11 detection
            if (!!window.MSInputMethodContext && !!document.documentMode) {
                locationOptions = {
                    enableHighAccuracy: false
                };
            }

            navigator.geolocation.getCurrentPosition(function (position) {
                var $detectLocationButton = $('.detect-location');
                var url = $detectLocationButton.data('action');
                var radius = $('#radius').val();
                var urlParams = {
                    radius: radius,
                    lat: position.coords.latitude,
                    long: position.coords.longitude
                };

                var $form = $('.store-locator');
                // Clear Form errors
                $form.find('.form-control.is-invalid').removeClass('is-invalid');
                $form.find('label.text-danger').removeClass('text-danger');

                // Mark form to use geoloocation search, until a zip code is used
                $form.addClass('use-geolocation');
                $form.data('lat', position.coords.latitude);
                $form.data('long', position.coords.longitude);

                var filters = getProductFilters();
                // Check if any filters has info
                if (filters.productType && filters.productType !== '') {
                    urlParams.pc = filters.productType;
                }
                if (filters.productFrom && filters.productFrom !== '') {
                    urlParams.rid = filters.productFrom;
                }
                var currentSite = '';
                if(document.getElementById('currentSiteId').value == null){
                    currentSite ='';
                } else{
                    currentSite = document.getElementById('currentSiteId').value;
                }
                url = appendToUrl(url, urlParams);
                $.ajax({
                    url: url,
                    type: 'get',
                    dataType: 'json',
                    success: function (data) {
                        $.spinner().stop();
                        if((filters.productFrom ==='cubcare' || filters.productFrom=== 'dealers') && currentSite==='cubcadet' && filters.productType==='UTV '){
                            window.location.href = 'utilityVehicleServiceLocator';
                        } else {                      
                            updateStoresResults(data);
                            $('.select-store').prop('disabled', true);
                        }
                    }
                });
            }, function error(err) {
                console.warn(err.code + ': ' + err.message);
                $.spinner().stop();
            }, locationOptions);
        });
    },

    search: function () {
        $('.store-locator-container form.store-locator').submit(function (e) {
            e.preventDefault();
            $('.store-locator').removeClass('use-geolocation');
            search($(this));
        });
        $('.store-locator-container .btn-storelocator-search[type="button"]').click(function (e) {
            e.preventDefault();
            search($(this));
        });
        $('[name="store-filter"]').change(function () {
            search($('.store-locator-container form.store-locator'));
        });
        // $('.dealer-locator [name="address"]').change(function () {
        //     $('.store-locator').removeClass('use-geolocation');
        //     search($('.store-locator-container form.store-locator'));
        // });
        $('.sl-form input, .sl-form select').keypress(function (e) {
            var key = e.which;
            if (key === 13) {
                $('.btn-storelocator-search').click();
            }
        });
    },

    changeRadius: function () {
        $('.dealer-locator .store-locator-container .radius').change(function () {
            var radius = $(this).val();
            var searchKeys = $('.results').data('search-key');
            var url = $('.radius').data('action-url');
            var productFrom = $('.store-locator-container .productFrom').length ? $('.store-locator-container .productFrom').val() : '';
            var productType = '';
            if ($('.store-locator-container .productType').length) {
                productType = $('.store-locator-container .productType').val();
            } else if ($('[name="store-filter"]').length) {
                var productTypefilters = [];
                $('[name="store-filter"]').each(function () {
                    if ($(this).is(':checked')) {
                        productTypefilters.push($(this).val());
                    }
                });
                if (productTypefilters.length > 0) {
                    productType = productTypefilters.join(',');
                }
            }
            var urlParams = {};

            if (searchKeys.postalCode) {
                urlParams = {
                    radius: radius,
                    postalCode: searchKeys.postalCode,
                    rid: productFrom,
                    pc: productType
                };
            } else if (searchKeys.lat && searchKeys.long) {
                urlParams = {
                    radius: radius,
                    lat: searchKeys.lat,
                    long: searchKeys.long,
                    rid: productFrom,
                    pc: productType
                };
            }

            url = appendToUrl(url, urlParams);
            $.spinner().start();
            $.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                success: function (data) {
                    $.spinner().stop();
                    updateStoresResults(data);
                    $('.select-store').prop('disabled', true);
                }
            });
        });
    }
});

module.exports = exportBase;
