'use strict';

var idleTimeout = require('../timeout');

$(document).ajaxSend(function () {
    // listen for any ajax call - if detected, restart the timer for the session
    console.log('Triggered ajaxSend handler.');
    idleTimeout.restartTimer();
});

$(function () {
    // on page load - start the timer
    idleTimeout.startTimer();
});

module.exports = {
    methods: {
    }
};
