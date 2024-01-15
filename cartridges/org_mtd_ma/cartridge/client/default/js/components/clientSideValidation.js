'use strict';

var clientSideValidation = require('base/components/clientSideValidation');

var localizableMessages = {
    fr_CA: {
        missing: 'Veuillez remplir ce champ.',
        patternFormat: 'Veuillez respecter le format indiqué.',
        tooShort: 'Ce champs doit contenir au moins {0} caractères.',
        formatError: 'Erreur de format: ',
        rangeError: 'Erreur de plage: ',
        missingError: 'Champ requis: '
    }
};

var errorIndex = 0;

/**
 * Validate whole form. Requires `this` to be set to form object
 * @param {jQuery.event} event - Event to be canceled if form is invalid.
 * @returns {boolean} - Flag to indicate if form is valid
 */
function validateForm(event) {
    var valid = true;
    if (this.checkValidity && !this.checkValidity()) {
        // safari
        valid = false;
        if (event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }
        $(this).find('input, select, textarea').each(function () {
            if (!this.validity.valid) {
                $(this).trigger('invalid', this.validity);
            }
        });
    }
    return valid;
}

/**
 * Remove all validation. Should be called every time before revalidating form
 * @param {element} form - Form to be cleared
 * @returns {void}
 */
function clearForm(form) {
    $(form).find('.form-control.is-invalid').removeClass('is-invalid').removeClass('is-valid-custom');
    $(form).find('label.text-danger').removeClass('text-danger');
}

/**
 * Validity Error Type
 * @param {Object} validityObj - Validty Error Object
 * @returns {string} - Validty Error Type
 */
function validityType(validityObj) {
    var validityError = '';

    if (validityObj.patternMismatch || validityObj.typeMismatch) {
        validityError = 'Format Error: ';
    }
    if ((validityObj.rangeOverflow || validityObj.rangeUnderflow)) {
        validityError = 'Range Error: ';
    }
    if ((validityObj.tooLong || validityObj.tooShort)) {
        validityError = 'Range Error: ';
    }
    if (validityObj.valueMissing) {
        validityError = 'Required Field: ';
    }

    return validityError;
}

/**
 *  Updated to include a blur event for instant validation
 */
var exportClientSideValidation = $.extend({}, clientSideValidation, {
    invalid: function () {
        $('form input, form select, .dealer-zip-code-input input, textarea').on('invalid, blur', function (e) {
            e.preventDefault();
            this.setCustomValidity('');
            if (!this.validity.valid) {
                var validationMessage = this.validationMessage;
                var errorMsgType = validityType(this.validity);
                if (window.pageContext
                        && 'locale' in window.pageContext
                        && window.pageContext.locale in localizableMessages) {
                    var localeMsg = localizableMessages[window.pageContext.locale];
                    if (this.validity.valueMissing) {
                        validationMessage = localeMsg.missing;
                        errorMsgType = localeMsg.missingError;
                    }
                    if (this.validity.patternMismatch) {
                        validationMessage = localeMsg.patternFormat;
                        errorMsgType = localeMsg.formatError;
                    }
                    if (this.validity.tooShort) {
                        validationMessage = localeMsg.tooShort.replace('{0}', this.minLength);
                        errorMsgType = localeMsg.rangeError;
                    }
                }
                $(this).addClass('is-invalid');
                $(this).removeClass('is-valid-custom');
                $(".js-pay-btn").attr("disabled", true);
                var $label = $("label[for='" + $(this).attr('id') + "']");
                $label.addClass('text-danger');
                if (this.validity.patternMismatch && $(this).data('pattern-mismatch')) {
                    validationMessage = $(this).data('pattern-mismatch');
                }
                if ((this.validity.rangeOverflow || this.validity.rangeUnderflow)
                    && $(this).data('range-error')) {
                    validationMessage = $(this).data('range-error');
                }
                if ((this.validity.tooLong || this.validity.tooShort)
                    && $(this).data('range-error')) {
                    validationMessage = $(this).data('range-error');
                }
                if (this.validity.valueMissing && $(this).data('missing-error')) {
                    validationMessage = $(this).data('missing-error');
                }
                var $errorField = $(this).parents('.form-group').find('.invalid-feedback');
                var uniqueErrorID = Date.now().toString() + errorIndex.toString();
                var fieldName = $label.length ? ('(' + $label.first().text().trim() + ') ') : '';

                errorIndex++;
                $errorField.attr('id', uniqueErrorID);
                $errorField.html('<strong>' + errorMsgType + '</strong>' + fieldName + validationMessage);
                $(this).attr('aria-describedby', uniqueErrorID);
            } else {
                $("label[for='" + $(this).attr('id') + "']").removeClass('text-danger');
                $(this).removeClass('is-invalid');
                $(this).addClass('is-valid-custom');
                $(".js-pay-btn").removeAttr("disabled");
                $(this).parents('.form-group').find('.invalid-feedback')
                .text('');
            }
        });

        /* custom handler for checkbox
        $('[type="checkbox"]').on('change', function (e) {
            e.preventDefault();
            this.setCustomValidity('');
            if (!this.validity.valid) {
                var validationMessage = this.validationMessage;
                var errorMsgType = validityType(this.validity);
                // Add localized message if possible
                if (window.pageContext
                        && 'locale' in window.pageContext
                        && window.pageContext.locale in localizableMessages) {
                    var localeMsg = localizableMessages[window.pageContext.locale];
                    if (this.validity.valueMissing) {
                        validationMessage = localeMsg.missing;
                        errorMsgType = localeMsg.missingError;
                    }
                }
                $(this).addClass('is-invalid');
                $("label[for='" + $(this).attr('id') + "']").addClass('text-danger');
                if (this.validity.valueMissing && $(this).data('missing-error')) {
                    validationMessage = $(this).data('missing-error');
                }
                $(this).parents('.form-group').find('.invalid-feedback')
                    .html('<strong>' + errorMsgType + '</strong>' + validationMessage);
            } else {
                $("label[for='" + $(this).attr('id') + "']").removeClass('text-danger');
                $(this).removeClass('is-invalid');
                $(this).parents('.form-group').find('.invalid-feedback')
                .text('');
            }
        });*/
    },

    submit: function () {
        $('form').on('submit', function (e) {
            return validateForm.call(this, e);
        });
    },

    buttonClick: function () {
        $('form button[type="submit"], form input[type="submit"]').on('click', function () {
            if ($(this).parents('form').find('input[required], textarea[required]')) {
                $(this).parents('form').find('input[required], textarea[required]').each(function () {
                    if ($(this).val().length === 0) {
                        $(this).addClass('is-invalid');
                        $(this).removeClass('is-valid-custom');
                        $(this).siblings('.form-control-label').addClass('text-danger');
                    }
                });
            } else {
                // clear all errors when trying to submit the form
                clearForm($(this).parents('form'));
            }
        });
    },

    functions: {
        validateForm: function (form, event) {
            validateForm.call($(form), event || null);
        },
        clearForm: clearForm
    }
});

module.exports = exportClientSideValidation;
