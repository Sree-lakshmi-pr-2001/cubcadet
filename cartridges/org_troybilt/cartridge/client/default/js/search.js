'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('plugin_blog/search/search'));
    processInclude(require('org_ma/product/quickView'));
    processInclude(require('org_ma/product/compare'));
});
