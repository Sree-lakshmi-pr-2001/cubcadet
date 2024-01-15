var Logger = require('dw/system/Logger');
var Template = require('dw/util/Template');
var Mail = require('dw/net/Mail');
var HashMap = require('dw/util/HashMap');

var SendEmailHelper = {
    // @function
    // @name sendEmail
    // @description Sends an email based on the template params, template, send to, sent from, and subject.
    // @param {Object} templateParameters Hash of parameters for the template pdict
    // @param {string} templatePath System file path of the isml template
    // @param {string} emailTo Where the email is being sent to
    // @param {string} emailFrom Where the email is being sent from
    // @param {string} emailSubject Email subject line
    sendEmail: function(templateParameters : Object, templatePath : String, emailTo : String, emailFrom : String, emailSubject : String) {
        if (empty(templateParameters) || 
            empty(templatePath) || 
            empty(emailTo) || 
            empty(emailFrom) || 
            empty(emailSubject)) {

            Logger.error("One of the parameter inputs is empty.", null);
        } else {

            var templateParameterKeys = Object.keys(templateParameters),
                template = new Template(templatePath),
                mail = new Mail(),
                templateParameterMap = new HashMap();

            for (var i = 0, templateParameterKeysLength = templateParameterKeys.length; i < templateParameterKeysLength; i++) {
                if (!empty(templateParameters[templateParameterKeys[i]])) {
                    templateParameterMap.put(templateParameterKeys[i], templateParameters[templateParameterKeys[i]]);
                }
            }

            var emailBody = template.render(templateParameterMap);

            mail.addTo(emailTo);
            mail.setFrom(emailFrom);
            mail.setSubject(emailSubject);
            mail.setContent(emailBody);
            mail.send();
        }
    }
}

module.exports = SendEmailHelper;