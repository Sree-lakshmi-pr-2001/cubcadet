import loadLoadButton from './options/load';
import loadSaveButton from './options/save';
import loadUndoButton from './options/undo';
import loadRedoButton from './options/redo';
import loadViewsPanel from './views';

// need to hook this up for devs vs merchandizers
//import loadModeButton from './options/advancedMode';

export default (editor, config = {}) => {

    // load plugin panel buttons
    loadLoadButton(editor, config);
    loadSaveButton(editor, config);
    loadUndoButton(editor, config);
    loadRedoButton(editor, config);

    // advancedMode toggles the non-templates
    // loadModeButton(editor, config);

    // custom views panel
    loadViewsPanel(editor, config);

}
