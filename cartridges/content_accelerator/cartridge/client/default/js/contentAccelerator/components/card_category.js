import _ from 'underscore';
import _s from 'underscore.string';

export default (editor, config = {}) => {
  const domc = editor.DomComponents;
  const defaultType = domc.getType('default');
  const defaultModel = defaultType.model;
  const defaultView = defaultType.view;

  var imageType = domc.getType('image');
  var imageModel = imageType.model;
  var imageView = imageType.view;

  domc.addType('cardCategory', {
    model: defaultModel.extend({
        defaults: Object.assign({}, defaultModel.prototype.defaults, {
        'custom-name': 'CardCategory',
        classes: ['card card-category somethingnew', 'new'],
        traits: [
            {
            type: 'checkbox',
            label: 'Image Top',
            name: 'card-img-top',
            changeProp: 1
            },
            {
            type: 'checkbox',
            label: 'Header',
            name: 'card-header',
            changeProp: 1
            },
            {
            type: 'checkbox',
            label: 'Image',
            name: 'card-img',
            changeProp: 1
            },
            {
            type: 'checkbox',
            label: 'Image Overlay',
            name: 'card-img-overlay',
            changeProp: 1
            },
            {
            type: 'checkbox',
            label: 'Body',
            name: 'card-body',
            changeProp: 1
            },
            {
            type: 'checkbox',
            label: 'Footer',
            name: 'card-footer',
            changeProp: 1
            },
            {
            type: 'checkbox',
            label: 'Image Bottom',
            name: 'card-img-bottom',
            changeProp: 1
            }
        ].concat(defaultModel.prototype.defaults.traits)
        }),
        init2() {
        this.listenTo(this, 'change:card-img-top', this.cardImageTop);
        this.listenTo(this, 'change:card-header', this.cardHeader);
        this.listenTo(this, 'change:card-img', this.cardImage);
        this.listenTo(this, 'change:card-img-overlay', this.cardImageOverlay);
        this.listenTo(this, 'change:card-body', this.cardBody);
        this.listenTo(this, 'change:card-footer', this.cardFooter);
        this.listenTo(this, 'change:card-img-bottom', this.cardImageBottom);
        this.components().comparator = 'card-order';
        this.set('card-img-top', true);
        this.set('card-body', true);
        },
        cardImageTop() { this.createCardComponent('card-img-top'); },
        cardHeader() { this.createCardComponent('card-header'); },
        cardImage() { this.createCardComponent('card-img'); },
        cardImageOverlay() { this.createCardComponent('card-img-overlay'); },
        cardBody() { this.createCardComponent('card-body'); },
        cardFooter() { this.createCardComponent('card-footer'); },
        cardImageBottom() { this.createCardComponent('card-img-bottom'); },
        createCardComponent(prop) {
        const state = this.get(prop);
        const type = prop.replace(/-/g,'_').replace(/img/g,'image')
        let children = this.components();
        let existing = children.filter(function(comp) {
            return comp.attributes.type == type;
        })[0]; // should only be one of each.

        if(state && !existing) {
            var comp = children.add({
            type: type
            });
            let comp_children = comp.components();
            if(prop=='card-header') {
            comp_children.add({
                type: 'header',
                tagName: 'h4',
                style: { 'margin-bottom': '0px' },
                content: 'Card Header'
            });
            }
            if(prop=='card-img-overlay') {
            comp_children.add({
                type: 'header',
                tagName: 'h4',
                classes: ['card-title'],
                content: 'Card title'
            });
            comp_children.add({
                type: 'text',
                tagName: 'p',
                classes: ['card-text'],
                content: "Some quick example text to build on the card title and make up the bulk of the card's content."
            });
            }
            if(prop=='card-body') {
            comp_children.add({
                type: 'header',
                tagName: 'h4',
                classes: ['card-title'],
                content: 'Card title'
            });
            comp_children.add({
                type: 'header',
                tagName: 'h6',
                classes: ['card-subtitle', 'text-muted', 'mb-2'],
                content: 'Card subtitle'
            });
            comp_children.add({
                type: 'text',
                tagName: 'p',
                classes: ['card-text'],
                content: "Some quick example text to build on the card title and make up the bulk of the card's content."
            });
            comp_children.add({
                type: 'link',
                classes: ['card-link'],
                href: '#',
                content: 'Card link'
            });
            comp_children.add({
                type: 'link',
                classes: ['card-link'],
                href: '#',
                content: 'Another link'
            });
            }
            this.order();
        } else if (!state) {
            existing.destroy();
        }
        },
        order() {

        }
    }, {
        isComponent(el) {
        if(el && el.classList && el.classList.contains('card-card-category') && el.classList.contains('card')) {
            return {type: 'cardCategory'};
        }
        }
    }),
    view: defaultView
    });

}
