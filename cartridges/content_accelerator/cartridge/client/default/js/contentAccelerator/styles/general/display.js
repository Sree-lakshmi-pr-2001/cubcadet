'use strict';

module.exports = window.editor.StyleManager.addProperty('general', {
    name: 'Display',
    property: 'display',
    type: 'select',
    list: [{
        value: 'd-none',
        name: 'None'
    }, {
        value: 'd-inline',
        name: 'Inline'
    }, {
        value: 'd-inline-block',
        name: 'Inline Block'
    }, {
        value: 'd-block',
        name: 'Block'
    }, {
        value: 'd-flex',
        name: 'Flex'
    }]
});
