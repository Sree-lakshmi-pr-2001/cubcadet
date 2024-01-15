'use strict';

var dashboardUtils = {
    /**
    * @desc Opens a content asset to edit
    */
    modifyAsset: function () {
        var $assetIdField = $('#modify-asset-pane .modal-asset-id');
        var assetId = $assetIdField.val();

        if (assetId) {
            $assetIdField.removeClass('is-invalid');

            var jqXHR = $.ajax({
                url: $('.modal-asset-form').attr('data-action'),
                dataType: 'json',
                data: {
                    aid: assetId
                }
            });

            jqXHR.done(function (response) {
                if (response.errorFields.length) {
                    $assetIdField.addClass('is-invalid');
                } else {
                    $assetIdField.removeClass('is-invalid').addClass('is-valid');
                }
            });

            return jqXHR;
        }

        var deferred = $.Deferred();
        deferred.reject();
        $assetIdField.addClass('is-invalid');
        return deferred;
    },

    /**
    * @desc Copy and renames and asset, then opens it for editing
    */
    copyAsset: function () {
        var $assetIdField = $('#copy-asset-pane .modal-asset-id');
        var assetId = $assetIdField.val();
        var $newAssetField = $('#copy-asset-pane .modal-asset-copy-id');

        if (assetId) {
            $assetIdField.removeClass('is-invalid');
            var data = {
                aid: assetId
            };

            if ($newAssetField.val()) {
                data.copyaid = $newAssetField.val();
            } else {
                data.copyaid = assetId + '-' + new Date().getTime();
                $newAssetField.val(data.copyaid);
            }

            var jqXHR = $.ajax({
                url: $('.modal-asset-form').attr('data-action'),
                dataType: 'json',
                data: data
            });

            jqXHR.done(function (response) {
                if (response.errorFields.length) {
                    if (response.errorFields.indexOf('aid') >= 0) {
                        $assetIdField.addClass('is-invalid');
                    } else if (response.errorFields.indexOf('copyaid') >= 0) {
                        $newAssetField.addClass('is-invalid');
                    }
                } else {
                    $assetIdField.removeClass('is-invalid').addClass('is-valid');
                    $newAssetField.removeClass('is-invalid').addClass('is-valid');
                }
            });

            return jqXHR;
        }

        var deferred = $.Deferred();
        deferred.reject();
        $assetIdField.addClass('is-invalid');
        return deferred;
    },

    /**
    * @desc replaces a parameter value
    * @param {string} url - the url to update
    * @param {string} parameter - the parameter to be replaced
    * @param {string} value - the value of the new parameter
    */
    replaceParam: function (url, parameter, value) {
        if (url.indexOf('?') === -1 || url.indexOf(parameter + '=') === -1) {
            return url;
        }
        var hash;
        var params;
        var domain = url.split('?')[0];
        var paramUrl = url.split('?')[1];
        var newParam = parameter + '=' + value;
        var newParams = [];
        // if there is a hash at the end, store the hash
        if (paramUrl.indexOf('#') > -1) {
            hash = paramUrl.split('#')[1] || '';
            paramUrl = paramUrl.split('#')[0];
        }
        params = paramUrl.split('&');
        for (var i = 0; i < params.length; i++) {
            // put back param to newParams array if it is not the one to be changed
            if (params[i].split('=')[0] !== parameter) {
                newParams.push(params[i]);
            }
        }
        // add new param
        newParams.push(newParam);

        return domain + '?' + newParams.join('&') + (hash ? '#' + hash : '');
    },
    /**
    * @desc finds the content asset folder in the tree
    * @param {string} assetID - the asset ID
    */
   getAssetFolder: function (assetID) {
     var folder;
     $('#asset-browser-modal .content-asset').each(function() {
        if ($(this).text() === assetID) {
            folder = $(this).closest('.content-folder-level');
        }
     });

     return folder.attr('id');

   },
   /**
    * @desc Update the open modal's locale selector to the currently selected locale
    * Used in the editor's save and open modals
    * @param {string} modalSelector - the modal to handle
    */
   setLocaleSelector: function setLocaleSelector(modalSelector) {
       var modal = $(modalSelector);
       modal.on('shown.bs.modal', function() {
            var locale = $('#gjs').attr('data-locale');
            var selectedLocale = locale.indexOf('-') > -1 ? locale.replace('-', '_') : locale;
            modal.find('select.locale-selection').val(selectedLocale);
        });
   }
}

module.exports = dashboardUtils;
