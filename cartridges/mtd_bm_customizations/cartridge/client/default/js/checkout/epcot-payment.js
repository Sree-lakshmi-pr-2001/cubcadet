/* eslint-disable no-alert */
/* eslint-disable camelcase */
'use strict';

module.exports = {
    methods: {
    },

    paymentMethodButton: function () {
        $('#paymentMethod').on('change', function () {
            console.log('paymentMethod changed : ' + this.id);
            let paymentMethod = $('#paymentMethod').val();
            console.log(paymentMethod);
            let paymentForm = $('#paymentForm');
            console.log(paymentForm);
            if (paymentMethod === 'PCIPAL') {
                paymentForm.attr('action', '/on/demandware.store/Sites-Site/default/PCIPal-StartPayment');
            } else if (paymentMethod === 'NO_CHARGE') {
                paymentForm.attr('action', '/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-OrderSubmitNoCharge');
            } else {
                paymentForm.attr('action', '');
            }
        });
    },

    paymentCheckoutButton: function () {
        $('#paymentCheckoutButton').on('click', function () {
            let paymentForm = $('#paymentForm');
            let shippingMethod = $('#globalShippingMethod').val();

            if (shippingMethod === '') {
                document.getElementById('shippingStatus').innerHTML = 'Select a shipping method';
            } else {
                document.getElementById('shippingStatus').innerHTML = '';
                this.disabled = true;
                paymentForm.submit();
            }
            // let paymentFormAction = paymentForm.attr('action');
            // console.log('paymentFormAction : ' + paymentFormAction);
            // if (paymentFormAction !== '') {
            //     console.log('payment method not empty');
            //     document.getElementById('miniCartStatus').innerHTML = '';
            //     paymentForm.submit();
            // } else {
            //     console.log('payment method is empty');
            //     document.getElementById('miniCartStatus').innerHTML = 'Please select a payment method';
            // }
        });
    }
};
