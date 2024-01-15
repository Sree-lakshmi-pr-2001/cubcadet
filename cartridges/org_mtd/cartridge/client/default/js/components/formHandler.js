'use strict';

module.exports = {
    submit: function () {
        var $captcha = $('#recaptcha');
        $('form[name$="_request_form"]').on('submit', function () {
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
