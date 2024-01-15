window.jQuery = window.$ = require('jquery');
var processInclude = require('base/util');
var tagManager = require('int_googletags/tagManager');

$(document).ready(function () {
    tagManager.init(window.pageContext.ns);
    processInclude(require('./components/menu'));
    processInclude(require('base/components/cookie'));
    processInclude(require('org/components/consentTracking'));
    processInclude(require('lyonscg/components/footer'));
    processInclude(require('./components/backtotop'));
    processInclude(require('./components/quantity'));
    processInclude(require('./components/miniCart'));
    processInclude(require('base/components/collapsibleItem'));
    processInclude(require('./components/search'));
    processInclude(require('lyonscg/components/modal'));
    processInclude(require('./components/clientSideValidation'));
    processInclude(require('./components/countrySelector'));
    processInclude(require('./components/carousels'));
    processInclude(require('./components/devicedetect'));
    processInclude(require('./components/emailSignUp'));
    processInclude(require('lyonscg/components/tooltips'));
    processInclude(require('int_ari/ari/ari'));
    processInclude(require('int_financing_app/financing/application'));
    processInclude(require('./components/contentHandlers'));
    processInclude(require('./components/liveChatHandler'));
    processInclude(require('org/components/formHandler'));
});

require('org/thirdParty/bootstrap');
require('base/components/spinner');
require('svg4everybody');
require('org/slick');
require('picturefill');
