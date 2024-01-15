'use strict';

module.exports = window.editor.StyleManager.addProperty('flex', {
    name: 'Justify Content',
    property: 'justify-content',
    type: 'select',
    list: [{
        value: 'justify-content-start',
        name: 'Start'
    }, {
        value: 'justify-content-end',
        name: 'End'
    }, {
        value: 'justify-content-center',
        name: 'Center'
    }, {
        value: 'justify-content-between',
        name: 'Space Between'
    }, {
        value: 'justify-content-around',
        name: 'Space Around'
    }],
});
