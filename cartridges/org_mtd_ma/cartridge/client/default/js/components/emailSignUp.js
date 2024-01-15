'use strict';

/**
 * Subscribe
 * @param {string} email - User email
 * @param {string} url - URL string
 */
function subscribe(email, url) {
    var emailSignupForm = $('#email-subscribe-form');
    $.spinner().start();
    $.ajax({
        url: url,
        type: 'post',
        dataType: 'json',
        data: {
            email: email
        },
        success: function (response) {
            $.spinner().stop();

            // display the response message in an alert
            if (response && response.success) {
                emailSignupForm.find('.success-msg').html(response.msg);
                $('.footer-email-signup').append(
                    '<div class="alert alert-success email-signup-alert text-center"'
                    + ' role="alert">' + response.msg + '</div>'
                );
            } else {
                emailSignupForm.find('.error-msg').html(response.msg);
                $('.footer-email-signup').append(
                    '<div class="alert alert-danger email-signup-alert text-center"'
                    + ' role="alert">' + response.msg + '</div>'
                );
            }

            $('#email-signup').val('');

            // remove the alert after 3s
            setTimeout(function () {
                $('.email-signup-alert').remove();
            }, 3000);
        },
        error: function () {
            $.spinner().stop();
        }
    });
}


module.exports = function () {
    $('#email-signup').on('focus', function () {
        // clear previous errors
        $('.footer-email-signup').find('.invalid-feedback').hide();
        $('#email-signup, [for="email-signup"]').removeClass('text-danger');
    });

    $('#email-subscribe-form').on('submit', function (e) {
        e.preventDefault();
        var email = $('#email-signup').val();
        var url = $(this).data('url');

        // custom empty field error handling
        if (email === '' || email.length === 0) {
            var errorMsgType = $('#email-signup').data('missing-type');
            var validationMessage = $('#email-signup').data('missing-msg');
            $('.footer-email-signup').find('.invalid-feedback').html('<strong>' + errorMsgType + '</strong> ' + validationMessage).show();
            $('#email-signup, [for="email-signup"]').addClass('text-danger');
        } else {
            subscribe(email, url);
        }
    });
};
