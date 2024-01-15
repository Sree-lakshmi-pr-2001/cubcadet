'use strict';

module.exports = {
    downloadManuals: function () {
        $('body').on('click', '.manual-download-link', function (e) {
            e.preventDefault();
            var manualDownloadLink = $(this).data('href');
            var agreementContainer = $('#manuals-agreements');
            var agreeBtnTxt = agreementContainer.data('agree-btn');
            var disagreeBtnTxt = agreementContainer.data('disagree-btn');
            var contentAssetHtml = agreementContainer.html();

            var htmlString = '<!-- Modal -->'
                + '<div class="modal show" id="manuals-agreement-dialog" role="dialog" style="display: block;" aria-labelledby="modal-title" data-la-initdispnone="true">'
                + '<div class="modal-dialog" role="document">'
                + '<!-- Modal content-->'
                + '<div class="modal-content">'
                + '<div class="modal-header">'
                + '</div>'
                + '<div class="modal-body">' + contentAssetHtml + '</div>'
                + '<div class="modal-footer">'
                + '<button class="decline btn btn-outline-primary">'
                + disagreeBtnTxt
                + '</button>'
                + '<button class="affirm btn btn-primary">'
                + agreeBtnTxt
                + '</button>'
                + '</div>'
                + '</div>'
                + '</div>'
                + '</div>';
            $('#main').append(htmlString);

            var manualAgreementDialog = $('#manuals-agreement-dialog');

            manualAgreementDialog.find('.affirm').on('click', function () {
                manualAgreementDialog.remove();
                window.location.href = manualDownloadLink;
            });

            manualAgreementDialog.find('.decline').on('click', function () {
                manualAgreementDialog.remove();
            });
        });
    }
};
