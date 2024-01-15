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

    var widthOptions = configs.lyonscgConfigs.widthOptions;
    var containerWidth = configs.lyonscgConfigs.containerWidth;
    var textBlockDesktopPosition = configs.lyonscgConfigs.textBlockDesktopPosition;
    var textBlockMobilePosition = configs.lyonscgConfigs.textBlockMobilePosition;
    var colors = configs.lyonscgConfigs.colors;
    // TODO - Commenting this out for now, not sure of the best approach for this - I think we should apply this on the cta's directly...
    //var ctaLayout = configs.lyonscgConfigs.ctaLayout;

    domc.addType('hero', {
        model: defaultModel.extend({
          defaults: Object.assign({}, defaultModel.prototype.defaults, {
            'custom-name': 'Hero',
            tagName: 'div',
            classes: ['hero'],
            selectable: true,
            traits: [
              {
                type: 'class_select',
                options: widthOptions,
                label: 'Hero Block Width',
                name: 'contentWidth',
                changeProp: 1
              },
              {
                type: 'class_select',
                options: containerWidth,
                label: 'Container Width',
                name: 'containerWidth',
                changeProp: 1
              },
              {
                type: 'hero_position_element',
                options: textBlockDesktopPosition,
                label: 'Text Block Desktop Position',
                name: 'textBlockDesktopPosition',
                changeProp: 1
              },
              {
                type: 'hero_position_element',
                options: textBlockMobilePosition,
                label: 'Text Block Mobile Position',
                name: 'textBlockMobilePosition',
                changeProp: 1
              },
              {
                type: 'class_select',
                options: colors,
                label: 'Text Block Background Color',
                name: 'textBlockBackgroundColor',
                changeProp: 1
              }
              // See above commented out section for explanation
              /*
              ,
              {
                type: 'class_select',
                options: ctaLayout,
                label: 'Link Layout',
                name: 'contentLinkLayout',
                changeProp: 1
              }
              */
            ].concat(defaultModel.prototype.defaults.traits)
          }),
          /* BS comps use init2, not init */
          init2() {
            this.listenTo(this, 'change:contentWidth', this.handleContentWidth);
          },
          /* contentWidth */
          handleContentWidth() {
              var heroBlock = this.model.components();
              alert(heroBlock.getType());
          }
        }, {
          isComponent(el) {
            if (el && el.classList && el.classList.contains('hero')) {
                if (el.classList.contains('hero-overlay')){
                    return {type: 'hero_overlay'};
                }
              return {type: 'hero'};
            }
          }
        })
    });
}
