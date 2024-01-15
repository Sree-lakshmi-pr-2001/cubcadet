'use strict';

/**
 * Function to update dealer information
 * @param {string} dealer - dealer info
 */
function loadDealer(dealer) {
    var dealerWebsite = 'window.location.href="' + dealer.custom.dealerWebsiteUrl + '";';

    $('#dealerMsg').text('Your Featured Local Dealer:');
    $('#dealerName').text(dealer.name);
    $('#dealerPhone').text(dealer.phone).attr('href', 'tel:=+' + dealer.phone.replace(/\D/g, ''));
    $('#address1').text(dealer.address1);
    $('#address2').text(dealer.city + ' ' + dealer.stateCode + ' ' + dealer.postalCode);
    $('#dealerWebsite').attr('onclick', dealerWebsite);
}

/**
 * Function to fire ajax request
 * @param {string} position - position
 */
function getFeaturedDealer(position) {
    var featureURL = $('#featuredDealer').data('url');
    var dealerurl = featureURL + '?lat=' + position.coords.latitude + '&long=' + position.coords.longitude;

    $.ajax({
        url: dealerurl,
        success: function (featuredDealer) {
            loadDealer(featuredDealer);
        }
    });
}

module.exports = {
    init: function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(getFeaturedDealer);
        } else {
            var featuredDealer = jQuery.parseJSON($('#featuredDealer').data('featured-dealer').text());
            var alertMessage = $('#featuredDealer').data('alert-msg');

            alert(alertMessage);
            loadDealer(featuredDealer);
        }
    }
};
