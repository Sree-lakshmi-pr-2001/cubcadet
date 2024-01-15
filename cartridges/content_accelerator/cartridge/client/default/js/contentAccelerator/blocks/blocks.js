import _ from 'underscore';

import loadCardBlock from './custom/lyonscg_card';
import loadHeroBlock from './custom/lyonscg_hero';

export default (editor, config = {}) => {
    // TODO use pluginConfigs to load these
    let blocks = config.lyonscgPluginConfigs.default_blocks;
    let cat = config.lyonscgPluginConfigs.default_categories;

    // load plugin merchandizer blocks
    if (cat.custom) {
        if (blocks.card) {
            loadCardBlock(editor, config);
        }

        if (blocks.hero) {
            loadHeroBlock(editor, config);
        }
    }

    // @TODO: convert these and handle pluginConfigs

    // load plugin developer blocks
    // Layout + Columns
    require('./layout/container');
    require('./layout/twoColumn');
    require('./layout/threeColumn');
    require('./layout/ctaContainer');

    // Basic Tools
    require('./basic_tools/text');
    // require('./basic_tools/button');
    require('./basic_tools/link');
    // require('./basic_tools/image');
    // require('./basic_tools/responsive_image');

}
