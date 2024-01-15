'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./search/search'));
    processInclude(require('./product/quickView'));
    processInclude(require('plugin_productcompare/product/compare'));
});
