'use strict';

// lyonscg-content-accelerator
require('../../contentAccelerator/index');

var grapesInit = function () {
    var globalCSS = $('[data-global-css]').data('globalCss');
    var grapesCSS = $('[data-grapes-css]').data('grapesCss');
    var saveContentAsset = $('[data-save-content-asset]').data('saveContentAsset');
    var loadContentAsset = $('[data-load-content-asset]').data('loadContentAsset');

    window.editor = grapesjs.init({
        height: '100%',
        showOffsets: 1,
        container: '#gjs',
        plugins: ['lyonscg-content-accelerator'],
        fromElement: true,
        canvas: {
            styles: [
                globalCSS,
                grapesCSS
            ]
        },
        deviceManager: {
            visible: false
        },
        showDevices: false,
        storageManager: {
            type: 'remote',
            stepsBeforeSave: 3,
            urlStore: saveContentAsset,
            urlLoad: loadContentAsset,
            autoload: false,
            autosave: false,
            contentTypeJson: true
        },
        // kill these for now
        styleManager: {
            visible: false
        },
        blockManager: {
            visible: false
        }
    });

    // Custom Editor Events
    require('../editor/customEvents');
};

module.exports = grapesInit;
