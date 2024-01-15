'use strict';

var clientSideValidation = require('org_ma/components/clientSideValidation');
var dealerHome = require('./dealerHome');

module.exports = {
    modalFormInit: function () {
        dealerHome.forms();
    },
    modalEventsInit: function () {
        $(document).on('click', '.js-contact-dealer-modal', function () {
            var $this = $(this);
            var contactDealerModalUpdateUrl = $this.data('contact-dealer-modal-update-url');
            var productId = $this.data('product-id');
            $.spinner().start();
            $.ajax({
                url: contactDealerModalUpdateUrl,
                type: 'get',
                dataType: 'json',
                data: {
                    pid: productId
                },
                success: function (data) {
                    if (data && data.success) {
                        var $contactDealerModal = $('#contactDealerModal');
                        if ($contactDealerModal.length) {
                            // reset form
                            $contactDealerModal.find('#contactUsFormSuccessMessage, #contactUsFormErrorMessage').hide();
                            $contactDealerModal.find('form').attr('style', '');
                            $contactDealerModal.find('.form-control').val('');
                            clientSideValidation.functions.clearForm($contactDealerModal.find('form'));
                            // update product section
                            $contactDealerModal.find('.dealer-product-placeholder').html(data.contactDealerProductHTML);
                            // update selected dealer id
                            $contactDealerModal.find('[name="CompanyId"]').val(data.selectedDealerId);
                            $contactDealerModal.find('[name="ModelName"]').val(data.productName);
                            $contactDealerModal.find('[name="ModelNumber"]').val(data.productId);
                            // show the modal
                            $contactDealerModal.modal('show');
                        }
                    }
                }
            }).always(function () {
                $.spinner().stop();
            });
        });
    }
};
