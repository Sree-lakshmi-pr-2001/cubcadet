'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./product/quickView'));
    processInclude(require('./product/compare'));
    processInclude(require('plugin_blog/search/search'));
});
