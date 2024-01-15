'use strict';
/* global window.editor */

module.exports = window.editor.BlockManager.add('link', {
    label: 'Link',
    category: 'Basic Tools',
    attributes: {
        class: 'fa fa-link'
    },
    content: {
        draggable: true,
        droppable: true,
        type: 'link',
        content: 'Link'
    },
});
