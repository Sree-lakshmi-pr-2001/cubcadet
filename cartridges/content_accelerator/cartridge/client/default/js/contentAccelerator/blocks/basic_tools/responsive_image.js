'use strict';
/* global window.editor */

module.exports = window.editor.BlockManager.add('responsive_image').set({
    label: 'responsive image',
    category: 'custom',
    attributes: {class: 'fa fa-window-maximize'},
    content: {
        type: 'responsive_image'
    }
});
