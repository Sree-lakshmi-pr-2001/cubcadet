import _ from 'underscore';
//import _s from 'underscore.string';
export default (editor, config = {}) => {
  editor.TraitManager.addType('hero_position_element', {
    events:{
      'change': 'onChange',  // trigger parent onChange method on input change
    },
    getInputEl: function() {
      if (!this.inputEl) {
        var md = this.model;
        var opts = md.get('options') || [];
        var input = document.createElement('select');
        var target_view_el_00 = this.target.components().models[0].attributes.components.models[0].attributes.components.models[0];
        var target_view_el_01 = this.target.components().models[0].attributes.components.models[0].attributes.components.models[1];
        for(let i = 0; i < opts.length; i++) {
          let name = opts[i].name;
          let value = opts[i].value;
          //if(value=='') { value = 'GJS_NO_CLASS'; } // 'GJS_NO_CLASS' represents no class--empty string does not trigger value change
          let option = document.createElement('option');
          option.text = name;
          option.value = value;
          const value_a = value.split(' ');
          if(_.intersection(target_view_el_00.classList, value_a).length == value_a.length) {
            option.setAttribute('selected', 'selected');
          }
          if(_.intersection(target_view_el_01.classList, value_a).length == value_a.length) {
            option.setAttribute('selected', 'selected');
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
              if (this.model.attributes.name == 'textBlockDesktopPosition') {
                if (classes_i_a[j] == 'order-lg-2') {
                  this.target.components().models[0].attributes.components.models[0].attributes.components.models[0].removeClass('order-lg-2');
                  this.target.components().models[0].attributes.components.models[0].attributes.components.models[1].removeClass('order-lg-1');
                }
                if (classes_i_a[j] == 'order-lg-1') {
                  this.target.components().models[0].attributes.components.models[0].attributes.components.models[0].removeClass('order-lg-1');
                  this.target.components().models[0].attributes.components.models[0].attributes.components.models[1].removeClass('order-lg-2');
                }
              } else if (this.model.attributes.name == 'textBlockMobilePosition') {
                  if (classes_i_a[j] == 'order-2') {
                    this.target.components().models[0].attributes.components.models[0].attributes.components.models[0].removeClass('order-2');
                    this.target.components().models[0].attributes.components.models[0].attributes.components.models[1].removeClass('order-1');
                  }
                  if (classes_i_a[j] == 'order-1') {
                    this.target.components().models[0].attributes.components.models[0].attributes.components.models[0].removeClass('order-1');
                    this.target.components().models[0].attributes.components.models[0].attributes.components.models[1].removeClass('order-2');
                  }
              }
            }
          }
        }
      }
      const value = this.model.get('value');

      if(value.length > 0 && value != 'GJS_NO_CLASS') {
        const value_a = value.split(' ');
        for(let i = 0; i < value_a.length; i++) {
          if (this.model.attributes.name == 'textBlockDesktopPosition') {
            if (value_a[i] == 'order-lg-2') {
              this.target.components().models[0].attributes.components.models[0].attributes.components.models[0].addClass('order-lg-1');
              this.target.components().models[0].attributes.components.models[0].attributes.components.models[1].addClass('order-lg-2');
            }
            if (value_a[i] == 'order-lg-1') {
              this.target.components().models[0].attributes.components.models[0].attributes.components.models[0].addClass('order-lg-2');
              this.target.components().models[0].attributes.components.models[0].attributes.components.models[1].addClass('order-lg-1');
            }
          } else if (this.model.attributes.name == 'textBlockMobilePosition') {
              if (value_a[i] == 'order-2') {
                this.target.components().models[0].attributes.components.models[0].attributes.components.models[0].addClass('order-1');
                this.target.components().models[0].attributes.components.models[0].attributes.components.models[1].addClass('order-2');
              }
              if (value_a[i] == 'order-1') {
                this.target.components().models[0].attributes.components.models[0].attributes.components.models[0].addClass('order-2');
                this.target.components().models[0].attributes.components.models[0].attributes.components.models[1].addClass('order-1');
              }
          }
        }
      }
    }
  });

}
