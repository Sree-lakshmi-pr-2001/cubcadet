/* global session */
'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.prepend('Show', function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var ContentModel = require('*/cartridge/models/content');
    var viewData = res.getViewData();
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    var apiContent = ContentMgr.getContent('login-metadata');
    if (apiContent) {
        var content = new ContentModel(apiContent, 'content/contentAsset');

        pageMetaHelper.setPageMetaData(req.pageMetaData, content);
        pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
    }


    viewData.oAuthNoEmail = false;
    // Check if we have no email flag from oAuth login
    if ('noEmailOAuthLogin' in session.custom && session.custom.noEmailOAuthLogin) {
        var noEmailAsset = ContentMgr.getContent('no-email-oauth-login');
        var assetModel = (noEmailAsset) ? new ContentModel(noEmailAsset) : '';
        viewData.oAuthNoEmail = true;
        viewData.oAuthNoEmailAsset = (assetModel) ? assetModel.body.markup : '';
        // Delete session variable
        delete session.custom.noEmailOAuthLogin;
    }

    res.setViewData(viewData);
    next();
}, pageMetaData.computedPageMetaData);

server.replace('OAuthReentry', server.middleware.https, consentTracking.consent, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var oauthLoginFlowMgr = require('dw/customer/oauth/OAuthLoginFlowMgr');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');

    var destination = req.session.privacyCache.store.oauthLoginTargetEndPoint;

    var finalizeOAuthLoginResult = oauthLoginFlowMgr.finalizeOAuthLogin();
    if (!finalizeOAuthLoginResult) {
        res.redirect(URLUtils.url('Login-Show'));
        return next();
    }

    var response = ('userInfoResponse' in finalizeOAuthLoginResult) ? finalizeOAuthLoginResult.userInfoResponse.userInfo : null;
    var oauthProviderID = ('accessTokenResponse' in finalizeOAuthLoginResult) ? finalizeOAuthLoginResult.accessTokenResponse.oauthProviderId : null;

    if (!oauthProviderID) {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    if (!response) {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    var externalProfile = JSON.parse(response);
    if (!externalProfile) {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    var userID = externalProfile.id || externalProfile.uid || externalProfile.sub;
    if (!userID) {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    var email = externalProfile['email-address'] || externalProfile.email;

    if (!email) {
        var emails = externalProfile.emails;

        if (emails && emails.length) {
            email = externalProfile.emails[0].value;
        } else {
            session.custom.noEmailOAuthLogin = true;
            res.redirect(URLUtils.url('Login-Show'));
            return next();
        }
    }

    var authenticatedCustomerProfile = CustomerMgr.getExternallyAuthenticatedCustomerProfile(
        oauthProviderID,
        userID
    );

    if (!authenticatedCustomerProfile) {
        // Create new profile
        Transaction.wrap(function () {
            var newCustomer = CustomerMgr.createExternallyAuthenticatedCustomer(
                oauthProviderID,
                userID
            );

            authenticatedCustomerProfile = newCustomer.getProfile();
            var firstName;
            var lastName;

            // Google comes with a 'name' property that holds first and last name.
            if (typeof externalProfile.name === 'object') {
                firstName = externalProfile.name.givenName;
                lastName = externalProfile.name.familyName;
            } else {
                // The other providers use one of these, GitHub has just a 'name'.
                firstName = externalProfile['first-name']
                    || externalProfile.first_name
                    || externalProfile.given_name
                    || externalProfile.name;

                lastName = externalProfile['last-name']
                    || externalProfile.last_name
                    || externalProfile.family_name
                    || externalProfile.name;
            }

            authenticatedCustomerProfile.setFirstName(firstName);
            authenticatedCustomerProfile.setLastName(lastName);
            authenticatedCustomerProfile.setEmail(email);
        });
    }

    var credentials = authenticatedCustomerProfile.getCredentials();
    if (credentials.isEnabled()) {
        Transaction.wrap(function () {
            CustomerMgr.loginExternallyAuthenticatedCustomer(oauthProviderID, userID, false);
        });
    } else {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    req.session.privacyCache.clear();
    res.redirect(URLUtils.url(destination));

    return next();
});

module.exports = server.exports();
