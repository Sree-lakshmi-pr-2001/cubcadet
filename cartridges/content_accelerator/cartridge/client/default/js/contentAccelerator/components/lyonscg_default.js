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

    var colors = configs.lyonscgConfigs.colors;
    var textColors = configs.lyonscgConfigs.textColors;
    var textAlignment = configs.lyonscgConfigs.textAlignment;

    domc.addType('default', {
        model: defaultModel.extend({
          defaults: Object.assign({}, defaultModel.prototype.defaults, {
            tagName: 'div',
            traits: [
              {
                type: 'class_select',
                options: textColors,
                label: 'Text Color',
                changeProp: 1
              },
              {
                type: 'class_select',
                options: colors,
                label: 'Background Color',
                changeProp: 1
              },
              // Give user the ability to override the alignment on parent and set granularly
              {
                type: 'class_select',
                options: textAlignment,
                label: 'Text Alignment',
                changeProp: 1
              },
              {
                type: 'text',
                label: 'ID',
                name: 'id',
                placeholder: '# Id',
                changeProp: 1
              },
              {
                type: 'text',
                label: 'Title',
                name: 'title',
                placeholder: 'title text',
                changeProp: 1
              }
            ]
          }),
          init() {
            const classes = this.get('classes');
            classes.bind('add', this.classesChanged.bind(this));
            classes.bind('change', this.classesChanged.bind(this));
            classes.bind('remove', this.classesChanged.bind(this));
            this.init2();
          },
          /* BS comps use init2, not init */
          init2() {},
          /* method where we can check if we should changeType */
          classesChanged() {},
          /* replace the comp with a copy of a different type */
          changeType(new_type) {
            const coll = this.collection;
            const at = coll.indexOf(this);
            const button_opts = {
              type: new_type,
              style: this.getStyle(),
              attributes: this.getAttributes(),
              content: this.view.el.innerHTML
            }
            coll.remove(this);
            coll.add(button_opts, { at });
            this.destroy();
          }
        }),
        view: defaultView
      });
}
