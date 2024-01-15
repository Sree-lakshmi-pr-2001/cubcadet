export default (editor, configs = {}) => {
    editor.Panels.addButton('options', [{
        id: 'undo',
        className: 'fa fa-reply',
        command: function (editor) {
            const um = editor.UndoManager;
            um.undo();
        },
        attributes: {
            title: 'Undo Last Change'
        }
    }]);
}
