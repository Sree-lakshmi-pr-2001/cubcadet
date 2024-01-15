'use strict';

var base = module.superModule;

/**
 * @description Get selected custom template for blogContent
 *
 * @param {dw.content.Content} apiContent Content object
 * @returns {?string} blogArticleTemplate - article template
 */
base.getPostedTemplate = function (apiContent) {
    var blogArticleTemplate;
    if (apiContent.custom.blogArticleTemplate.value !== null && apiContent.custom.blogArticleTemplate.value !== '') {
        blogArticleTemplate = apiContent.custom.blogArticleTemplate;
    }

    return blogArticleTemplate;
};

/**
 * @description Get the Work time
 *
 * @param {dw.content.Content} apiContent Content object
 * @returns {string} instructionTime - the time for current work
 */
base.getInstructionTime = function (apiContent) {
    var instructionTime;
    if (apiContent.custom.time !== null && apiContent.custom.time !== '') {
        instructionTime = apiContent.custom.time;
    }

    return instructionTime;
};

/**
 * @description Get the Work time
 *
 * @param {dw.content.Content} apiContent Content object
 * @returns {string} getDifficulty - the time for current work
 */
base.getDifficulty = function (apiContent) {
    var getDifficulty;
    if (apiContent.custom.difficulty !== null && apiContent.custom.difficulty !== '') {
        getDifficulty = apiContent.custom.difficulty;
    }

    return getDifficulty;
};

/**
 * @description Get the Tools List
 *
 * @param {dw.content.Content} apiContent Content object
 * @returns {string} getDifficulty - get tools list
 */
base.getToolsList = function (apiContent) {
    var getToolsList;
    if (apiContent.custom.tools !== null && apiContent.custom.tools !== '') {
        getToolsList = apiContent.custom.tools;
    }

    return getToolsList;
};

module.exports = base;
