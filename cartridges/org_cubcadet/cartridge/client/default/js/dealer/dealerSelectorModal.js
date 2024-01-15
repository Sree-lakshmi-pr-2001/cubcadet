'use strict';

module.exports = {
    modalInit: function () {
        $(document).on('click', 'button[data-target="#dealerSelectorModal"]', function (e) {
            e.preventDefault();

            var $this = $(this);
            $('#dealerSelectorModal .store-postal-code-input').val('');

            // get delivery zipcode from the server
            var deliveryZipcodeUrl = $('#dealerSelectorModal').attr('action-get-delivery-zipcode');
            $.spinner().start();
            $.ajax({
                url: deliveryZipcodeUrl,
                type: 'get',
                dataType: 'json',
                success: function (data) {
                    if (data && !data.error) {
                        $('#dealerSelectorModal .store-postal-code-input').val(data.deliveryZipCode);

                        var dealerSelectorModal = $('#dealerSelectorModal');
                        var eventType = $this.attr('data-event-type');
                        var eventTypeValue = eventType || '';
                        var shippingMethod = '';
                        var selectedShippingMethod = '';

                        // update modal with productId and quantity on PLP
                        var gridTile = $this.closest('.grid-tile');
                        if (gridTile.length > 0) {
                            dealerSelectorModal.attr('data-product-id', gridTile.data('pid'));
                            dealerSelectorModal.attr('data-product-quantity', '1');
                            selectedShippingMethod = gridTile.find('.dealer-tile-area').attr('data-available-shipping-method');
                            shippingMethod = selectedShippingMethod || '';
                            dealerSelectorModal.attr('data-shipping-method', shippingMethod);
                        } else if (window.pageContext.type === 'product' && $('.product-detail').length > 0) {
                            dealerSelectorModal.attr('data-product-id', $('.product-detail').data('pid'));
                            dealerSelectorModal.attr('data-product-quantity', '1');
                            selectedShippingMethod = $('.where-to-buy-wrap--pdp-sticky .where-to-buy--pdp').attr('data-available-shipping-method');
                            shippingMethod = selectedShippingMethod || '';
                            dealerSelectorModal.attr('data-shipping-method', shippingMethod);
                        } else {
                            dealerSelectorModal.attr('data-product-id', '');
                            dealerSelectorModal.attr('data-product-quantity', '');
                            dealerSelectorModal.attr('data-shipping-method', '');
                        }
                        dealerSelectorModal.attr('data-event-type', eventTypeValue);
                        $('.btn-storelocator-search').click();
                    } else {
                        window.console.error('Zipcode was not get');
                        $.spinner().stop();
                    }
                }
            }).always(function () {
                $.spinner().stop();
            });
        });

        $(document).ready(function () {
            $('input[name="storeviewtype"]').click(function () {
                $(this).tab('show');
                $(this).removeClass('active');
            });

            // set checked content tab
            $('input[name="storeviewtype"]:checked').click();
        });
    }
};
