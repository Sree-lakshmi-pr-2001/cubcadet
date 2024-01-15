/* eslint-disable no-undef */
/* eslint-disable require-jsdoc */
'use strict';

var globalTimeoutId = null;
// 1 minute in milliseconds * amount of minutes
var globalTimeoutTime = 60000 * 15;

const bc = new BroadcastChannel('idleTimer');

function triggerModal() {
    $('#timeoutModal').modal({
        show: false,
        backdrop: 'static'
    });
    $('#timeoutModal').modal('show');
}

bc.onmessage = (messageEvent) => {
    if (messageEvent.data === 'forceRelog') {
        triggerModal();
    }
};

function checkTimeout() {
    var expirationTime = localStorage.getItem('timeoutTime');
    var currentTime = Date.now();
    if (currentTime >= expirationTime) {
        bc.postMessage('forceRelog');
        clearInterval(globalTimeoutId);
        triggerModal();
    }
}

function startTimer() {
    var currentTime = Date.now();
    var timeoutTime = currentTime + globalTimeoutTime;
    console.log('Current time : ' + currentTime + ' - Timeout Time : ' + timeoutTime);
    console.log('Storing timeout time');
    localStorage.setItem('timeoutTime', timeoutTime);
    globalTimeoutId = setInterval(checkTimeout, 10000);
}

function restartTimer() {
    // console.log('Restarting idle timer');
    // var timerId = localStorage.getItem('idleTimerId');
    // console.log('Cancelling old timer of ' + timerId);
    // clearTimeout(timerId);
    // startTimer();

    console.log('Restarting timer');
    var currentTime = Date.now();
    var timeoutTime = currentTime + globalTimeoutTime;
    localStorage.setItem('timeoutTime', timeoutTime);
}

$(function () {
    // on page load
    // startTimer();
});

var moduleButton = document.getElementById('returnToBusinessManager');

moduleButton.onclick = function (e) {
    e.preventDefault();
    $('#timeoutModal').modal('hide');
    window.location.href = 'ViewApplication-DisplayWelcomePage';
    // bc.postMessage('forceRelog');
};

module.exports.startTimer = startTimer;
module.exports.restartTimer = restartTimer;
module.exports.triggerModal = triggerModal;
