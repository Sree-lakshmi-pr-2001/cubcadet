// The Image Picker Trait is used with Responsive Image components (<picture> elements)
// As each input is created, it is bound to its corresponding source tag.
// We expect the data-type attribute on the <source> element to match the input name value
// on change, we up update the model which updates the canvas
var URLPrefix = '';
export default (editor, config = {}) => {
    editor.TraitManager.addType('image_picker', {
        changeProp: 1,
        events:{
            'change': 'onChange'  // trigger parent onChange method on input change
        },
        getInputEl: function() {
            if (!this.inputEl) {

                // create our input
                var input = document.createElement('input');
                // find the corresponding source tag
                var isBlockComponent = this.target.attributes.tagName === 'picture' ? true : false;
                var pictureComponent = isBlockComponent ? this.target : this.target.parent();
                var childComponents = pictureComponent.components();
                var inputSourceComponent = this.target; // fallback is the img tag
                for (var i = 0; i < childComponents.length; i++) {
                    var component = childComponents.models[i];
                    // if the trait name matches the data-type, it is our source element
                    if (component.attributes.tagName == 'source' && component.attributes.attributes['data-type'] == this.model.attributes.name) {
                        inputSourceComponent = component;
                    }
                }
                // change the input's target to its source element
                this.target = inputSourceComponent;

                // We need to convert this image url into 3 values
                // value1 is used for the HTML and saved in the content asset
                // value2 is set in the input for the user to see
                // value3 is used in the canvas to display the image correctly

                // value1: the original image url, absolute to local sandbox
                var image;
                if (this.model.attributes.name == 'defaultimage') {
                    if (isBlockComponent) {
                        image = childComponents.models[3].attributes['src'];
                    } else {
                        image = inputSourceComponent.view.$el[0]['src'] || inputSourceComponent.attributes.attributes['src'];
                    }
                } else {
                    image = inputSourceComponent.view.$el[0]['srcset'] || inputSourceComponent.attributes.attributes['srcset'];
                }

                // fallback to actual value for non-SFCC absolute URLs
                var slicedUrl = image;
                var imagePath = image;

                // value2: slicedUrl for the input
                // need to convert the absolute URL to content asset syntax for the HTML and relative URL for the canvas
                if (slicedUrl && slicedUrl.indexOf('demandware') > -1 && image.indexOf('images/') > -1) {
                    slicedUrl = image.slice(image.indexOf('images/'));
                     // value3: content asset syntax
                    imagePath = slicedUrl + '?$staticlink$';
                }

                // update the component model attributes to use the content asset syntax
                // ensure the view still gets the initial image URL (value3)
                if (this.model.attributes.name == 'defaultimage') {
                    inputSourceComponent.view.$el[0]['src'] = image;
                    inputSourceComponent.attributes.attributes.src = imagePath;
                } else {
                    inputSourceComponent.view.$el[0]['srcset'] = image;
                    inputSourceComponent.attributes.attributes.srcset = imagePath;
                }
                // assign the relative URL to the input
                input.value = slicedUrl;

                this.inputEl = input;

                // create image picker button
                var button = document.createElement('button');
                button.innerHTML = 'Select';
                this.$el.append(button);

                // get hijacked modal value by setting up own click handler
                this.launchImagePicker(this, inputSourceComponent, input, button);

            }
            return this.inputEl;
        },

        onValueChange: function () {
            // update the srcset value in the source component
            // include the values for the other base attr so they are not overwritten
            this.target.setAttributes({
                'srcset': this.model.get('value'), // new value
                'media': this.target.attributes.attributes['media'],
                'data-type': this.target.attributes.attributes['data-type']
            });
        },

        updateAllImages: function () {
            const components = this.parent().components();
            var defaultImageHref = this.getTrait('defaultimage').target.attributes.attributes.src;
            for (var i = 0; i < components.length; i++) {
                var component = components.models[i];
                if (component.attributes.tagName == 'source') {
                    component.setAttributes({
                        'srcset': defaultImageHref, // new value
                        'media': component.attributes.attributes['media'],
                        'data-type': component.attributes.attributes['data-type']
                    });
                }
            }
        },

        /**
         * @description Custom handling of image selection using Business Manager content library modal
         * @param {object} trait The trait being modified
         * @param {object} target The component the trait modifies
         * @param {object} input  The trait input element
         */
        launchImagePicker: function launchPicker(trait, target, input, button) {
            var trait = trait.model;
            var comp = target;
            var staticURL = $('[data-urlprefix]').data('urlprefix') + '/';
            var image;

            // launch the modal when the user puts focus in the trait input
            $(button).on('click', function(e) {
                var innerContent = $('#file-browser-modal .modal-content').clone();
                window.editor.Modal.setContent(innerContent).open();

                if (window.editor.Modal.isOpen()) {

                    $('.gjs-mdl-content #file-browser').on('load', function () {
                        var contents = $('#file-browser').contents();
                        // remove modal components/actions we do not need/want
                        contents.find('#bm_header_row, #bm-breadcrumb, .backbar_left').remove();

                        // remove the inline click event(s)
                        contents.find('.table_detail_link:not(.directoryLink)').removeAttr('href').removeAttr('onclick');

                        // add our own click event to snag the src url
                        contents.on('click','.table_detail_link:not(.directoryLink)', function (e) {
                            e.preventDefault();
                            image = $(this).closest('tr').find('td:nth-child(2)').find('img').attr('src');
                            input.value = image;
                            $(input).trigger('blur');
                            window.editor.Modal.close();
                        });
                    })
                }
            });

            // handle direct input changes
            $(input).on('blur', function(e) {
                image = input.value;
                parseImageURLs(image);
            });

            function parseImageURLs() {
                image = image.split('?')[0];
                image = image.indexOf('demandware') > -1 ? image : staticURL + image;
                // generate content asset syntax
                var inputPath = image.slice(image.indexOf('images/'));
                // make doubly sure the stripped down path is in the input
                input.value = inputPath;
                var assetPath = inputPath + '?$staticlink$';
                // update the component model attributes
                if (trait.attributes.name == 'defaultimage') {
                    comp.setAttributes({
                        'src': assetPath, // for img tag
                        'alt': comp.attributes.attributes['alt'], // assign own value so it is not removed
                        'data-type': comp.attributes.attributes['data-type']
                    });
                    // update the view
                    comp.view.$el[0].attributes['src'].nodeValue = image;
                } else {
                    comp.setAttributes({
                        'srcset': assetPath, // new value
                        'media': comp.attributes.attributes['media'], // assign own value so it is not removed
                        'data-type': comp.attributes.attributes['data-type']
                    });
                    // update the view
                    comp.view.$el[0]['srcset'] = image;
                }

                // change the viewport to reflect the most recently changed image
                if (trait.attributes.name == 'desktopimage') {
                    window.editor.setDevice('Extra Large');
                    $('.gjs-pn-devices-buttons .gjs-pn-btn').removeClass('gjs-pn-active gjs-four-color');
                    $('[title="Extra Large"]').addClass('gjs-pn-active gjs-four-color');
                } else if (trait.attributes.name == 'tabletimage') {
                    window.editor.setDevice('Medium');
                    $('.gjs-pn-devices-buttons .gjs-pn-btn').removeClass('gjs-pn-active gjs-four-color');
                    $('[title="Medium"]').addClass('gjs-pn-active gjs-four-color');
                } else if (trait.attributes.name == 'mobileimage' || trait.attributes.name == 'defaultimage') {
                    window.editor.setDevice('Extra Small');
                    $('.gjs-pn-devices-buttons .gjs-pn-btn').removeClass('gjs-pn-active gjs-four-color');
                    $('[title="Extra Small"]').addClass('gjs-pn-active gjs-four-color');
                }
            }
        }
    });
}
