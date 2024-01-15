'use strict';
var URLUtils = require('dw/web/URLUtils');
var endpoints = require('*/cartridge/config/oAuthRenentryRedirectEndpoints');
var HookMgr = require('dw/system/HookMgr');
var Logger = require('dw/system/Logger');
var HashMap = require('dw/util/HashMap');
var Template = require('dw/util/Template');

/**
 * Creates an account model for the current customer
 * @param {string} redirectUrl - rurl of the req.querystring
 * @param {string} privacyCache - req.session.privacyCache
 * @param {boolean} newlyRegisteredUser - req.session.privacyCache
 * @returns {string} a redirect url
 */
function getLoginRedirectURL(redirectUrl, privacyCache, newlyRegisteredUser) {
    var endpoint = 'Account-Show';
    var result;
    var targetEndPoint = redirectUrl
        ? parseInt(redirectUrl, 10)
        : 1;

    var registered = newlyRegisteredUser ? 'submitted' : 'false';

    var argsForQueryString = privacyCache.get('args');

    if (targetEndPoint && endpoints[targetEndPoint]) {
        endpoint = endpoints[targetEndPoint];
    }

    if (argsForQueryString) {
        result = URLUtils.url(endpoint, 'registration', registered, 'args', argsForQueryString).relative().toString();
    } else {
        result = URLUtils.url(endpoint, 'registration', registered).relative().toString();
    }

    return result;
}

/**
 * Send an email that would notify the user that account was created
 * @param {obj} registeredUser - object that contains user's email address and name information.
 */
function sendCreateAccountEmail(registeredUser) {
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');

    var hookID = 'app.mail.sendMail';
    if (HookMgr.hasHook(hookID)) {
        HookMgr.callHook(
            hookID,
            'sendMail',
            {
                communicationHookID: 'account.created',
                fromEmail: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
                toEmail: registeredUser.email,
                subject: Resource.msg('account.createdemail.subject', 'account', null),
                params: {
                    Customer: registeredUser.customer,
                    LoginUrl: URLUtils.https('Login-Show')
                }
            }
        );
    } else {
        Logger.error('No hook registered for {0}', hookID);
    }
}

/**
 * Gets the password reset token of a customer
 * @param {Object} customer - the customer requesting password reset token
 * @returns {string} password reset token string
 */
function getPasswordResetToken(customer) {
    var Transaction = require('dw/system/Transaction');

    var passwordResetToken;
    Transaction.wrap(function () {
        passwordResetToken = customer.profile.credentials.createResetPasswordToken();
    });
    return passwordResetToken;
}

/**
 * Sends the email with password reset instructions
 * @param {string} email - email for password reset
 * @param {Object} resettingCustomer - the customer requesting password reset
 */
function sendPasswordResetEmail(email, resettingCustomer) {
    var Resource = require('dw/web/Resource');
    var Site = require('dw/system/Site');

    var passwordResetToken = getPasswordResetToken(resettingCustomer);
    var url = URLUtils.https('Account-SetNewPassword', 'token', passwordResetToken);
    var objectForEmail = {
        passwordResetToken: passwordResetToken,
        firstName: resettingCustomer.profile.firstName,
        lastName: resettingCustomer.profile.lastName,
        url: url,
        resettingCustomer: resettingCustomer
    };

    var context = new HashMap();
    Object.keys(objectForEmail).forEach(function (key) {
        context.put(key, objectForEmail[key]);
    });
    var template = new Template('account/password/passwordChangedEmail');
    var content = template.render(context).text;
    var hookID = 'app.mail.sendMail';
    if (HookMgr.hasHook(hookID)) {
        HookMgr.callHook(
            hookID,
            'sendMail',
            {
                communicationHookID: 'account.passwordReset',
                template: 'account/password/passwordResetEmail',
                fromEmail: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
                toEmail: email,
                subject: Resource.msg('subject.profile.resetpassword.email', 'login', null),
                messageBody: content,
                params: context
            });
    } else {
        Logger.error('No hook registered for {0}', hookID);
    }
}

