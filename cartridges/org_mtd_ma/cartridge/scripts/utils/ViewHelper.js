/* eslint-disable space-infix-ops */
'use strict';

module.exports = {
    /**
     * Formats Phone numbers
     * @param {string} phoneString - the phone number
     * @param {string} countryCode - the country code of the locale
     * @returns {string} formattedPhone - the formatted phone number
     */
    formatPhoneNumber: function (phoneString, countryCode) {
        var formattedPhone = phoneString;

        // if the number is null, return a blank string
        if (formattedPhone === null || formattedPhone === '') {
            return '';
        }

        // if the number is already formatted, just return it
        if (formattedPhone.substring(3, 4) === '-' || phoneString.substring(0, 1) === '+') {
            return formattedPhone;
        }

        if (countryCode === 'US' || countryCode.value === 'US' || countryCode === 'CA' || countryCode.value === 'CA') {
            formattedPhone = phoneString.substring(0, 3) + '-' + phoneString.substring(3, 6) + '-' + phoneString.substring(6, 10);
        } else if (phoneString.substring(0, 1) !== '+') {
             // international formatting
            formattedPhone = '+' + phoneString;
        }

        return formattedPhone;
    },

    /**
     * Formats the masked credit card string
     * @param {string} maskedString - masked Credit Card String
     * @returns {string} formattedMaskedString - the formatted masked Credit Card string
     */
    formatMaskedCCNumber: function (maskedString) {
        var maskedArr = String(maskedString).split('');
        var maskCounter = 0;
        var formattedMaskedString = '';
        var numberRegExp = new RegExp('[0-9]');
        var numberStart = true;
        maskedArr.forEach(function (el) {
            maskCounter++;
            if (!numberRegExp(el)) {
                formattedMaskedString = formattedMaskedString.concat(el);
                if (maskCounter % 4 === 0) {
                    formattedMaskedString = formattedMaskedString.concat(' ');
                }
                return;
            }
            if (numberRegExp(el)) {
                if (numberStart) {
                    formattedMaskedString = formattedMaskedString.concat(' ');
                    numberStart = false;
                }
                formattedMaskedString = formattedMaskedString.concat(el);
            }
        });

        return formattedMaskedString;
    }
};
