'use strict';

import dashboardUtils from '../../utils/dashboardUtils';

export default (editor, configs = {}) => {
    /**
     * Handles the click event on the asset tree content assets
     */
    $('body').on('click', '.content-asset-tree .content-asset', function () {
        $('.modal-asset-id').val($(this).text());
        $('.modal-asset-id').removeClass('is-invalid').addClass('is-valid');
    });

    /**
     * Handles the click event on the save asset button in the modal
     */
    $('body').on('click', '.save-asset-button', function () {

        var $assetIdField = $('#save-asset-pane .modal-asset-id');
        var contentAssetID = $assetIdField.val();

        var $newAssetNameField = $('#save-asset-pane .modal-asset-save-name');
        var contentAssetName = $newAssetNameField.val();

        var $newAssetFolderField = $('#save-asset-pane .modal-asset-save-folder');
        var contentAssetFolder = $newAssetFolderField.val();

        var $newAssetLocaleField = $('#save-asset-pane .locale-selection');
        var locale = $newAssetLocaleField.val() || $('#gjs').data('locale');

        var components = JSON.stringify(editor.getComponents().toJSON());
        var html = editor.getHtml();

        $('#save-asset-modal').modal('hide');
        $('.action-messages').append(
            '<div class="alert alert-info save-asset-alert text-center"'
            + ' role="alert"> Saving... </div>'
        );

        editor.StorageManager.store({
            contentAssetID: contentAssetID,
            name: contentAssetName,
            folder: contentAssetFolder,
            components: components,
            html: html,
            locale: locale
        }, (res) => {
            console.log(res);

            // close the modal

            $('.save-asset-alert').remove();

            // show success or failure alert, briefly
            if (res.saveContentAsset !== 'false: ERROR') {
                $('.action-messages').append(
                    '<div class="alert alert-success save-asset-alert text-center"'
                    + ' role="alert"> Success! </div>'
                );
            } else {
                $('.action-messages').append(
                    '<div class="alert alert-danger save-asset-alert text-center"'
                    + ' role="alert"> Uh Oh! Something went wrong. Try again. </div>'
                );
            }

            setTimeout(function () {
                $('.save-asset-alert').remove();
            }, 3000);
        })

    });

    /**
     * pre-selects the locale in the modal
     */
    dashboardUtils.setLocaleSelector('#save-asset-modal');

    editor.Panels.addButton('options', [{
        id: 'save',
        className: 'fa fa-floppy-o icon-blank',
        command: function (editor) {
            // need command function on this option, but will intercept with script above
        },
        attributes: {
            title: 'Save Template',
            'data-toggle': 'modal',
            'data-target': '#save-asset-modal'
        }
    }]);
}
