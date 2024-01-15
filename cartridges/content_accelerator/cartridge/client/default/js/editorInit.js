'use strict';

const $ = require('jquery');
window.jQuery = window.$ = $;

const processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./contentAccelerator/utils/grapesInit'));
});
