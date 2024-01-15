import _ from 'underscore';

import loadImagePicker from './image_picker';
import loadSelect from './class_select';
import loadHeroPositionElement from './hero_position_element';
import loadHeroOverlayPositionElement from './hero_overlay_position_element';
import loadAttributeOptions from './attribute_select';
import loadAttributeTextOptions from './attribute_text';

export default (editor, config = {}) => {
    loadImagePicker(editor, config);
    loadSelect(editor, config);
    loadHeroPositionElement(editor, config);
    loadHeroOverlayPositionElement(editor, config);
    loadAttributeOptions(editor, config);
    loadAttributeTextOptions(editor, config);
}
