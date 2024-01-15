import _ from 'underscore';
import utils from '../utils/utils';
export default (editor, config = {}) => {

    const tm = editor.TraitManager;

    tm.addType('attribute_text', {
        events:{
            'change': 'onChange',
        },
        getInputEl: function () {
            if (!this.inputEl) {
                var model = this.model;
                var input = document.createElement('input');
                var element = this.target.view.el;
                var hrefAttr = element.attributes.href ? element.attributes.href : element.attributes['data-link'];
                try {
                    var titleAttr = element.attributes.title.value;
                } catch (err) {
                    // attribute was missing
                }
                var inputValue = model.attributes.value;

                this.inputEl = input;

                // Set the Default value
                if (inputValue == '') {
                    if (model.get('name') == 'href' && hrefAttr != '') {
                        if (utils.checkAssetUrl(hrefAttr)) {
                            var urlParts = utils.splitAssetUrl(hrefAttr);
                            var urlLocation = urlParts[5];

                            hrefAttr = urlLocation ? urlLocation : '';
                        }
                        this.inputEl.value = hrefAttr;
                        model.attributes.value = hrefAttr;
                    } else if (model.get('name') == 'urlTitle' && titleAttr != '') {
                        if (titleAttr == undefined) {
                            this.inputEl.value = '';
                        } else {
                            this.inputEl.value = titleAttr;
                            model.attributes.value = titleAttr;
                        }
                    } else {
                        this.inputEl.value = '';
                    }
                } else {
                    this.inputEl.value = inputValue;
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
