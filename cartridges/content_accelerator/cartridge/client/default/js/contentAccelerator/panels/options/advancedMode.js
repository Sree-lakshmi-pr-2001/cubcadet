export default (editor, configs = {}) => {
    editor.Panels.addButton('options', [{
        id: 'advanced',
        className: 'fa far fa-star',
        command: function (editor) {
            const blockManager = editor.BlockManager;
            const blocks = blockManager.getAll();
            const templates = blocks.filter((block) => block.get('category') == 'Templates');
            blockManager.render(templates);
        },
        attributes: {
            title: 'Enable Advanced Mode'
        }
    }]);
}
