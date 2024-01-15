'use strict';

// open the Traits Panel when a component is selected in the canvas
// ensures users only see custom component options

module.exports = window.editor.on('component:selected', function compSelected() {
    const openTmBtn = editor.Panels.getButton('views', 'open-tm');
    const openLayersBtn = editor.Panels.getButton('views', 'open-layers');

    if ((!openLayersBtn || !openLayersBtn.get('active')) && editor.getSelected()) {
        openTmBtn.set('active', 1);
    }

    function setFileBrowserIframeHeight() {
        $('#file-browser').height(window.innerHeight - 200);
    }
    setFileBrowserIframeHeight();
}).on('load', function selectComp() {
    // pre-select the first component; this will open traits for preset content
    var firstComp = editor.getComponents().models[0];
    editor.selectToggle(firstComp);

    // start in Desktop and set button to active
    window.editor.setDevice('Extra Large');
    $('.gjs-pn-devices-buttons .gjs-pn-btn').removeClass('gjs-pn-active gjs-four-color');
    $('[title="Extra Large"]').addClass('gjs-pn-active gjs-four-color');
});
