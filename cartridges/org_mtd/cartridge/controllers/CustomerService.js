'use strict';
/* global request */
/**
 * This controller handles customer service related pages, such as the contact us form
 *
 */

var server = require('server');
var page = module.superModule;
server.extend(page);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var googleRecaptcha = require('*/cartridge/scripts/middleware/googleRecaptcha');

var HashMap = require('dw/util/HashMap');
var Resource = require('dw/web/Resource');
var Mail = require('dw/net/Mail');
var Site = require('dw/system/Site');
var Template = require('dw/util/Template');

/**
 * Send confirmation email to customer support
 * @param {Object} contactFormData - Contact form data
 * @returns {void}
 *
 */
function sendConfirmationEmail(contactFormData) {
    var confirmationEmail = new Mail();
    var context = new HashMap();
    var template;
    var content;

    confirmationEmail.addTo(Site.current.getCustomPreferenceValue('customerServiceEmail'));
    confirmationEmail.setSubject(contactFormData.subject);
    confirmationEmail.setFrom('no-reply@salesforce.com');

    Object.keys(contactFormData).forEach(function (key) {
        var value = typeof contactFormData[key] !== 'undefined' ? contactFormData[key] : null;
        context.put(key, value);
    });

    template = new Template('mail/contactUs');
    content = template.render(context).text;
    confirmationEmail.setContent(content, 'text/html', 'UTF-8');
    confirmationEmail.send();
}

/**
 * Create field label from field name
 * @param {string} fieldName - field name
 * @returns {string} final field label
 */
function createLabelFromFieldName(fieldName) {
    var nameList = fieldName.split('-');
    var labelWordList = [];
    for (var i = 0, l = nameList.length; i < l; i++) {
        var name = nameList[i];
        labelWordList.push(name.charAt(0).toUpperCase() + name.substring(1));
    }
    return labelWordList.join(' ');
}

/**
 * Send form email to customer support
 * @param {string} emailTo - email to
 * @param {string} subject - email subject
 * @param {array} emailData - email data
 * @returns {void}
 */
function sendFormEmail(emailTo, subject, emailData) {
    var formEmail = new Mail();
    var context = new HashMap();
    var template;
    var content;

    formEmail.addTo(emailTo);
    formEmail.setSubject(subject);
    formEmail.setFrom(Site.current.getCustomPreferenceValue('customerServiceEmail'));

    context.put('data', emailData);

    template = new Template('mail/formHandler');
    content = template.render(context).text;
    formEmail.setContent(content, 'text/html', 'UTF-8');
    formEmail.send();
}

server.replace('Submit',
    server.middleware.https,
    csrfProtection.validateRequest,
    googleRecaptcha.validateResponse,
    function (req, res, next) {
        var formData = {
            email: req.form.email,
            firstName: req.form.firstname,
            lastName: req.form.lastname,
            subject: req.form.myquestion,
            comment: req.form.comment
        };
        var contactUsForm = server.forms.getForm('contactus');
        sendConfirmationEmail(formData);
        res.render('content/contactus', {
            sucess: true,
            contactUsForm: contactUsForm
        });
        next();
    });

server.post('FormHandler',
    server.middleware.https,
    googleRecaptcha.validateResponse,
    function (req, res, next) {
        var Logger = require('dw/system/Logger');
        var URLUtils = require('dw/web/URLUtils');
        var StringUtils = require('dw/util/StringUtils');

        var refererUrl = request.httpReferer || URLUtils.url('Home-Show');

        var formData = req.form;
        var formFieldNames = Object.keys(formData);
        var emailSubject = Resource.msg('form.handler.subject', 'forms', null);
        var emailTo;
        var emailData = [];
        var excludeFormFieldNames = ['g-recaptcha-response'];

        // Get emails to settings from site pref
        var formHandlerEmailsStr = Site.current.getCustomPreferenceValue('formHandlerEmailsTo');
        var formHandlerEmails;
        try {
            formHandlerEmails = JSON.parse(formHandlerEmailsStr);
        } catch (e) {
            Logger.error('There is no value set for "formHandlerEmailsTo" site preference');

            res.redirect(refererUrl);
            return next();
        }

        // Handle form data
        for (var i = 0, l = formFieldNames.length; i < l; i++) {
            var fieldName = formFieldNames[i];
            if (fieldName === 'subject') {
                emailSubject = StringUtils.trim(formData[fieldName]);
            } else if (fieldName === 'emailTo') {
                var emailToValue = formData[fieldName];
                if (emailToValue in formHandlerEmails) {
                    emailTo = formHandlerEmails[emailToValue];
                }
            } else if (excludeFormFieldNames.indexOf(fieldName) === -1) {
                // Collect all other form data
                var fieldLabel = createLabelFromFieldName(fieldName);
                var fieldValue = StringUtils.trim(formData[fieldName]);
                emailData.push({
                    label: fieldLabel,
                    value: fieldValue
                });
            }
        }

        // Verify that we have emailTo to send email
        if (!emailTo) {
            res.redirect(refererUrl);
            return next();
        }

        // Send email
        sendFormEmail(emailTo, emailSubject, emailData);

        // Render success message
        res.render('content/formHandlerSuccess');
        return next();
    });

module.exports = server.exports();
