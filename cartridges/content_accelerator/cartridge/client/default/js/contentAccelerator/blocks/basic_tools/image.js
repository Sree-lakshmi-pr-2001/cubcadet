'use strict';
/* global window.editor */

module.exports = window.editor.BlockManager.add('image', {
    label: 'Image',
    category: 'Basic Tools',
    attributes: {
        class: 'gjs-fonts gjs-f-image'
    },
    content: {
        draggable: true,
        droppable: true,
        style: {
            color: 'black'
        },
        type: 'image',
        activeOnRender: 1
    },
});
