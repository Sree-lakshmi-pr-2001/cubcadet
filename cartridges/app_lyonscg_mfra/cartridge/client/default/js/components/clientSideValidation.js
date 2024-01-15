'use strict';

var clientSideValidation = require('base/components/clientSideValidation');

var localizableMessages = {
    fr_CA: {
        missing: 'Veuillez remplir ce champ.',
        patternFormat: 'Veuillez respecter le format indiqué.',
        tooShort: 'Ce champs doit contenir au moins {0} caractères.'
    }
};

/**
 *  Updated to include a blur event for instant validation
 */
var exportClientSideValidation = $.extend({}, clientSideValidation, {
    invalid: function () {
        $('form input, form select').on('invalid, blur', function (e) {
            e.preventDefault();
            this.setCustomValidity('');
            if (!this.validity.valid) {
                var validationMessage = this.validationMessage;
                // Add localized message if possible
                if (window.pageContext
                        && 'locale' in window.pageContext
                        && window.pageContext.locale in localizableMessages) {
                    var localeMsg = localizableMessages[window.pageContext.locale];
                    if (this.validity.valueMissing) {
                        validationMessage = localeMsg.missing;
                    }
                    if (this.validity.patternMismatch) {
                        validationMessage = localeMsg.patternFormat;
                    }
                    if (this.validity.tooShort) {
                        validationMessage = localeMsg.tooShort.replace('{0}', this.minLength);
                    }
                }
                $(this).addClass('is-invalid');
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
                $(this).parents('.form-group').find('.invalid-feedback')
                    .text(validationMessage);
            } else {
                $(this).removeClass('is-invalid');
                $(this).parents('.form-group').find('.invalid-feedback')
                .text('');
            }
        });
    }
});

module.exports = exportClientSideValidation;
