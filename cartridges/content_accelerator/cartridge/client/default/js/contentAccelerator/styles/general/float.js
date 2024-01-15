'use strict';

/**
 * <div class="float-left">Float left on all viewport sizes</div><br>
<div class="float-right">Float right on all viewport sizes</div><br>
<div class="float-none">Don't float on all viewport sizes</div>
 */
module.exports = window.editor.StyleManager.addProperty('general', {
    name: 'Float',
    property: 'float',
    type: 'select',
    list: [{
        value: 'float-left',
        name: 'Left'
    }, {
        value: 'float-right',
        name: 'Right'
    }, {
        value: 'float-none',
        name: 'None'
    }],
});
