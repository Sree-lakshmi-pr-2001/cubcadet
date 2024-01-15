'use strict';

module.exports = {
    downloadManuals: function () {
        $('body').on('click', '.manual-download-link', function (e) {
            e.preventDefault();
            var manualDownloadLink = $(this).data('href');
            var modalTitle = $(this).data('title') ? $(this).data('title') : '';
            var agreementContainer = $('#manuals-agreements');
            var agreeBtnTxt = agreementContainer.data('agree-btn');
            var disagreeBtnTxt = agreementContainer.data('disagree-btn');
            var contentAssetHtml = agreementContainer.html();

            var htmlString = '<!-- Modal -->'
                + '<div class="modal fade" id="manuals-agreement-dialog" role="dialog" aria-labelledby="modal-title" data-la-initdispnone="true">'
                + '<div class="modal-dialog modal-lg" role="document">'
                + '<!-- Modal content-->'
                + '<div class="modal-content">'
                + '<div class="modal-header">'
                + '<div><h4 class="modal-title">'
                + modalTitle
                + '</h4></div>'
                + '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true"></span></button>'
                + '</div>'
                + '<div class="modal-body">' + contentAssetHtml + '</div>'
                + '<div class="modal-footer">'
                + '<button class="decline btn btn-outline-secondary" data-dismiss="modal">'
                + disagreeBtnTxt
                + '</button>'
                + '<button class="affirm btn btn-secondary">'
                + agreeBtnTxt
                + '</button>'
                + '</div>'
                + '</div>'
                + '</div>'
                + '</div>';

            // Not creating/using variable if on initial use, the variable is not found and other references are undefined
            if ($('#manuals-agreement-dialog').length === 0) {
                $('#main').append(htmlString);
            }

            var manualAgreementDialog = $('#manuals-agreement-dialog');
            // show the modal
            manualAgreementDialog.modal('show');

            manualAgreementDialog.find('.affirm').on('click', function () {
                manualAgreementDialog.modal('hide');
                window.location.href = manualDownloadLink;
            });

            manualAgreementDialog.find('.decline').on('click', function () {
                manualAgreementDialog.modal('hide');
            });
        });
    }
};