/**
 * Send an email that would notify the user that account was edited
 * @param {obj} profile - object that contains user's profile information.
 */
function sendAccountEditedEmail(profile) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');

    var userObject = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        url: URLUtils.https('Login-Show')
    };

    var emailObj = {
        to: profile.email,
        subject: Resource.msg('email.subject.account.edited', 'account', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
        type: emailHelpers.emailTypes.accountEdited
    };

    emailHelpers.sendEmail(emailObj, 'account/components/accountEditedEmail', userObject);
}

/**
 * Restrict states in address form. Exclude AK and HI
 *
 * @param {array} addressForm - address form
 */
function restrictStates(addressForm) {
    var stateOptions = addressForm.states.stateCode.options;

    var filteredStates = [];
    for (var i = 0, l = stateOptions.length; i < l; i++) {
        var stateItem = stateOptions[i];
        if (stateItem.value !== 'AK' && stateItem.value !== 'HI') {
            filteredStates.push(stateItem);
        }
    }
    addressForm.states.stateCode.options = filteredStates; // eslint-disable-line no-param-reassign
}

function sendCreateAccountEmailFromSFCC(registeredUser) {
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');

    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');
    var template = '/account/accountCreationEmail';
    var userObject = {
        firstName: registeredUser.firstName,
        lastName: registeredUser.lastName,
    };

    var emailObj = {
        to: registeredUser.email,
        subject: Resource.msg('email.subject.new.registration', 'registration', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
    };
    
    return emailHelpers.send(emailObj, template, userObject);
}

function sendPasswordResetEmailFromSFCC(email, resettingCustomer) {
    var Resource = require('dw/web/Resource');
    var Site = require('dw/system/Site');

    var passwordResetToken = getPasswordResetToken(resettingCustomer);
    var url = URLUtils.https('Account-SetNewPassword', 'token', passwordResetToken);
    var objectForEmail = {
        firstName: resettingCustomer.profile.firstName,
        url: url,
    };
    
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');
    var template = '/account/password/passwordResetEmail';

    var emailObj = {
        to: email,
        subject: Resource.msg('email.subject.password.reset', 'email', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
    };
    
    return emailHelpers.send(emailObj, template, objectForEmail);

}

function sendPasswordSavedEmailFromSFCC(resettingCustomer) {
    var Resource = require('dw/web/Resource');
    var Site = require('dw/system/Site');
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var email = resettingCustomer.profile.email;
    var url = URLUtils.https('Login-Show');
    var objectForEmail = {
            firstName: resettingCustomer.profile.firstName,
            lastName: resettingCustomer.profile.lastName,
            url: url
    };

    var emailObj = {
                to: email,
                subject: Resource.msg('email.subject.password.change', 'email', null),
                from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
             };

    var template = 'account/password/passwordChangedEmail';
    
    return emailHelpers.send(emailObj, template, objectForEmail);

}

function sendAccountEditedEmailFromSFCC(profile) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');
    var email = profile.email;

    var userObject = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        url: URLUtils.https('Login-Show')
    };

    var emailObj = {
        to: email,
        subject: Resource.msg('email.msg.account.updated', 'email', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
    };

    emailHelpers.send(emailObj, 'account/accountEditedEmail', userObject);
}

module.exports = {
    getLoginRedirectURL: getLoginRedirectURL,
    sendCreateAccountEmail: sendCreateAccountEmail,
    sendPasswordResetEmail: sendPasswordResetEmail,
    sendAccountEditedEmail: sendAccountEditedEmail,
    restrictStates: restrictStates,
    sendCreateAccountEmailFromSFCC: sendCreateAccountEmailFromSFCC,
    sendPasswordResetEmailFromSFCC: sendPasswordResetEmailFromSFCC,
    sendPasswordSavedEmailFromSFCC: sendPasswordSavedEmailFromSFCC,
    sendAccountEditedEmailFromSFCC: sendAccountEditedEmailFromSFCC
};
