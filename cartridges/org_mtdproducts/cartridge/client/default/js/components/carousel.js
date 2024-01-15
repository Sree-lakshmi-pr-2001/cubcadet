'use strict';

/**
 * initialize carousels
 */
module.exports = function () {
    $('#brandCarousel').carousel({
        interval: 10000
    });

    $('#aboutUsCarousel').carousel({
        interval: 30000
    });

    $('a.car-play').click(function (e) {
        e.preventDefault();
        if ($('a.car-play').find('.fa-pause').length === 1) {
            $(this).parent().carousel('pause');
            $('a.car-play').find('.fa').removeClass('fa-pause');
            $('a.car-play').find('.fa').addClass('fa-play');
        } else {
            $(this).parent().carousel('cycle');
            $('a.car-play').find('.fa').removeClass('fa-play');
            $('a.car-play').find('.fa').addClass('fa-pause');
        }
    });

    $('.carousel .carousel-item').each(function () {
        var minPerSlide = 5;
        var next = $(this).next();
        if (!next.length) {
            next = $(this).siblings(':first');
        }
        next.children(':first-child').clone().appendTo($(this));

        for (var i = 0; i < minPerSlide; i++) {
            next = next.next();
            if (!next.length) {
                next = $(this).siblings(':first');
            }

            next.children(':first-child').clone().appendTo($(this));
        }
    });

    $('.carousel-item a img').mouseover(function () {
        var colorLogo = $(this).data('img-color');
        $(this).attr('src', colorLogo);
    });

    $('.carousel-item a img').mouseout(function () {
        var greyLogo = $(this).data('img-grey');
        $(this).attr('src', greyLogo);
    });
};
