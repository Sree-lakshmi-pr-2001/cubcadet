'use strict';

var PaymentData = require('../tests/data/PaymentTestData');

/**
 * Get Random number
 *
 * @param {number} min - lower end of range
 * @param {number} max - upper end of range
 * @returns {number} - random integer within range
 */
var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Authorize CC
 *
 * @param {Object} ccObj - Credit Card Object
 * @param {string} cardType - Type of the Card: Visa, MasterCard, etc
 * @param {boolean} hasToken - Flag that indicated that card token is provided instead of number
 * @return {Object} - Result data
 */
exports.authorize = function (ccObj, cardType, hasToken) {
    var result = {
        status: 'declined',
        transactionId: null
    };

    var compareData = hasToken ? PaymentData.savedCard : PaymentData.creditCard;

    // verify that address is valid
    for (var cardStatus in compareData) {
        var creditCardData = compareData[cardStatus][cardType];
        var valid = true;
        for (var field in creditCardData) {
            var fieldValue = creditCardData[field];
            if (ccObj[field] !== fieldValue) {
                valid = false;
                break;
            }
        }

        if (valid) {
            result.status = cardStatus === 'valid' ? 'approved' : 'declined';
            if (cardStatus === 'valid') {
                result.transactionId = getRandomInt(1000000, 9999999);
            }
            break;
        }
    }

    return result;
};

/**
 * Tokenize CC
 *
 * @param {Object} ccObj - Credit Card Object
 * @param {string} cardType - Type of the Card: Visa, MasterCard, etc
 * @return {Object} - Result data
 */
exports.tokenizeCard = function (ccObj, cardType) {
    var result = {
        status: 'declined',
        token: null
    };

    // verify that address is valid
    for (var cardStatus in PaymentData.creditCard) {
        var creditCardData = PaymentData.creditCard[cardStatus][cardType];
        var valid = true;
        for (var field in creditCardData) {
            var fieldValue = creditCardData[field];
            if (ccObj[field] !== fieldValue) {
                valid = false;
                break;
            }
        }

        if (valid) {
            result.status = cardStatus === 'valid' ? 'approved' : 'declined';
            if (cardStatus === 'valid') {
                result.token = PaymentData.savedCard.valid[cardType].token;
            }
            break;
        }
    }

    return result;
};

/**
 * Void CC
 *
 * @param {string} transactionId - Transaction ID
 * @return {string} - Result data
 */
exports.void = function (transactionId) {
    var result;

    if (transactionId && transactionId > 0) {
        result = 'success';
    } else {
        result = 'failed';
    }

    return result;
};

/**
 * Capture CC
 *
 * @param {string} transactionId - Transaction ID
 * @return {Object} - Result data
 */
exports.capture = function (transactionId) {
    var result;

    if (transactionId && transactionId > 0) {
        result = 'success';
    } else {
        result = 'failed';
    }

    return result;
};


/**
 * Check Balance
 *
 * @param {string} number - Gift Card Number
 * @param {string} pin - Gift Card Pin
 * @return {Object} - Result data
 */
exports.checkBalance = function (number, pin) {
    var result = {
        status: 'failed',
        balance: 0
    };

    if (number === PaymentData.giftCard.number
            && pin === PaymentData.giftCard.pin) {
        result.status = 'success';
        result.balance = PaymentData.giftCard.balance;
    }

    return result;
};
