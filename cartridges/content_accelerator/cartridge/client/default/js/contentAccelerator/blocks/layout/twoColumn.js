'use strict';
/* global window.editor */

module.exports = window.editor.BlockManager.add('column2', {
    label: 'Two Column',
    attributes: {
        class: 'gjs-fonts gjs-f-b2'
    },
    category: 'Layout + Columns',
    content: `<div class="row" data-gjs-droppable=".col">
        <div class="col col-md-6" data-gjs-draggable=".row" data-gjs-droppable="*"></div>
        <div class="col col-md-6" data-gjs-draggable=".row" data-gjs-droppable="*"></div>
    </div>`
});
