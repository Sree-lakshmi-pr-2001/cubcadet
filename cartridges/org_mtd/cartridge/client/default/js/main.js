window.jQuery = window.$ = require('jquery');
var processInclude = require('base/util');
var tagManager = require('int_googletags/tagManager');

$(document).ready(function () {
    tagManager.init(window.pageContext.ns);
    processInclude(require('base/components/menu'));
    processInclude(require('base/components/cookie'));
    processInclude(require('./components/consentTracking'));
    processInclude(require('lyonscg/components/footer'));
    processInclude(require('lyonscg/components/backtotop'));
    processInclude(require('./components/quantity'));
    processInclude(require('./components/miniCart'));
    processInclude(require('base/components/collapsibleItem'));
    processInclude(require('./components/search'));
    processInclude(require('lyonscg/components/modal'));
    processInclude(require('lyonscg/components/clientSideValidation'));
    processInclude(require('base/components/countrySelector'));
    processInclude(require('./components/carousels'));
    processInclude(require('lyonscg/components/tooltips'));
    processInclude(require('int_ari/ari/ari'));
    processInclude(require('./components/formHandler'));
});

require('./thirdParty/bootstrap');
require('base/components/spinner');
require('svg4everybody');
require('org/slick');
require('picturefill');
