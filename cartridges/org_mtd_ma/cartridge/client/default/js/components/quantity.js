'use strict';

module.exports = function () {
    var alllowedKeyCode = [8, 37, 39, 9];
    var qtyInput = '[name="quantity-input"]';

    $('body').on('keydown', qtyInput, function (e) {
        if (alllowedKeyCode.indexOf(e.keyCode) >= 0) {
            return true;
        }
        var enteredChar = e.key;

        if (/^[0-9]+$/ig.test(enteredChar)) {
            return true;
        }
        return false;
    });

    // need to separate the blur event from the keyup/keypress due to IE not listening to blur event
    $('body, .popover').on('blur', qtyInput, function () {
        $(this).change();
    });

    // need to separate to allow users to clear the input and type in a new number
    $('body, .popover').on('change', qtyInput, function () {
        var minVal = $(this).attr('min');
        var currentVal = Number($(this).val());
        if (currentVal < minVal) {
            $(this).val(minVal);
        }
    });

    $('body').on('keyup keypress blur', qtyInput, function () {
        $(this).val($(this).val().replace(/[^0-9]/g, ''));
        // Verify max and min values
        var maxVal = $(this).attr('max');
        var currentVal = Number($(this).val());
        if (currentVal > maxVal) {
            $(this).val(maxVal);
        }
    });
    var changeQtyCheckTimeout = null;

    $('body').on('click', '[name="minus"]', function () {
        var inputField = $(this).parent().next(qtyInput);
        var currentVal = Number(inputField.val());
        var minVal = Number(inputField.attr('min'));
        var newVal = currentVal - 1;
        if (newVal >= minVal) {
            inputField.val(newVal);
            if (changeQtyCheckTimeout) {
                clearTimeout(changeQtyCheckTimeout);
            }
            changeQtyCheckTimeout = setTimeout(function () {
                inputField.change();
            }, 700);
        }
    });

    $('body').on('click', '[name="plus"]', function () {
        var inputField = $(this).parent().prev(qtyInput);
        var currentVal = Number(inputField.val());
        var maxVal = Number(inputField.attr('max'));
        var newVal = currentVal + 1;
        if (newVal <= maxVal) {
            inputField.val(newVal);
            if (changeQtyCheckTimeout) {
                clearTimeout(changeQtyCheckTimeout);
            }
            changeQtyCheckTimeout = setTimeout(function () {
                inputField.change();
            }, 700);
        }
    });

    $('body').on('click', '.minusWrapper', function (e) {
        e.preventDefault();
        $(this).parent().find('input[name="minus"]').trigger('click');
    });

    $('body').on('click', '.plusWrapper', function (e) {
        e.preventDefault();
        $(this).parent().find('input[name="plus"]').trigger('click');
    });
};
