/**
 * taken from
 * https://github.com/kaoz70/grapesjs-blocks-bootstrap4
 */
import _ from 'underscore';
import _s from 'underscore.string';

export default (editor, configs = {}) => {
    var domc = editor.DomComponents;
    var defaultType = domc.getType('default');
    var defaultModel = defaultType.model;
    var defaultView = defaultType.view;

    var containerWidth = configs.lyonscgConfigs.containerWidth;

    domc.addType('container', {
        model: defaultModel.extend({
          defaults: Object.assign({}, defaultModel.prototype.defaults, {
            'custom-name': 'Container',
            tagName: 'div',
            droppable: true,
            traits: [
              {
                type: 'class_select',
                options: containerWidth,
                label: 'Container Width',
                name: 'containerWidth'
              }
            ].concat(defaultModel.prototype.defaults.traits)
          })
        }, {
          isComponent(el) {
            if(el && el.classList && (el.classList.contains('container') || el.classList.contains('container-fluid'))) {
              return {type: 'container'};
            }
          }
        }),
        view: defaultView
    });
}
