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
        this.classificationFolder = contentValue.classificationFolder;
        this.breadcrumbs = blogHelpers.getBreadcrumbs(contentValue.classificationFolder);
        this.postedDate = blogHelpers.getPostedDate(contentValue);
        this.relatedProducts = blogHelpers.getRelatedProducts(contentValue);
        this.relatedContent = blogHelpers.getRelatedContent(contentValue);
        this.image = contentValue.custom.image;
        this.video = contentValue.custom.video;
        this.tags = contentValue.custom.tags;

        // unless we set a custom template we use the standard blog template for all posts
        if (!contentValue.template) {
            this.template = 'content/blogPostPage';
        }
    }
}

module.exports = content;
