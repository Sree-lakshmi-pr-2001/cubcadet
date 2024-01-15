'use strict';

module.exports = window.editor.StyleManager.addProperty('flex', {
    name: 'Flex Direction',
    property: 'flex-direction',
    type: 'select',
    list: [{
        value: 'flex-row',
        name: 'Row'
    }, {
        value: 'flex-row-reverse',
        name: 'Row Reverse'
    }, {
        value: 'flex-column',
        name: 'Column'
    }, {
        value: 'flex-column-reverse',
        name: 'Column Reverse'
    }],
});
