export default (editor, configs = {}) => {
    editor.Panels.addPanel({
        id: 'views',
        visible: true,
        buttons: [
            {
                id: 'open-sm',
                className: 'fa fa-paint-brush',
                command: 'open-sm',
                attributes: {title: 'Open Style Manager'}
            },
            {
                id: 'open-tm',
                className: 'fa fa-cog',
                command: 'open-tm',
                attributes: {title: 'Settings'}
            },
            {
                id: 'open-layers',
                className: 'fa fa-bars',
                command: 'open-layers',
                attributes: {title: 'Open Layer Manager'}
            },
            {
                id: 'open-blocks',
                active: true,
                className: 'fa fa-th-large',
                command: 'open-blocks',
                attributes: {title: 'Open Blocks'}
            }
        ]
    });
}
