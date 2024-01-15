import _ from 'underscore';
import utils from '../utils/utils';
export default (editor, config = {}) => {

    const tm = editor.TraitManager;

    tm.addType('attribute_select', {
        events:{
        'change': 'onChange',
        },
        getInputEl: function () {
            if (!this.inputEl) {
                var model = this.model;
                // var ctaComponent = this.target;
                var element = this.target.view.el;
                // video modal links may use the data-link over href
                var hrefAttr = element.attributes.href ? element.attributes.href : element.attributes['data-link'];
                try {
                    var targetAttr = element.attributes.target.value;
                } catch (err) {
                    // attribute was missing
                }

                // Create the URL from the href and urlType values
                var opts = model.get('options') || [];
                var input = document.createElement('select');
                if (model.get('name') == 'urlType') {
                    if (hrefAttr && hrefAttr.value != '') {
                        if (utils.checkAssetUrl(hrefAttr.value)) {
                            var urlParts = utils.splitAssetUrl(hrefAttr.value);
                            var urlType = urlParts[3];
                            var type;

                            switch (urlType) {
                                case 'cgid':
                                    type = 'category';
                                    break;
                                case 'pid':
                                    type = 'product';
                                    break;
                                case 'cid':
                                    type = 'content';
                                    break;
                                case 'q':
                                    type = 'search';
                                    break;
                                default:
                                    type = 'absolute';
                                    break;
                            }

                            var defaultValue = type;

                        } else {
                            var defaultValue = opts[4].value;
                        }
                    } else {
                        var defaultValue = opts[0].value;
                    }
                } else if (model.get('name') == 'urlTarget') {
                    if (targetAttr != '') {
                        var defaultValue = targetAttr;
                    } else {
                        var defaultValue = opts[0].value;
                    }
                } else {
                    var defaultValue = opts[0].value;
                }
                var selectValue = model.attributes.value;

                for (let i = 0; i < opts.length; i++) {
                    let name = opts[i].name;
                    let value = opts[i].value;
                    let option = document.createElement('option');
                    option.text = name;
                    option.value = value;

                    input.append(option);
                }
                this.inputEl = input;

                // Set the Default value
                if (selectValue == '') {
                    this.model.attributes.value = defaultValue;
                    this.inputEl.value = defaultValue;
                } else {
                    this.inputEl.value = selectValue;
                }
            }

            return this.inputEl;
            },
            onValueChange: function () {
                var model = this.model;
                // Get the text input values
                var attribute = model.get('attribute');
                var value = model.get('value');
                // Create the URL from the href and urlType values
                var ctaComponent = this.target;
                var element = this.target.view.el;

                utils.updateAttribute(attribute, value, ctaComponent, model, element);
            }
        });
    }
