'use strict';
/* global window.editor */

module.exports = window.editor.BlockManager.add('container', {
    label: 'Container',
    attributes: {
        class: 'fa fa-tv'
    },
    category: 'Layout + Columns',
    content: '<div class="container" data-gjs-droppable="*"></div>'
});
