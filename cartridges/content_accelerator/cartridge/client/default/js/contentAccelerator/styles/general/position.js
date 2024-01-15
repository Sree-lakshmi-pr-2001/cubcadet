'use strict';

module.exports = window.editor.StyleManager.addProperty('general', {
    name: 'Position',
    property: 'position',
    type: 'select',
    list: [{
        value: 'position-static',
        name: 'Static'
    }, {
        value: 'position-relative',
        name: 'Relative'
    }, {
        value: 'position-absolute',
        name: 'Absolute'
    }, {
        value: 'position-fixed',
        name: 'Fixed'
    }, {
        value: 'position-sticky',
        name: 'Sticky'
    }],
});
