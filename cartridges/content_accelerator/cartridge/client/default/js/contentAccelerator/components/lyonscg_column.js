/**
 * taken from
 * https://github.com/kaoz70/grapesjs-blocks-bootstrap4
 */
import _ from 'underscore';
import _s from 'underscore.string';

export default (editor = {}) => {
    var domc = editor.DomComponents;
    var defaultType = domc.getType('default');
    var defaultModel = defaultType.model;
    var defaultView = defaultType.view;

    domc.addType('column', {
        model: defaultModel.extend({
            defaults: Object.assign({}, defaultModel.prototype.defaults, {
            'custom-name': 'Column',
            draggable: '.row',
            droppable: true,
            traits: [
                {
                type: 'class_select',
                options: [
                    {value: 'col', name: 'Equal'},
                    {value: 'col-auto', name: 'Variable'},
                    ... [1,2,3,4,5,6,7,8,9,10,11,12].map(function(i) { return {value: 'col-'+i, name: i+'/12'} })
                ],
                label: 'XS Width',
                },
                {
                type: 'class_select',
                options: [
                    {value: '', name: 'None'},
                    {value: 'col-sm', name: 'Equal'},
                    {value: 'col-sm-auto', name: 'Variable'},
                    ... [1,2,3,4,5,6,7,8,9,10,11,12].map(function(i) { return {value: 'col-sm-'+i, name: i+'/12'} })
                ],
                label: 'SM Width',
                },
                {
                type: 'class_select',
                options: [
                    {value: '', name: 'None'},
                    {value: 'col-md', name: 'Equal'},
                    {value: 'col-md-auto', name: 'Variable'},
                    ... [1,2,3,4,5,6,7,8,9,10,11,12].map(function(i) { return {value: 'col-md-'+i, name: i+'/12'} })
                ],
                label: 'MD Width',
                },
                {
                type: 'class_select',
                options: [
                    {value: '', name: 'None'},
                    {value: 'col-lg', name: 'Equal'},
                    {value: 'col-lg-auto', name: 'Variable'},
                    ... [1,2,3,4,5,6,7,8,9,10,11,12].map(function(i) { return {value: 'col-lg-'+i, name: i+'/12'} })
                ],
                label: 'LG Width',
                },
                {
                type: 'class_select',
                options: [
                    {value: '', name: 'None'},
                    {value: 'col-xl', name: 'Equal'},
                    {value: 'col-xl-auto', name: 'Variable'},
                    ... [1,2,3,4,5,6,7,8,9,10,11,12].map(function(i) { return {value: 'col-xl-'+i, name: i+'/12'} })
                ],
                label: 'XL Width',
                },
                {
                type: 'class_select',
                options: [
                    {value: '', name: 'None'},
                    ... [0,1,2,3,4,5,6,7,8,9,10,11,12].map(function(i) { return {value: 'offset-'+i, name: i+'/12'} })
                ],
                label: 'XS Offset',
                },
                {
                type: 'class_select',
                options: [
                    {value: '', name: 'None'},
                    ... [0,1,2,3,4,5,6,7,8,9,10,11,12].map(function(i) { return {value: 'offset-sm-'+i, name: i+'/12'} })
                ],
                label: 'SM Offset',
                },
                {
                type: 'class_select',
                options: [
                    {value: '', name: 'None'},
                    ... [0,1,2,3,4,5,6,7,8,9,10,11,12].map(function(i) { return {value: 'offset-md-'+i, name: i+'/12'} })
                ],
                label: 'MD Offset',
                },
                {
                type: 'class_select',
                options: [
                    {value: '', name: 'None'},
                    ... [0,1,2,3,4,5,6,7,8,9,10,11,12].map(function(i) { return {value: 'offset-lg-'+i, name: i+'/12'} })
                ],
                label: 'LG Offset',
                },
                {
                type: 'class_select',
                options: [
                    {value: '', name: 'None'},
                    ... [0,1,2,3,4,5,6,7,8,9,10,11,12].map(function(i) { return {value: 'offset-xl-'+i, name: i+'/12'} })
                ],
                label: 'XL Offset',
                },
            ].concat(defaultModel.prototype.defaults.traits)
            }),
        }, {
            isComponent(el) {
            let match = false;
            if(el && el.classList) {
                el.classList.forEach(function(klass) {
                if(klass=="col" || klass.match(/^col-/)) {
                    match = true;
                }
                });
            }
            if(match) return {type: 'column'};
            }
        }),
        view: defaultView
        });
}
