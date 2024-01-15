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
     * Handles the click event on the modify asset button in the modal
     */
    $('body').on('click', '.modify-asset-button', function () {
        var editHref = $(this).attr('data-edit-href');

        var deferred = dashboardUtils.modifyAsset();
        deferred.done(function (response) {
            if (!response.errorFields.length) {
                var contentAssetID = $('#modify-asset-pane .modal-asset-id').val();
                var locale = $('#modify-asset-pane .locale-selection').val();

                editor.StorageManager.get('remote').set({
                    urlLoad: `${editHref}?contentAssetID=${contentAssetID}&locale=${locale}&format=json`
                });
                editor.load();

                // update the save modal to ensure proper ID is set
                var saveAssetForm = $('.modal-save-asset-form');
                saveAssetForm.find('input.modal-asset-id').val(contentAssetID);
                saveAssetForm.find('input.modal-asset-save-name').val('');
                // find the folder and set in save modal
                var folder = dashboardUtils.getAssetFolder(contentAssetID);
                folder = folder.substr(0, folder.length - 7); // trim '-folder' off end
                saveAssetForm.find('.modal-asset-save-folder').val(folder);

                // change locale attribute for future reference
                $('#gjs').attr('data-locale', locale);

                $('#asset-browser-modal').modal('hide');
            }
        });
    });

    /**
     * Handles the click event on the copy asset button in the modal
     */
    $('body').on('click', '.copy-asset-button', function () {
        var editHref = $(this).attr('data-edit-href');
        var $assetIdField = $('#copy-asset-pane .modal-asset-id');
        var assetId = $assetIdField.val();
        var $newAssetField = $('#copy-asset-pane .modal-asset-copy-id');
        var $newAssetNameField = $('#copy-asset-pane .modal-asset-copy-name');
        var $newAssetFolderField = $('#copy-asset-pane .modal-asset-copy-folder');

        var deferred = dashboardUtils.copyAsset();
        deferred.done(function (response) {
            if (!response.errorFields.length) {
                var copyAssetHref = editHref + '?contentAssetID=' + assetId;

                if ($newAssetField.val()) {
                    copyAssetHref += '&newAssetID=' + $newAssetField.val();
                } else {
                    copyAssetHref += '&newAssetID=' + assetId + '-' + new Date().getTime();
                }

                if ($newAssetNameField.val()) {
                    copyAssetHref += '&name=' + $newAssetNameField.val();
                }

                if ($newAssetFolderField.val()) {
                    copyAssetHref += '&folder=' + $newAssetFolderField.val();
                }

                editor.StorageManager.get('remote').set({
                    urlLoad: `${copyAssetHref}&format=json`
                });
                editor.load();

                $('#asset-browser-modal').modal('hide');
            }
        });
    });

    /**
     * pre-selects the locale in the modal
     */
    dashboardUtils.setLocaleSelector('#asset-browser-modal');

    editor.Panels.addButton('options', [{
        id: 'load',
        className: 'fa fa-folder-open-o',
        command: function (editor) {
            /*
            var contentAssetID = prompt('What content asset would you like to load?');
            editor.StorageManager.get('remote').set({
                urlLoad: `${loadContentAsset}?contentAssetID=${contentAssetID}&format=json`
            });
            editor.load();
            */
        },
        attributes: {
            title: 'Load Content Asset',
            'data-toggle': 'modal',
            'data-target': '#asset-browser-modal'
        }
    }]);
}
