'use strict';

module.exports = window.editor.StyleManager.addSector('buttons', {
    name: 'Buttons',
    open: true,
    properties: [
        {
            property: 'type',
            type: 'select',
            list: [
            {name: 'primary', value: 'btn-primary'},
            {name: 'secondary', value: 'btn-secondary'},
            {name: 'primary outline', value: 'btn-outline-primary'},
            {name: 'secondary outline', value: 'btn-outline-secondary'}
            ]
        }
    ]
});
