'use strict';
/* global request */
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');
var net = require('dw/net');

/**
 * Middleware to validate Google recaptcha response if Google recaptcha is enabled for site
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {Function} next - Next call in the middleware chain
 */
function validateResponse(req, res, next) {
    var enableGoogleRecaptcha = Site.getCurrent().getCustomPreferenceValue('enableGoogleRecaptcha');
    if (enableGoogleRecaptcha !== null && enableGoogleRecaptcha) {
        var googleRecaptchaSecretKey = Site.getCurrent().getCustomPreferenceValue('googleRecaptchaSecretKey');
        if (googleRecaptchaSecretKey !== null) {
            var googleRecaptchaResponse = req.form['g-recaptcha-response'];
            if (googleRecaptchaResponse !== null) {
                // ToDo : Refactor the recpatcha verification POST service call as per Lyons Service Framework Design
                var postData = '';
                postData += ('secret=' + encodeURIComponent(googleRecaptchaSecretKey));
                postData += ('&response=' + encodeURIComponent(googleRecaptchaResponse));
                postData += ('&remoteip=' + encodeURIComponent(req.httpHeaders['x-is-remote_addr']));

                var httpClient = new net.HTTPClient();
                httpClient.setTimeout(3000);
                httpClient.open('POST', 'https://www.google.com/recaptcha/api/siteverify');
                httpClient.setRequestHeader('Content-type', 'application/x-www-form-urlencoded; charset=UTF-8');
                httpClient.send(postData);

                var refererUrl = request.httpReferer || URLUtils.url('CustomerService-ContactUs');

                if (httpClient.statusCode === 200) {
                    var respose = JSON.parse(httpClient.text);
                    if (respose != null && respose.success != null && respose.success === true) {
                        return next();
                    }
                    res.redirect(refererUrl);
                } else {
                    res.redirect(refererUrl);
                }
            }
        }
    }
    return next();
}

module.exports = {
    validateResponse: validateResponse
};
