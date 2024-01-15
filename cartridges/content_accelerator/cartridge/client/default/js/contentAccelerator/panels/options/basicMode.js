export default (editor, configs = {}) => {
    editor.Panels.addButton('options', [{
        id: 'basic',
        className: 'fa fas fa-star',
        command: function () {
            window.location = window.location.href.split('?advancedMode')[0];
        },
        attributes: {
            title: 'Enable Basic Mode'
        }
    }]);

}
