export default (editor, configs = {}) => {
    editor.Panels.addButton('options', [{
        id: 'redo',
        className: 'fa fa-share',
        command: function (editor) {
            const um = editor.UndoManager;
            um.redo();
        },
        attributes: {
            title: 'Redo Last Change'
        }
    }]);
}
