'use strict';

var base = require('./base');
var quickView = require('org_ma/product/quickView');

var exportQuickView = $.extend({}, quickView, {
    availability: base.availability,
    addToCart: base.addToCart
});

module.exports = exportQuickView;
