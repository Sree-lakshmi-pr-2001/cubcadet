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

    var textBlockPosition = configs.lyonscgConfigs.textBlockPositionOverlay;

    domc.addType('hero_overlay', {
        model: defaultModel.extend({
          defaults: Object.assign({}, defaultModel.prototype.defaults, {
            'custom-name': 'Hero Overlay',
            tagName: 'div',
            classes: ['hero-overlay'],
            selectable: true,
            traits: [
              {
                type: 'hero_overlay_position_element',
                options: textBlockPosition,
                label: 'Text Block Position',
                name: 'textBlockPosition',
                changeProp: 1
              }
            ].concat(defaultModel.prototype.defaults.traits)
          }),
        }, {
          isComponent(el) {
            if(el && el.classList && el.classList.contains('hero-overlay')) {
              return {type: 'hero_overlay'};
            }
          }
        })
    });
}
