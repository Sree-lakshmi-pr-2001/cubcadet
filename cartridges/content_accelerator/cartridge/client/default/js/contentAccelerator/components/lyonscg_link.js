import _ from 'underscore';
import _s from 'underscore.string';

export default (editor, configs = {}) => {
    var domc = editor.DomComponents;
    var dType = domc.getType('link');
    var dModel = dType.model;
    var dView = dType.view;

    var ctaTypes = configs.lyonscgConfigs.ctaTypes;
    var ctaSizes = configs.lyonscgConfigs.ctaSizes;
    var urlTypes = configs.lyonscgConfigs.urlTypes;
    var urlTargets = configs.lyonscgConfigs.urlTargets;
    var ctaLayout = configs.lyonscgConfigs.ctaLayout;

    domc.addType('link', {

        model: dModel.extend({

            defaults: Object.assign({}, dModel.prototype.defaults, {
                traits: [
                    {
                        type: 'class_select',
                        label: 'CTA Type',
                        name: 'ctaType',
                        options: ctaTypes,
                        changeProp: 1
                    },
                    {
                        type: 'class_select',
                        label: 'CTA Size',
                        name: 'ctaSize',
                        options: ctaSizes,
                        changeProp: 1
                    },
                    {
                        type: 'class_select',
                        label: 'CTA Layout',
                        name: 'ctaLayout',
                        options: ctaLayout,
                        changeProp: 1
                    },
                    {
                        type: 'attribute_select',
                        attribute: 'href',
                        label: 'URL Type',
                        name: 'urlType',
                        options: urlTypes,
                        changeProp: 1
                    },
                    {
                        type: 'attribute_text',
                        attribute: 'href',
                        label: 'URL Location',
                        name: 'href',
                        changeProp: 1
                    },
                    {
                        type: 'attribute_select',
                        attribute: 'target',
                        label: 'URL Target',
                        name: 'urlTarget',
                        options: urlTargets,
                        changeProp: 1
                    },
                    {
                        type: 'attribute_text',
                        attribute: 'title',
                        label: 'URL Title',
                        name: 'urlTitle',
                        changeProp: 1
                    }
                ],
            }),
            init() {
                //this.listenTo(this, '[change:urlType, change:href]', this.updateHref());
            },
            isComponent: function (el) {
                if (el.tagName == 'A') {
                    return { type: 'link' };
                }
            }
        }),
        view: dView.extend({
            onRender() {
                // handle URLs converted to absolute
                var hrefAttr = this.model.attributes.attributes.href;
                var isModalLink = false;
                // special handling for modal links without hrefs
                if (!hrefAttr && this.model.attributes.attributes['data-link']) {
                    hrefAttr =  this.model.attributes.attributes['data-link'];
                    isModalLink = true;
                }
                // check if we need to handle it
                if (hrefAttr && hrefAttr.indexOf('demandware') > -1) {
                    var urlLocation;
                    var urlType;
                    var url = hrefAttr;

                    // create the content asset syntax
                    // update the html
                    if (hrefAttr.indexOf('cgid') > -1) {
                        urlType = 'category';
                        urlLocation = hrefAttr.slice(hrefAttr.indexOf('cgid') + 5);
                        url = `$url(\'Search-Show\', \'cgid\', \'${urlLocation}\')$`;
                    } else if (hrefAttr.indexOf('pid') > -1) {
                        urlType = 'product';
                        urlLocation = hrefAttr.slice(hrefAttr.indexOf('pid') + 4);
                        url = `$url(\'Product-Show\', \'pid\', \'${urlLocation}\')$`;
                    } else if (hrefAttr.indexOf('cid')) {
                        urlType = 'content';
                        urlLocation = hrefAttr.slice(hrefAttr.indexOf('cid') + 4);
                        url = `$url(\'Page-Show\', \'cid\', \'${urlLocation}\')$`;
                    } else if (hrefAttr.indexOf('q')) {
                        urlType = 'search';
                        urlLocation = hrefAttr.slice(hrefAttr.indexOf('q') + 2);
                        url = `$url(\'Search-Show\', \'q\', \'${urlLocation}\')$`;
                    } else {
                        urlType = 'absolute';
                    }

                } else {
                    urlType = 'absolute';
                    url = hrefAttr;
                }

                // set the content asset syntax in the markup if this is not a Block element
                if (this.$el[0].text === 'Link') {
                    // todo
                } else {
                    if (this.attr.href) {
                        if (!isModalLink) {
                            this.$el[0].attributes.href.value = url;
                            this.el.attributes.href.value = url;
                            this.attr.href = url;
                            this.model.attributes.attributes.href = url;
                        } else {
                            this.$el[0].attributes['data-link'].value = url;
                            this.el.attributes['data-link'] = url;
                            this.attr['data-link'] = url;
                            this.model.attributes.attributes['data-link'] = url;
                        }
                    }
                }
            }
        })
    });
}
