'use strict';
/* global window.editor */

module.exports = window.editor.BlockManager.add('ctaContainer', {
    label: 'Link Container',
    attributes: {
        class: 'fa fa-square'
    },
    category: 'Layout + Columns',
    content: '<div class="cta-container" data-gjs-droppable="*"></div>'
});
