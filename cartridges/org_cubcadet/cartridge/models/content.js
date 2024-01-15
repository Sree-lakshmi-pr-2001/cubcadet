'use strict';

var base = module.superModule;
var blogHelpers = require('*/cartridge/scripts/helpers/blogHelpers');

/**
 * Extends base content model with blog functionality
 * @param  {dw.content.Content} contentValue - result of ContentMgr.getContent call
 * @param  {string} renderingTemplate - rendering template for the given content
 * @return {void}
 * @constructor
 */
function content(contentValue, renderingTemplate) {
    base.call(this, contentValue, renderingTemplate);

    if (blogHelpers.isBlogPost(contentValue)) {
        this.instructionTime = blogHelpers.getInstructionTime(contentValue);
        this.difficulty = blogHelpers.getDifficulty(contentValue);
        this.toolsList = blogHelpers.getToolsList(contentValue);
        this.assetDescription = contentValue.description;

        var template = blogHelpers.getPostedTemplate(contentValue);

        // unless we set a custom template we use the standard blog template for all posts
        if (template === undefined || template.value === 'default-template') {
            this.template = 'content/blogPostPage';
        } else {
            this.template = 'content/blogPostPage-' + template.value;
        }
    }
}

module.exports = content;
