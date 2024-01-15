'use strict';

/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 */
function handlePostCartAdd(response) {
    $('.minicart').trigger('count:update', response);
    var messageType = response.error ? 'alert-danger' : 'alert-success';

    if ($('.add-to-cart-messages').length === 0) {
        $('body').append(
        '<div class="add-to-cart-messages"></div>'
        );
    }

    $('.add-to-cart-messages').append(
        '<div class="alert ' + messageType + ' add-to-basket-alert text-center" role="alert">'
        + response.message
        + '</div>'
    );

    setTimeout(function () {
        $('.add-to-basket-alert').remove();
    }, 5000);
}

module.exports = {
    addToCart: function () {
        $('#ari-container').on('ari:addToCart', function (e, params) {
            var data = {};
            params.split('&').forEach(function (i) {
                var token = i.split('=');
                data[token[0]] = decodeURIComponent(token[1]);
            });

            var addToCartUrl = $(this).attr('data-add-to-cart-url');
            var form = {
                pid: data.arisku,
                quantity: data.ariqty,
                ari: 1
            };

            $.spinner().start();

            $.ajax({
                url: addToCartUrl,
                method: 'POST',
                data: form,
                success: function (response) {
                    handlePostCartAdd(response);
                    $.spinner().stop();
                },
                error: function (response) {
                    handlePostCartAdd(response.responseJSON);
                    $.spinner().stop();
                }
            });
        });
    }
};
