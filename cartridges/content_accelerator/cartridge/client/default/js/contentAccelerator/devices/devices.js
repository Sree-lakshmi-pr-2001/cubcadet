/**
 * taken from
 * https://github.com/kaoz70/grapesjs-blocks-bootstrap4
 */
export default (editor, config = {}) => {
    const c = config;
    const deviceManager = editor.DeviceManager;

    // update device button class on active
    // TODO: find the grapesjs way of doing this
    var activeDeviceClass = function activeDeviceClass() {
        $('.gjs-pn-devices-buttons .gjs-pn-btn').on('click', function () {
            $('.gjs-pn-devices-buttons .gjs-pn-btn').removeClass('gjs-pn-active gjs-four-color');
            $(this).addClass('gjs-pn-active gjs-four-color');
        })
    }

    if (c.gridDevices) {
        // set widths for canvas
        deviceManager.add('Extra Small', '320px');
        deviceManager.add('Small', c.lyonscgPluginConfigs.viewports.sm);
        deviceManager.add('Medium', c.lyonscgPluginConfigs.viewports.md);
        deviceManager.add('Large', c.lyonscgPluginConfigs.viewports.lg);
        deviceManager.add('Extra Large', '100%');

        if (c.gridDevicesPanel) {
            const panels = editor.Panels;
            const commands = editor.Commands;
            var panelDevices = panels.addPanel({id: 'devices-buttons'});
            var deviceBtns = panelDevices.get('buttons');

            deviceBtns.add([{
                id: 'deviceXl',
                command: 'set-device-xl',
                className: 'fa fa-desktop gjs-pn-active gjs-four-color',
                text: 'XL',
                attributes: {'title': 'Extra Large'},
                active: 1
            },{
                id: 'deviceLg',
                command: 'set-device-lg',
                className: 'fa fa-tablet rotate-90',
                attributes: {'title': 'Large'}
            },{
                id: 'deviceMd',
                command: 'set-device-md',
                className: 'fa fa-tablet',
                attributes: {'title': 'Medium'}
            },{
                id: 'deviceSm',
                command: 'set-device-sm',
                className: 'fa fa-mobile rotate-90',
                attributes: {'title': 'Small'}
            },{
                id: 'deviceXs',
                command: 'set-device-xs',
                className: 'fa fa-mobile',
                attributes: {'title': 'Extra Small'}
            }]);

            commands.add('set-device-xs', {
                run: function(editor) {
                    editor.setDevice('Extra Small');
                    activeDeviceClass();
                }
            });
            commands.add('set-device-sm', {
                run: function(editor) {
                    editor.setDevice('Small');
                    activeDeviceClass();
                }
            });
            commands.add('set-device-md', {
                run: function(editor) {
                    editor.setDevice('Medium');
                    activeDeviceClass();
                }
            });
            commands.add('set-device-lg', {
                run: function(editor) {
                    editor.setDevice('Large');
                    activeDeviceClass();
                }
            });
            commands.add('set-device-xl', {
                run: function(editor) {
                    editor.setDevice('Extra Large');
                    activeDeviceClass();
                }
            });
        }
    }
}
