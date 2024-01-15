'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./product/quickView'));
    processInclude(require('org_ma/product/compare'));
    processInclude(require('./search/search'));
    processInclude(require('./dealer/dealerInventory'));
});
