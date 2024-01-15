export default (editor, configs = {}) => {
    var domc = editor.DomComponents;
    var dType = domc.getType('text');
    var dModel = dType.model;
    var dView = dType.view;

    var textTypes = configs.lyonscgConfigs.textTypes;
    var textCases = configs.lyonscgConfigs.textCases;
    var colors = configs.lyonscgConfigs.textColors;
    var underlines = configs.lyonscgConfigs.headingLines;

    domc.addType('text', {

        model: dModel.extend({

            defaults: Object.assign({}, dModel.prototype.defaults, {
                traits: [
                    {
                        type: 'class_select',
                        label: 'Text Type',
                        name: 'textType',
                        options: textTypes,
                        changeProp: 1
                    },
                    {
                        type: 'class_select',
                        label: 'Color',
                        name: 'color',
                        options: colors,
                        changeProp: 1
                    },
                    {
                        type: 'class_select',
                        label: 'Text Case',
                        name: 'textCase',
                        options: textCases,
                        changeProp: 1
                    },
                    {
                        type: 'class_select',
                        label: 'Text Underline',
                        name: 'textUnderline',
                        options: underlines,
                        changeProp: 1
                    },
                    'title'
                ],
            })
        }),
        view: dView
    });
}
