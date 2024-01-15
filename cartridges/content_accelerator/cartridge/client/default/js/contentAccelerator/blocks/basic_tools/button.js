'use strict';
/* global window.editor */

module.exports = window.editor.BlockManager.add('button', {
    attributes: {
        class: 'fa fa-cube'
    },
    category: 'Basic Tools',
    label: 'Button',
    content: {
        draggable: true,
        droppable: true,
        content: '<button type="button" class="btn btn-primary" data-gjs-draggable="*">Learn More</button>',
    }
});
