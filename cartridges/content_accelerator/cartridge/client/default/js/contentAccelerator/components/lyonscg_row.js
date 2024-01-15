/**
 * taken from
 * https://github.com/kaoz70/grapesjs-blocks-bootstrap4
 */
import _ from 'underscore';
import _s from 'underscore.string';

export default (editor = {}) => {
    var domc = editor.DomComponents;
    var defaultType = domc.getType('default');
    var defaultModel = defaultType.model;
    var defaultView = defaultType.view;

    domc.addType('row', {
        model: defaultModel.extend({
          defaults: Object.assign({}, defaultModel.prototype.defaults, {
            'custom-name': 'Row',
            tagName: 'div',
            draggable: '.container, .container-fluid',
            droppable: true,
            traits: [
              {
                type: 'class_select',
                options: [
                  {value: '', name: 'Yes'},
                  {value: 'no-gutters', name: 'No'}
                ],
                label: 'Gutters?'
              }
            ].concat(defaultModel.prototype.defaults.traits)
          })
        }, {
          isComponent(el) {
            if(el && el.classList && el.classList.contains('row')) {
              return {type: 'row'};
            }
          }
        }),
        view: defaultView
      });
}
