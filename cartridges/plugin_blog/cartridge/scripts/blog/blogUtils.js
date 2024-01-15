'use strict';

/**
 * @description iterate over the content search posts array, find the current post and return object with previous and next post id that used
 *    on post page navigation
 * @param {dw/content/ContentSearchResult} ContentSearchResult - search model object
 * @param {dw/content/Content} currentPost - Content current content asset id(current post)
 * @return {Object} returnObject - return object of post pagination
 * */
function getPaginationPosts(ContentSearchResult, currentPost) {
    var returnObject = {
        prev: null,
        next: null
    };
    var postsList = ContentSearchResult.getContent().asList();
    for (var i = 0; i < postsList.length; i++) {
        var postFromList = postsList[i];
        if (postFromList.ID === currentPost.ID) {
            returnObject = {
                prev: (i !== 0) ? postsList[i - 1] : null,
                next: (i !== postsList.length - 1) ? postsList[i + 1] : null
            };
        }
    }
    return returnObject;
}

exports.getPaginationPosts = getPaginationPosts;
