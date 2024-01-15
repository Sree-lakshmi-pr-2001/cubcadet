'use strict';
/* global window.editor */

module.exports = window.editor.BlockManager.add('column3', {
    label: 'Three Column',
    category: 'Layout + Columns',
    attributes: {
        class: 'gjs-fonts gjs-f-b3'
    },
    content: `<div class="row" data-gjs-droppable=".col">
            <div class="col-md-4" data-gjs-draggable=".row" data-gjs-droppable="*"></div>
            <div class="col-md-4" data-gjs-draggable=".row" data-gjs-droppable="*"></div>
            <div class="col-md-4" data-gjs-draggable=".row" data-gjs-droppable="*"></div>
        </div>`
});
