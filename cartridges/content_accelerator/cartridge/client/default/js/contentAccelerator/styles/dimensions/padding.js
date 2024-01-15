'use strict';

module.exports = window.editor.StyleManager.addProperty('dimension', {
    name: 'Padding',
    property: 'padding',
    type: 'select',
    list: [{
        value: 'p-0',
        name: '0'
    }, {
        value: 'p-1',
        name: '1'
    }, {
        value: 'p-2',
        name: '2'
    }, {
        value: 'p-3',
        name: '3'
    }, {
        value: 'p-4',
        name: '4'
    }, {
        value: 'p-5',
        name: '5'
    }, {
        value: 'p-6',
        name: '6'
    }],
});
