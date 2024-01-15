'use strict';

var base = require('./base');
var quickView = require('base/product/quickView');

$('body').on('shown.bs.modal', '#quickViewModal', function () {
    base.carouselInit();
});

module.exports = quickView;
