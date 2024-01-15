import _ from 'underscore';
//import _s from 'underscore.string';
export default (editor, config = {}) => {

  const tm = editor.TraitManager;

  // Select trait that maps a class list to the select options.
  // The default select option is set if the input has a class, and class list is modified when select value changes.
  tm.addType('class_select', {
    events:{
      'change': 'onChange',  // trigger parent onChange method on input change
    },
    getInputEl: function() {
      if (!this.inputEl) {
        var md = this.model;
        var opts = md.get('options') || [];
        var input = document.createElement('select');
        var target_view_el = this.target.view.el;

        for(let i = 0; i < opts.length; i++) {
          let name = opts[i].name;
          let value = opts[i].value;
          //if(value=='') { value = 'GJS_NO_CLASS'; } // 'GJS_NO_CLASS' represents no class--empty string does not trigger value change
          let option = document.createElement('option');
          option.text = name;
          option.value = value;
          const value_a = value.split(' ');
          if(_.intersection(target_view_el.classList, value_a).length == value_a.length) {
            option.setAttribute('selected', 'selected');
          } else if (this.model.attributes.name == 'containerWidth') {
            var target_view_el_container = this.target.components().models[0].view.el;
            if(_.intersection(target_view_el_container.classList, value_a).length == value_a.length) {
              option.setAttribute('selected', 'selected');
            }
          } else if (this.model.attributes.name == 'textBlockBackgroundColor'){
            var target_view_el_textBlock = this.target.components().models[0].attributes.components.models[0].attributes.components.models[1];
            if(_.intersection(target_view_el_textBlock.classList, value_a).length == value_a.length) {
              option.setAttribute('selected', 'selected');
            }
          }
          input.append(option);
        }
        this.inputEl = input;
      }
      return this.inputEl;
    },

    onValueChange: function () {
      var classes = this.model.get('options').map(opt => opt.value);
      for(let i = 0; i < classes.length; i++) {
        if(classes[i].length > 0) {
          var classes_i_a = classes[i].split(' ');
          for(let j = 0; j < classes_i_a.length; j++) {
            if(classes_i_a[j].length > 0) {
              if (this.model.attributes.name == 'containerWidth') {
                this.target.components().models[0].removeClass(classes_i_a[j]);
              } else if (this.model.attributes.name == 'textBlockBackgroundColor') {
                  this.target.components().models[0].attributes.components.models[0].attributes.components.models[1].removeClass(classes_i_a[j]);
              } else {
                  this.target.removeClass(classes_i_a[j]);
              }
            }
          }
        }
      }
      const value = this.model.get('value');

      if(value.length > 0) {
        const value_a = value.split(' ');
        for(let i = 0; i < value_a.length; i++) {
          if (this.model.attributes.name == 'containerWidth') {
            this.target.components().models[0].addClass(value_a[i]);
          } else if (this.model.attributes.name == 'textBlockBackgroundColor') {
              this.target.components().models[0].attributes.components.models[0].attributes.components.models[1].addClass(value_a[i]);
          } else {
              this.target.addClass(value_a[i]);
          }
        }
      }
      this.target.em.trigger('component:toggled');
      if (this.model.attributes.name == 'containerWidth') {
        this.target.components().models[0].em.trigger('component:toggled');
      } else if (this.model.attributes.name == 'textBlockBackgroundColor') {
          this.target.components().models[0].attributes.components.models[0].attributes.components.models[1].em.trigger('component:toggled');
      }
    }
  });

}
