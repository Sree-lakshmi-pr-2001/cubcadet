'use strict';

/* global $ */

/**
 * showHowToFind
 * @param {function} callback - callback function
 */
function showHowToFind() {
    $('.showHowToFind').on('click', function () {
        $('#moreSerialInfo').toggle();
        if($('#moreSerialInfo').hasClass('hide')) {
            $('#moreSerialInfo').removeClass('hide');
        } else {
            $('#moreSerialInfo').addClass('hide');
        }
    });

    $('.hideHowToFind').on('click', function (){
        $('#moreSerialInfo').hide().addClass('hide');
    });
}

/**
 * confirmMyProduct
 * @param {function} callback - callback function
 */
function confirmMyProduct() {
    // Add Warranty to cart
    $('#confirmMyProduct').on('click', function (event) {
        event.preventDefault();
        var $this = $(this);
        var confirmMyProductURL = $('#confirmMyProduct').attr('data-url');
        var form = $('#confirmProductForm');
        $.ajax({
            url: confirmMyProductURL,
            type: 'post',
            data: form.serialize(),
            dataType: 'html',
            success: function (data) {
                if (data && !data.error) {
                    var enterSerialNumber = $('#enterSerialNumberModal');
                    var eventType = $this.attr('data-event-type');
                    var eventTypeValue = eventType || '';
                    $('.modal-body').html(data);
                    enterSerialNumber.attr('data-event-type', eventTypeValue);
                    // addWarrantyToCart();
                    $('#enterSerialNumberModal').spinner().stop();
                } else {
                    window.console.error('Zipcode was not get');
                    $('#enterSerialNumberModal').spinner().stop();
                }
            },
            error: function () {
                $('#enterSerialNumberModal').spinner().stop();
            }
        }).fail(function () {
            $('#enterSerialNumberModal').spinner().stop();
        });
    });
}

/**
 * notMyProduct
 * @param {function} callback - callback function
 */
function sendMySerialNumber() {
    // Add Warranty to cart
    $('#notMyProduct').on('click', function (event) {
        event.preventDefault();
        var $this = $(this);
        var enterSerialNumberURL = $('#notMyProduct').attr('data-url');

        $.ajax({
            url: enterSerialNumberURL,
            type: 'get',
            dataType: 'html',
            success: function (data) {
                if (data && !data.error) {
                    var enterSerialNumber = $('#enterSerialNumberModal');
                    var eventType = $this.attr('data-event-type');
                    var eventTypeValue = eventType || '';
                    $('#enterSerialNumberModal .modal-content').html($(data).find('.modal-content').html());
                    enterSerialNumber.attr('data-event-type', eventTypeValue);
                    // submitSerialNumber2();

                    $('#enterSerialNumberModal').spinner().stop();
                } else {
                    window.console.error('Zipcode was not get');
                    $('#enterSerialNumberModal').spinner().stop();
                }
            },
            error: function () {
                $('#enterSerialNumberModal').spinner().stop();
            }
        }).fail(function () {
            $('#enterSerialNumberModal').spinner().stop();
        });
    });
}

/**
 * submitSerialNumber
 * @param {function} callback - callback function
 */
function submitSerialNumber() {
    // Add Warranty to cart
    $('#submitSerialNumber').submit(function (event) {
        event.preventDefault();
        var $this = $(this);
        var enterSerialNumberURL = $('#submitSerialNumber').attr('action');

        $.ajax({
            url: enterSerialNumberURL,
            type: 'post',
            dataType: 'html',
            data: $(this).serialize(),
            success: function (data) {
                if (data && !data.error) {
                    var enterSerialNumber = $('#enterSerialNumberModal');
                    var eventType = $this.attr('data-event-type');
                    var eventTypeValue = eventType || '';
                    $('.modal-body').html(data);
                    $('#enterSerialNumberModal').modal('show');
                    // confirmMyProduct();
                    // sendMySerialNumber();
                    enterSerialNumber.attr('data-event-type', eventTypeValue);

                    $('#enterSerialNumberModal').spinner().stop();
                } else {
                    window.console.error('Zipcode was not get');
                    $('#enterSerialNumberModal').spinner().stop();
                }
            },
            error: function () {
                $('#enterSerialNumberModal').spinner().stop();
            }
        }).fail(function () {
            $('#enterSerialNumberModal').spinner().stop();
        });
    });
}

module.exports = {
    // Load the aftermarket dialog widget
    modalInit: function () {
        $(document).on('click', '#enterSerialNumber', function (e) {
            e.preventDefault();
            var $this = $(this);
            var deliveryZipcodeUrl = $('#enterSerialNumberModal').attr('action-get-delivery-zipcode');
            $('#enterSerialNumberModal').spinner().start();
            $.ajax({
                url: deliveryZipcodeUrl,
                type: 'get',
                dataType: 'html',
                global: false,
                success: function (data) {
                    if (data && !data.error) {
                        var enterSerialNumber = $('#enterSerialNumberModal');
                        var eventType = $this.attr('data-event-type');
                        var eventTypeValue = eventType || '';

                        enterSerialNumber.attr('data-event-type', eventTypeValue);
                        $('#enterSerialNumberModal .modal-content').html($(data).find('.modal-content').html());
                        $('#enterSerialNumberModal').modal('show');
                        submitSerialNumber();
                        $('#enterSerialNumberModal').spinner().stop();
                        $('#moreSerialInfo').hide();
                        showHowToFind();
                    } else {
                        window.console.error('Zipcode was not get');
                        $('#enterSerialNumberModal').spinner().stop();
                    }
                },
                error: function () {
                    $('#enterSerialNumberModal').spinner().stop();
                }
            }).fail(function () {
                $('#enterSerialNumberModal').spinner().stop();
            });
        });
    }
};

$(document).ajaxComplete(function () {
    submitSerialNumber();
    confirmMyProduct();
    sendMySerialNumber();
    $('#moreSerialInfo').hide();
    showHowToFind();
});
