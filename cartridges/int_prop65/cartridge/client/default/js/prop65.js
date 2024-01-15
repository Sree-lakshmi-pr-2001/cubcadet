'use strict';

module.exports = {
    showMessage: function (data) {
        var urlAccept = data.acceptUrl;
        var $prop65Content = $('.prop65-checkout-message');
        var $placeOrderBtn = $('button.place-order');
        var $prop65Checkbox = $('#acknowledgeProp65');

        $prop65Content.show();
        if (!$prop65Checkbox.is(':checked')) {
            $placeOrderBtn.attr('disabled', 'disabled');
        }

        $prop65Checkbox.change(function () {
            var accepted = $(this).is(':checked') ? 1 : 0;

            $.ajax({
                url: urlAccept,
                type: 'get',
                dataType: 'json',
                data: { accepted: accepted },
                success: function (response) {
                    if (response.success) {
                        if (accepted === 1) {
                            $placeOrderBtn.removeAttr('disabled');
                        } else {
                            $placeOrderBtn.attr('disabled', 'disabled');
                        }
                    }
                },
                error: function () {
                }
            });
        });
    },

    hideMessage: function () {
        var $prop65Content = $('.prop65-checkout-message');
        var $placeOrderBtn = $('button.place-order');

        if ($prop65Content.length > 0) {
            $prop65Content.hide();
            $placeOrderBtn.removeAttr('disabled', 'disabled');
        }
    }
};
