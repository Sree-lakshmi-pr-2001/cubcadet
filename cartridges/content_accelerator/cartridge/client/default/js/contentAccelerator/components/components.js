import _ from 'underscore';
import _s from 'underscore.string';

import loadDefaultComponent from './lyonscg_default';
import loadContainerComponent from './lyonscg_container';
import loadRowComponent from './lyonscg_row';
import loadColumnComponent from './lyonscg_column';
import loadLinkComponent from './lyonscg_link';
import loadTextComponent from './lyonscg_text';
import loadPictureComponent from './lyonscg_responsive_image';
import loadCardComponent from './lyonscg_card';
import loadHeroComponent from './lyonscg_hero';
import loadHeroOverlayComponent from './lyonscg_hero_overlay';

export default (editor, config = {}) => {

    // Load our Custom Default Component to show Custom Traits
    loadDefaultComponent(editor, config);

    // load plugin components
    loadContainerComponent(editor, config); // not using config atm
    loadRowComponent(editor);
    loadColumnComponent(editor);
    loadLinkComponent(editor, config);
    loadTextComponent(editor, config);
    loadPictureComponent(editor, config);
    // loadCardComponent(editor, config);
    loadPictureComponent(editor, config);
    loadHeroComponent(editor, config);
    loadHeroOverlayComponent(editor, config);
}
