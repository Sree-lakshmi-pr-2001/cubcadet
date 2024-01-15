'use strict';

module.exports = {
    submit: function () {
        var $captcha = $('#recaptcha');
        $('form[name$="_contactus"]').on('submit', function () {
            var result = true;
            if (grecaptcha.getResponse().length === 0) {
                $captcha.next('.invalid-feedback').show();
                result = false;
            } else {
                $captcha.next('.invalid-feedback').hide();
            }
            return result;
        });
    }
};
