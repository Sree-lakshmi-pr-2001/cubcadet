/* Custom LYONSCG grapesjs plugin */
'use strict';

import $ from 'jquery';
window.jQuery = window.$ = $;

import 'bootstrap/js/dist/collapse';
import 'bootstrap/js/dist/modal';
import 'bootstrap/js/dist/tab';

import _ from 'underscore';

import loadCommands from './commands/commands';
import loadTraits from './traits/traits';
import loadComponents from './components/components';
import loadBlocks from './blocks/blocks';
import loadDevices from './devices/devices';
import loadPanels from './panels/panels';

// TODO customize styles panel for internal dev;
// this is not visible to merchandizers; default not visible now
// import loadStyles from './styles/styles';

// custom project configs
import lyonscgContentConfigs from './configs/contentConfigs';
import lyonscgPluginConfigs from './configs/pluginConfigs';

grapesjs.plugins.add('lyonscg-content-accelerator', (editor, opts = {}) => {
    console.log('lyonscg-content-accelerator plugin loading')
    window.editor = editor;

    const opts_blocks = opts.blocks || {};
    const opts_labels = opts.labels || {};
    const opts_categories = opts.blockCategories || {};
    delete opts['blocks'];
    delete opts['labels'];
    delete opts['blockCategories'];

    const default_blocks = lyonscgPluginConfigs.default_blocks;
    const default_labels = lyonscgPluginConfigs.default_labels;
    const default_categories = lyonscgPluginConfigs.default_categories;

    let options = { ...{
        blocks: Object.assign(default_blocks, opts_blocks),
        labels: Object.assign(default_labels, opts_labels),
        blockCategories: Object.assign(default_categories, opts_categories),
        gridDevices: true,
        gridDevicesPanel: true, // shows buttons by default
        lyonscgConfigs: lyonscgContentConfigs,
        lyonscgPluginConfigs: lyonscgPluginConfigs
      },  ...opts };

    loadCommands(editor, options);
    loadTraits(editor, options);
    loadComponents(editor, options);
    loadBlocks(editor, options);
    loadDevices(editor, options);
    loadPanels(editor, options);

    // if in advanced mode??
    // loadStyles(editor, options)];
});
