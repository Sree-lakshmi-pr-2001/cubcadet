'use strict';

var isUpdating = false;

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

module.exports = {
    modalInit: function () {
        $('form.zipcode-change').submit(function (e) {
            e.preventDefault();
            if (!isUpdating) {
                isUpdating = true;
                var url = $(this).attr('action');

                var zipcodeValue = $('#zipcode-postal-code').val();
                if (url.includes('en_CA') || url.includes('fr_CA')) {
                    // Converting the zipCode into uppercase irrespective of anycase.
                    zipcodeValue = zipcodeValue.toUpperCase();

                    // Removing dash from zip code
                    zipcodeValue = zipcodeValue.replace('-', ' ');

                    // For Canada Locale adding space if it is not there in the format(XXX XXX).
                    if (zipcodeValue.charAt(3) !== ' ') {
                        zipcodeValue = zipcodeValue.replace(/.{1,2}(?=(.{3})+$)/g, '$& ');
                    }
                }

                var params = {
                    deliveryZipCode: zipcodeValue
                };
                url = appendToUrl(url, params);

                $('#deliveryZipcodeChangeModal').spinner().start();
                $.ajax({
                    url: url,
                    type: 'post',
                    dataType: 'json',
                    success: function (data) {
                        if (data && !data.error) {
                            window.location.reload();
                        } else {
                            window.console.error('Zipcode was not saved');
                            $.spinner().stop();
                        }
                        isUpdating = false;
                    },
                    error: function () {
                        $.spinner().stop();
                        isUpdating = false;
                    }
                }).fail(function () {
                    $.spinner().stop();
                    isUpdating = false;
                });
            }
        });
        $('#zipcode-postal-code').change(function (e) {
            e.preventDefault();
            // $('#zipcodeChangeSave').click();
        });
        $('#zipcode-postal-code').keypress(function (e) {
            var key = e.which;
            if (key === 13) {
                $('#zipcodeChangeSave').click();
            }
        });

        $('#deliveryZipcodeChangeModal').on('hide.bs.modal', function (e) {
            // Don't allow to hide modal while updating is in progress
            if (isUpdating) {
                e.preventDefault();
            }
        });

        $('#zipcodeChangeCancel').click(function (e) {
            e.preventDefault();
        });

        $('button[data-target="#deliveryZipcodeChangeModal"]:visible').click(function (e) {
            e.preventDefault();
            $('#deliveryZipcodeChangeModal .zipcode-postal-code-input').val('');
            var deliveryZipcodeUrl = $('#deliveryZipcodeChangeModal').attr('action-get-delivery-zipcode');

            $('#deliveryZipcodeChangeModal').spinner().start();
            $.ajax({
                url: deliveryZipcodeUrl,
                type: 'get',
                dataType: 'json',
                success: function (data) {
                    if (data && !data.error) {
                        $('#deliveryZipcodeChangeModal .zipcode-postal-code-input').val(data.deliveryZipCode);
                        $.spinner().stop();
                    } else {
                        window.console.error('Zipcode was not get');
                        $.spinner().stop();
                    }
                },
                error: function () {
                    $.spinner().stop();
                }
            }).fail(function () {
                $.spinner().stop();
            });
        });
    }
};
