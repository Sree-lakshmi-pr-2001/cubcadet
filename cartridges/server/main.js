'use strict';
/* global request */
var Server = require('modules/server');
var Site = require('dw/system/Site');

var CustomServer = Object.create(Server);

CustomServer.get = function () {
    var args = Array.prototype.slice.call(arguments);
    args.splice(1, 0, this.middleware.get);
    var returnedRoute = this.use.apply(this, args);
    returnedRoute.on('route:Start', function onRouteStartHandler(req, res) {
        var pageContextMapPref = Site.getCurrent().getCustomPreferenceValue('pageContextMap');
        if (pageContextMapPref != null) {
            var pageContextMap = JSON.parse(pageContextMapPref);
            var actions = req.path.split('/');
            var pepperjamClickIdParam = Site.getCurrent().getCustomPreferenceValue('pepperjamClickIdParamName');
            if (request.httpParameterMap.isParameterSubmitted(pepperjamClickIdParam)) {
                var pepperjamClickId = request.httpParameterMap[pepperjamClickIdParam].value;
                var pepperjamHelper = require('*/cartridge/scripts/util/PepperjamHelper');
                pepperjamHelper.setClickIdCookie(pepperjamClickId);
            }
            if (actions.length > 0) {
                var action = actions[actions.length - 1];
                // get controller name in case global pageContextMap fallback
                var controllerName = action.split('-')[0];
                if (action != null && (action in pageContextMap || controllerName in pageContextMap)) {
                    var pageContext = {};
                    // create variable to hold pageContentMap lookup id and use in pageContext value assignments
                    var routeMap;
                    // assign value to routeMap based on values in pageContextMap
                    if (action in pageContextMap) {
                        routeMap = action;
                    } else if (controllerName in pageContextMap) {
                        routeMap = controllerName;
                    }
                    // assign values to pageContext with routeMap variable
                    pageContext.title = ('title' in pageContextMap[routeMap]) && pageContextMap[routeMap].title != null ? pageContextMap[routeMap].title : '';
                    pageContext.type = ('type' in pageContextMap[routeMap]) && pageContextMap[routeMap].type != null ? pageContextMap[routeMap].type : '';
                    pageContext.ns = ('ns' in pageContextMap[routeMap]) && pageContextMap[routeMap].ns != null ? pageContextMap[routeMap].ns : '';
                    res.setViewData({ pageContext: pageContext });
                }
            }
        }
    });
    return returnedRoute;
};

module.exports = CustomServer;
