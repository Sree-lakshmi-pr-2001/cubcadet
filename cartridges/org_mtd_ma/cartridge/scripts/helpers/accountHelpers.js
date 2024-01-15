'use strict';

var base = module.superModule;

var URLUtils = require('dw/web/URLUtils');
var endpoints = require('*/cartridge/config/oAuthRenentryRedirectEndpoints');
var HookMgr = require('dw/system/HookMgr');
var Logger = require('dw/system/Logger');
var HashMap = require('dw/util/HashMap');
var Template = require('dw/util/Template');

/**
 * Send an email that would notify the user that account was created
 * @param {obj} registeredUser - object that contains user's email address and name information.
 */
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



/**
 * Send an email that would notify the user that account was edited
 * @param {obj} profile - object that contains user's profile information.
 */
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


base.sendCreateAccountEmailFromSFCC = sendCreateAccountEmailFromSFCC;
base.sendPasswordResetEmailFromSFCC = sendPasswordResetEmailFromSFCC;
base.sendAccountEditedEmailFromSFCC = sendAccountEditedEmailFromSFCC;
base.sendPasswordSavedEmailFromSFCC = sendPasswordSavedEmailFromSFCC;

module.exports = base;
