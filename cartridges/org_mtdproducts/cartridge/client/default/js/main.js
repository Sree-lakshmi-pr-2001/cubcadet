window.jQuery = window.$ = require('jquery');
window.headerNav = require('./components/header');
var processInclude = require('base/util');
// var tagManager = require('int_googletags/tagManager');

$(document).ready(function () {
    // tagManager.init(window.pageContext.ns);
    processInclude(require('./components/search'));
    processInclude(require('./components/carousel'));
});

require('./thirdParty/bootstrap');
require('base/components/spinner');
