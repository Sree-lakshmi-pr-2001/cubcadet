'use strict';

module.exports = window.editor.StyleManager.addProperty('dimension', {
    name: 'Margin',
    property: 'margin',
    type: 'select',
    list: [{
        value: 'm-0',
        name: '0'
    }, {
        value: 'm-1',
        name: '1'
    }, {
        value: 'm-2',
        name: '2'
    }, {
        value: 'm-3',
        name: '3'
    }, {
        value: 'm-4',
        name: '4'
    }, {
        value: 'm-5',
        name: '5'
    }, {
        value: 'm-6',
        name: '6'
    }],
});
