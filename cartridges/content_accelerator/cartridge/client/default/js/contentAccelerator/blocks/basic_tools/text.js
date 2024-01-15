'use strict';
/* global window.editor */

module.exports = window.editor.BlockManager.add('text', {
    label: 'Text',
    category: 'Basic Tools',
    attributes: {
        class: 'gjs-fonts gjs-f-text'
    },
    content: {
        draggable: true,
        droppable: true,
        type: 'text',
        content: 'Insert your text here',
        activeOnRender: 1
    }
});
