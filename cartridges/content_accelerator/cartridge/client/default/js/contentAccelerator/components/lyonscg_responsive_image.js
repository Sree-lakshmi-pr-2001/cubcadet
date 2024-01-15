import _ from 'underscore';
import _s from 'underscore.string';

export default (editor, configs = {}) => {

  const domc = editor.DomComponents;
  var imageType = domc.getType('image');
  var defaultType = domc.getType('default');

  const img_src_default_mobile = configs.lyonscgConfigs.img_src_default_mobile;
  const img_src_default_tablet = configs.lyonscgConfigs.img_src_default_tablet;
  const img_src_default_desktop = configs.lyonscgConfigs.img_src_default_desktop;

  domc.addType('responsive_image', {
    model: defaultType.model.extend({
      defaults: Object.assign({}, defaultType.model.prototype.defaults, {
        'custom-name': 'Responsive Image',
        tagName: 'picture',
        droppable: false, // nothing can be dropped into this component
        resizable: 1,
        selectable: 1,
        traits: [
          {
            type: 'image_picker',
            label: 'Desktop',
            name: 'desktopimage',
            title: 'desktop',
            changeProp: 1
          },
          {
            type: 'image_picker',
            label: 'tablet',
            name: 'tabletimage',
            title: 'tablet',
            changeProp: 1
          },
          {
            type: 'image_picker',
            label: 'mobile',
            name: 'mobileimage',
            title: 'mobile',
            changeProp: 1
          },
          {
            type: 'image_picker',
            label: 'Fallback',
            name: 'defaultimage', // updates img tag src
            title: 'default fallback',
            changeProp: 1
          },
          {
            type: 'checkbox',
            label: 'Use Fallback for All',
            name: 'changeall',
            changeProp: 1
          }
        ].concat(imageType.model.prototype.defaults.traits) // adds alt trait
      }),
    init2() {
        // if the Use Fallback for All checkbox is checked, replace all images with the fallback image
        this.listenTo(this, 'change:changeall', function () {
            if (this.changed.changeall) {
                var components = this.get('tagName') === 'picture' ? this.components() : this.parent().components();
                var defaultImageHrefInput = this.getTrait('defaultimage').el.value + '?$staticlink$';
                var defaultImageHrefView = components.models[3].view.$el[0].src;

                // remove ?$staticlink$ from path
                var image = defaultImageHrefInput.split('?')[0];
                // generate content asset syntax
                for (var i = 0; i < components.length; i++) {
                    var component = components.models[i];
                    if (component.attributes.tagName == 'source') {
                        component.setAttributes({
                            'srcset': defaultImageHrefInput, // new value
                            'media': component.attributes.attributes['media'],
                            'data-type': component.attributes.attributes['data-type']
                        });
                        // update the Canvas/view with the local sandbox URL
                        component.view.$el[0].attributes['srcset'].nodeValue = defaultImageHrefView;
                        // update the input panel with the local value
                        var trait = this.getTrait(component.attributes.attributes['data-type']).view.elInput;
                        trait.value = image;
                    }
                }
            }
        });
        if (this.get('tagName') === 'picture' && this.components().length == 0) {
            // Build inner components

                let comp_children = this.components();

                comp_children.add({
                    type: 'responsive_image_source',
                    tagName: 'source',
                    attributes: {
                        srcset: img_src_default_mobile,
                        media: '(min-width: 1025px)',
                        'data-type' : 'desktopimage',
                        selectable: false
                    }
                });

                comp_children.add({
                    type: 'responsive_image_source',
                    tagName: 'source',
                    attributes: {
                        srcset: img_src_default_mobile,
                        media: '(min-width: 768px)',
                        'data-type' : 'tabletimage',
                        selectable: false
                    }
                });

                comp_children.add({
                    type: 'responsive_image_source',
                    tagName: 'source',
                    attributes: {
                        srcset: img_src_default_mobile,
                        media: '(max-width: 677px)',
                        'data-type' : 'mobileimage',
                        selectable: false
                    }
                });

                comp_children.add({
                    type: 'responsive_image_img',
                    tagName: 'img',
                    alt: '',
                    attributes: {
                        src: img_src_default_mobile,
                        'data-type' : 'defaultimage',
                        selectable: false
                    }
                });
            }
        }
    }, {
      isComponent: function(el) {
        // if we are in a picture tag, no matter what child component, return this type
        if(el && el.tagName == 'PICTURE' && el.firstChild.tagName == 'SOURCE'
            || el.tagName == 'IMG' && el.parentElement.tagName == 'PICTURE'
            || el.tagName == 'SOURCE' && el.parentElement.tagName == 'PICTURE') {
                // add in data if doesn't already exist
                if (el && el.tagName == 'SOURCE') {
                    var parent = el.parentElement;
                    var sourceTags = parent.getElementsByTagName('SOURCE');
                    var imgTag = parent.getElementsByTagName('IMG');
                    imgTag[0].setAttribute('data-type', 'defaultimage');
                    if (sourceTags.length === 3) {
                        sourceTags[0].setAttribute('data-type', 'desktopimage');
                        sourceTags[1].setAttribute('data-type', 'tabletimage');
                        sourceTags[2].setAttribute('data-type', 'mobileimage');
                    } else if (sourceTags.length == 2) {
                        sourceTags[0].setAttribute('data-type', 'desktopimage');
                        sourceTags[1].setAttribute('data-type', 'mobileimage');
                    }
                }
          return {type: 'responsive_image'};
        }
      }
    }),
    // Custom markup for the tag
    toHTML: function () {
        return `
        <picture>
            <source media="(min-width: 1025px)" srcset="${img_src_default_desktop}" data-type="desktopimage">
            <source media="(min-width: 768px)" srcset="${img_src_default_tablet}" data-type="tabletimage">
            <source media="(max-width: 767px)" srcset="${img_src_default_mobile}" data-type="mobileimage">
            <img data-type="defaultimage" class="img-fluid" alt="" src="${img_src_default_mobile}">
        </picture>
        `;
    },
    view: defaultType.view.extend({
        events: {
            click: 'changeTarget'
        },
        onRender() {
            // reset the image URLs to ensure proper content asset syntax
            // We need to convert this image url into 3 values:
            // value1 is used for the HTML and saved in the content asset
            // value2 is set in the input for the user to see
            // value3 is used in the canvas - an absolute url - to display the image correctly

            if (this.el.nodeName === 'PICTURE' || this.el.parentElement && this.el.parentElement.nodeName == 'PICTURE') {
                var childComponents = this.model.attributes.components;

                for (var i = 0; i < childComponents.length; i++) {
                    var component = childComponents.models[i];

                    // value1: the original image url, absolute to local sandbox
                    var image;
                    var isDefaultImage = component.attributes.attributes['data-type'] == 'defaultimage';
                    if (isDefaultImage) {
                        image = component.attributes.attributes['src'];
                    } else {
                        image = component.attributes.attributes['srcset'];
                    }

                    // fallback to actual value for non-SFCC absolute URLs
                    var slicedUrl = image;
                    var imagePath = image;

                    // value2: slicedUrl for the input
                    // need to convert the absolute URL to content asset syntax for the HTML and relative URL for the canvas
                    if (slicedUrl && slicedUrl.indexOf('demandware') > 0) {
                        slicedUrl = image.slice(image.indexOf('images/'));
                        // value3: content asset syntax
                        imagePath = slicedUrl + '?$staticlink$';
                    }

                    // update the component model attributes to use the content asset syntax
                    // ensure the view still gets the initial image URL
                    if (isDefaultImage) {
                        component.view.$el[0]['src'] = image;
                        component.attributes.attributes.src = imagePath;
                    } else {
                        component.view.$el[0]['srcset'] = image;
                        component.attributes.attributes.srcset = imagePath;
                    }
                }
            }
        }
    }),
    changeTarget: function() {
        this.target = this.target.components().models[3];
    }
  });

    domc.addType('responsive_image_source', {
        model: defaultType.model.extend({
        defaults: Object.assign({}, defaultType.model.prototype.defaults, {
            'custom-name': 'responsive_image_source',
            tagName: 'source',
            selectable: 0,
            attributes: {
                srcset: img_src_default_mobile,
                media: '',
                'data-type' : 'desktopimage'
            }
        })
        }, {
        isComponent: function(el) {
            if(el && el.tagName == 'SOURCE' && el.parentElement.tagName == 'PICTURE') {
                var parent = el.parentElement;
                var sourceTags = parent.getElementsByTagName('SOURCE');
                var imgTag = parent.getElementsByTagName('IMG');
                imgTag[0].setAttribute('data-type', 'defaultimage');
                if (sourceTags.length === 3) {
                    sourceTags[0].setAttribute('data-type', 'desktopimage');
                    sourceTags[1].setAttribute('data-type', 'tabletimage');
                    sourceTags[2].setAttribute('data-type', 'mobileimage');
                } else if (sourceTags.length == 2) {
                    sourceTags[0].setAttribute('data-type', 'desktopimage');
                    sourceTags[1].setAttribute('data-type', 'mobileimage');
                }

            return {type: 'responsive_image_source'};
            }
        }
        })
    });

    domc.addType('responsive_image_img', {
        model: imageType.model.extend({
            defaults: Object.assign({}, imageType.model.prototype.defaults, {
                'custom-name': 'responsive_image_img',
                tagName: 'img',
                selectable: 0,
                removable: 0,
                attributes: {
                    src: img_src_default_mobile,
                    'data-type' : 'defaultimage',
                    alt: ''
                }
            })
            }, {
            isComponent: function(el) {
                if (el && el.tagName == 'IMG' && el.parentElement.tagName == 'PICTURE') {
                    var parent = el.parentElement;
                    var sourceTags = parent.getElementsByTagName('SOURCE');
                    var imgTag = parent.getElementsByTagName('IMG');
                    imgTag[0].setAttribute('data-type', 'defaultimage');
                    if (sourceTags.length === 3) {
                        sourceTags[0].setAttribute('data-type', 'desktopimage');
                        sourceTags[1].setAttribute('data-type', 'tabletimage');
                        sourceTags[2].setAttribute('data-type', 'mobileimage');
                    } else if (sourceTags.length == 2) {
                        sourceTags[0].setAttribute('data-type', 'desktopimage');
                        sourceTags[1].setAttribute('data-type', 'mobileimage');
                    }
                    return {type: 'responsive_image'};
                }
            }
        })
    });
}
