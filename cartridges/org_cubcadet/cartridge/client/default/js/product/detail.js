'use strict';

var base = require('./base');
var detail = require('org_ma/product/detail');
var search = require('../search/search');
var carousels = require('../components/carousels');

var exportDetail = $.extend({}, detail, {
    availability: base.availability,
    addToCart: base.addToCart,
    addToCartTiles: search.addToCart,
    pdpSpecsCollapse: base.pdpSpecsCollapse,

    collapsiblePDPFeature: function () {
        var coll = document.getElementsByClassName('collapsible');
        var i;

        for (i = 0; i < coll.length; i++) {
            coll[i].addEventListener('click', function () {
                this.classList.toggle('active');
                var content = this.nextElementSibling;
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            });
        }
    },

    stickyNavbarCarousel: function () {
        if (window.innerWidth <= 544) {
            carousels.stickyCarousel();
        }

        var navbar = document.getElementById('navbar');
        var sticky = navbar.offsetTop;
        // eslint-disable-next-line require-jsdoc
        function myFunction() {
            if (window.pageYOffset >= sticky) {
                navbar.classList.add('sticky');
            } else {
                navbar.classList.remove('sticky');
                $('nav-links a.active').removeClass('active');
            }
        }
        window.onscroll = function () { myFunction(); };
    },

    isStickyNavbarMobile: function () {
        $(document).ready(function () {
            if (window.innerWidth <= 544) {
                $('.product-detail .description-and-detail').find('.part-link').removeAttr('id');
                $('.product-detail .description-and-detail').find('.part-link').removeAttr('data-anchor');
                $('.product-detail .nav-links').find('.add-to-cart-container').remove();
                $('.product-detail .nav-links').find('.pdp-product-name').remove();
            } else {
                $('.product-detail .description-and-detail').find('.pdp-parts-link').removeAttr('id');
            }
        });
    },

    stickyNavbarScroll: function () {
        $('.nav-links a').on('click', function () {
            $('#navbar a').removeClass('active');
            $(this).addClass('active');
            var scrollAnchor = $(this).attr('data-scroll');
            var scrollPoint;
            if (window.innerWidth > 544) {
                scrollPoint = $('section[data-anchor="' + scrollAnchor + '"]').offset().top + 2;
            } else {
                scrollPoint = $('section[data-anchor="' + scrollAnchor + '"]').offset().top - 45;
            }
            $('body,html').animate({
                scrollTop: scrollPoint
            }, 500);
            return false;
        });

        $(window).scroll(function () {
            var scrollPos = $(window).scrollTop();
            var relativePos;
            if (window.innerWidth <= 544) {
                relativePos = scrollPos + 70;
            } else {
                relativePos = scrollPos + 60;
            }
            $('.nav-links a').each(function () {
                var currLink = $(this);
                var refElement = $(currLink.attr('href'));
                if (refElement.position()) {
                    if (refElement.position().top <= relativePos && refElement.position().top + refElement.height() > relativePos) {
                        $('.nav-links a').removeClass('active');
                        currLink.addClass('active');
                        if (window.innerWidth <= 544) {
                            $('.nav-links').slick('slickGoTo', currLink.index());
                        }
                    } else {
                        currLink.removeClass('active');
                    }
                } else {
                    currLink.hide();
                }
            });
        }).scroll();
    }
});

module.exports = exportDetail;
