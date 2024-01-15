window.jQuery = window.$ = require('jquery');
var processInclude = require('base/util');
var tagManager = require('int_googletags/tagManager');

$(document).ready(function () {
    tagManager.init(window.pageContext.ns);
    processInclude(require('org_ma/components/menu'));
    processInclude(require('base/components/cookie'));
    processInclude(require('org/components/consentTracking'));
    processInclude(require('lyonscg/components/footer'));
    processInclude(require('org_ma/components/backtotop'));
    processInclude(require('org_ma/components/quantity'));
    processInclude(require('org_ma/components/miniCart'));
    processInclude(require('base/components/collapsibleItem'));
    processInclude(require('org_ma/components/search'));
    processInclude(require('lyonscg/components/modal'));
    processInclude(require('org_ma/components/clientSideValidation'));
    processInclude(require('org_ma/components/countrySelector'));
    processInclude(require('./components/carousels'));
    processInclude(require('org_ma/components/devicedetect'));
    processInclude(require('org_ma/components/emailSignUp'));
    processInclude(require('lyonscg/components/tooltips'));
    processInclude(require('int_ari/ari/ari'));
    processInclude(require('int_financing_app/financing/application'));
    processInclude(require('org_ma/components/contentHandlers'));
    processInclude(require('org_ma/components/liveChatHandler'));
    processInclude(require('./components/video'));
    processInclude(require('./components/jscroll'));
    processInclude(require('org/components/formHandler'));
});

require('./thirdParty/jscrollpane/jquery.jscrollpane.min');
require('./thirdParty/jscrollpane/jquery.mousewheel.min');
require('org/thirdParty/bootstrap');
require('base/components/spinner');
require('svg4everybody');
require('org/slick');
require('picturefill');
