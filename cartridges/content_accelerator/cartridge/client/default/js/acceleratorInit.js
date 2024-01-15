'use strict';

import $ from 'jquery';
window.jQuery = window.$ = $;

import 'bootstrap/js/dist/collapse';
import 'bootstrap/js/dist/modal';
import 'bootstrap/js/dist/tab';

const dashboardUtils = require('./contentAccelerator/utils/dashboardUtils');

$(document).ready(function () {
    // Event handlers
    /**
     * Handles the locale selector
     */
    $('body').on('change', 'select.locale-selection', function () {
        var newLocale = $(this).children('option:selected').val();
        $('.locale-picker').attr('data-locale', newLocale);
        $('#gjs').attr('data-locale', newLocale);
        // update dashboard URLs with new locale param
        $('.recent-assets-list td a, #preset-options a').each(function(i, val) {
            var newHref = dashboardUtils.replaceParam($(this).attr('href'), 'locale', newLocale);
            $(this).attr('href', newHref);
        })
        // select the open modal to use selected locale
        $('#asset-browser-modal select.locale-selection').val(newLocale);
    });

    /**
     * Handles the click event on the asset tree content assets
     */
    $('body').on('click', '.content-asset-tree .content-asset', function () {
        $('.modal-asset-id').val($(this).text());
        $('.modal-asset-id').removeClass('is-invalid').addClass('is-valid');

        // fill in copy tab
        $('.modal-asset-copy-folder').val($(this).parent('.content-folder-level').data('folder'));
    });

    /**
     * Handles the click event on the modify asset button in the modal
     */
    $('body').on('click', '.modify-asset-button', function () {
        var editHref = $(this).attr('data-edit-href');
        var locale = $('.locale-picker select').val();

        var deferred = dashboardUtils.modifyAsset();
        deferred.done(function (response) {
            if (!response.errorFields.length) {
                window.location.href = editHref + '?contentAssetID=' + $('#modify-asset-pane .modal-asset-id').val() + '&locale=' + locale;
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

                window.location.href = copyAssetHref;
            }
        });
    });
});
