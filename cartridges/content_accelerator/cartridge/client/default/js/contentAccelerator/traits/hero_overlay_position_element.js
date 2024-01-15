import _ from 'underscore';

export default (editor, config = {}) => {
  editor.TraitManager.addType('hero_overlay_position_element', {
    events:{
      'change': 'onChange',  // trigger parent onChange method on input change
    },
    getInputEl: function() {
      if (!this.inputEl) {
        var md = this.model;
        var opts = md.get('options') || [];
        var input = document.createElement('select');
        var target_view_el_00 = this.target.components().models[0];
        for(let i = 0; i < opts.length; i++) {
          let name = opts[i].name;
          let value = opts[i].value;
          let option = document.createElement('option');
          option.text = name;
          option.value = value;
          const value_a = value.split(' ');
          if(_.intersection(target_view_el_00.classList, value_a).length == value_a.length) {
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
                                if (this.model.attributes.name == 'textBlockPosition') {
                                    if (classes_i_a[j] == 'hero-content-left') {
                                        this.target.components().models[0].removeClass('hero-content-right');
                                    }
                                    if (classes_i_a[j] == 'hero-content-right') {
                                        this.target.components().models[0].removeClass('hero-content-left');
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
                if (this.model.attributes.name == 'textBlockPosition') {
                    if (value_a[i] == 'hero-content-left') {
                        this.target.components().models[0].addClass('hero-content-left');
                        this.target.components().models[0].removeClass('hero-content-right');
                    }
                    if (value_a[i] == 'hero-content-right') {
                        this.target.components().models[0].addClass('hero-content-right');
                        this.target.components().models[0].removeClass('hero-content-left');
                    }
                }
            }
        }
    }
  });

}
