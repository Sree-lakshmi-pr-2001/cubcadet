'use strict';

var cart = require('base/cart/cart');
var base = require('../product/base');

base.carouselInit();

$('body').on('product:beforeAttributeSelect', function () {
    // Unslick the existing images to prepare them for direct js manipulation
    base.carouselUnslick();
});

$('body').on('product:afterAttributeSelect', function (e, response) {
    base.updateMainImages(response.data.product);
    base.carouselInit();
});

$('body').on('shown.bs.modal', '#editProductModal, #quickViewModal, #chooseBonusProductModal', function () {
    base.carouselInit();
});

base.availability();

module.exports = cart;
