'use strict';

/**
 * Display error messages and highlight form fields with errors.
 * @param {string} parentSelector - the form which contains the fields
 * @param {Object} fieldErrors - the fields with errors
 */
function loadFormErrors(parentSelector, fieldErrors) { // eslint-disable-line
    // Display error messages and highlight form fields with errors.
    $.each(fieldErrors, function (attr) {
        $('*[name=' + attr + ']', parentSelector)
        .addClass('is-invalid')
        .siblings('.invalid-feedback')
        .html(fieldErrors[attr]);

        if ($('*[name=' + attr + ']').is('select')) {
            $('.' + attr).find('.invalid-feedback').html(fieldErrors[attr]);
        }

        $('.' + attr).find('label').addClass('text-danger');
    });
}

/**
 * Clear the form errors.
 * @param {string} parentSelector - the parent form selector.
 */
function clearPreviousErrors(parentSelector) {
    $(parentSelector).find('.form-control.is-invalid').removeClass('is-invalid');
    $(parentSelector).find('label').removeClass('text-danger');
    $('.error-message').hide();
}

module.exports = {
    loadFormErrors: loadFormErrors,
    clearPreviousErrors: clearPreviousErrors
};
