'use strict';

var base = module.superModule;
/**
 * Represents content model
 * @param  {dw.content.Content} contentValue - result of ContentMgr.getContent call
 * @param  {string} renderingTemplate - rendering template for the given content
 * @return {void}
 * @constructor
 */
function content(contentValue, renderingTemplate) {
    base.call(this, contentValue, renderingTemplate);

    // Get folder IDs
    this.folderIds = [];
    for (var i = 0, l = contentValue.folders.size(); i < l; i++) {
        var folder = contentValue.folders[i];
        this.folderIds.push(folder.ID);
    }

    return this;
}

module.exports = content;
