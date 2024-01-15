'use strict';

var keyboardAccessibility = require('base/components/keyboardAccessibility');
var utils = require('lyonscg/util/utils');

var clearSelection = function (element) {
    $(element).closest('.dropdown').children('.dropdown-menu').children('.top-category')
        .detach();
    $(element).closest('.dropdown.show').children('.nav-link').attr('aria-expanded', 'false');
    $(element).closest('.dropdown.show').removeClass('show');
    $(element).closest('li').detach();
};

module.exports = function () {
    var isDesktop = function (element) {
        return $(element).parents('.menu-toggleable-left').css('position') !== 'fixed';
    };

    $('.header-banner .close').on('click', function () {
        $('.header-banner').addClass('hide');
    });

    keyboardAccessibility('.main-menu .nav-link, .main-menu .dropdown-link, .container.search-results .nav-link',
        {
            40: function (menuItem) { // down
                if (menuItem.hasClass('nav-item')) { // top level
                    $('.navbar-nav .show').removeClass('show').children('.dropdown-menu').removeClass('show');
                    menuItem.addClass('show').children('.dropdown-menu').addClass('show');
                    $(this).attr('aria-expanded', 'true');
                    menuItem.find('ul > li > a').first().focus();
                } else if (menuItem.hasClass('second-level-menu-heading')) {
                    menuItem.addClass('show').children('.dropdown-menu').addClass('show');
                    $(this).attr('aria-expanded', 'true');
                    menuItem.find('ul > li > a').first().focus();
                } else if (menuItem.hasClass('third-level-menu-heading')) {
                    menuItem.removeClass('show').children('.dropdown-menu').removeClass('show');
                    $(this).attr('aria-expanded', 'false');
                    menuItem.next().children().first().focus();
                }
            },
            39: function (menuItem) { // right
                if (menuItem.hasClass('nav-item')) { // top level
                    menuItem.removeClass('show').children('.dropdown-menu').removeClass('show');
                    $(this).attr('aria-expanded', 'false');
                    menuItem.next().children().first().focus();
                } else if (menuItem.hasClass('second-level-menu-heading')) {
                    menuItem.removeClass('show').children('.dropdown-menu').removeClass('show');
                    $(this).attr('aria-expanded', 'false');
                    menuItem.next().find('a').focus();
                } else if (menuItem.hasClass('second-level-menu-heading-tile')) {
                    menuItem.next().find('a').focus();
                } else if (menuItem.hasClass('third-level-menu-heading-tiles')) {
                    menuItem.next().find('a').focus();
                }
            },
            38: function (menuItem) { // up
                if (menuItem.hasClass('nav-item')) { // top level
                    menuItem.removeClass('show').children('.dropdown-menu').removeClass('show');
                    $(this).attr('aria-expanded', 'false');
                } else if (menuItem.prev().length === 0) {
                    menuItem.parent().parent().removeClass('show')
                        .children('.nav-link')
                        .attr('aria-expanded', 'false');
                    menuItem.parent().parent().children().first()
                        .focus();
                } else {
                    menuItem.prev().children().first().focus();
                }
            },
            37: function (menuItem) { // left
                if (menuItem.hasClass('nav-item')) { // top level
                    menuItem.removeClass('show').children('.dropdown-menu').removeClass('show');
                    $(this).attr('aria-expanded', 'false');
                    menuItem.prev().children().first().focus();
                } else if (menuItem.hasClass('second-level-menu-heading')) {
                    menuItem.removeClass('show').children('.dropdown-menu').removeClass('show');
                    $(this).attr('aria-expanded', 'false');
                    menuItem.prev().find('a').focus();
                } else if (menuItem.hasClass('second-level-menu-heading-tile')) {
                    menuItem.prev().find('a').focus();
                } else if (menuItem.hasClass('third-level-menu-heading-tiles')) {
                    menuItem.prev().find('a').focus();
                }
            },
            27: function (menuItem) { // escape
                var parentMenu = menuItem.hasClass('show')
                    ? menuItem
                    : menuItem.closest('li.show');
                parentMenu.children('.show').removeClass('show');
                parentMenu.removeClass('show').children('.nav-link')
                    .attr('aria-expanded', 'false');
                parentMenu.children().first().focus();
            }
        },
            function () {
                return $(this).parent();
            }
        );

    $('.dropdown:not(.disabled) [data-toggle="dropdown"], .dropdown-item')
        .on('click', function (e) {
            if (!isDesktop(this)) {
                $('.modal-background').show();
                // copy parent element into current UL
                var parentCategory = $(this).text();
                var closeMenu = $('<li class="nav-menu"></li>');
                closeMenu.append($('.close-menu').first().clone()).find('.back > a').text(parentCategory);
                $(this).parent().children('.dropdown-menu')
                    .prepend(closeMenu);
                // copy navigation menu into view
                $(this).parent().addClass('show');
                $(this).attr('aria-expanded', 'true');

                if ($(this).hasClass('dropdown-toggle')) {
                    e.preventDefault();
                }
            }
        })
        .on('mouseenter', function () {
            if (isDesktop(this)) {
                var eventElement = this;
                $('.navbar-nav > li').each(function () {
                    if (!$.contains(this, eventElement)) {
                        $(this).find('.show').each(function () {
                            clearSelection(this);
                        });
                        if ($(this).hasClass('show')) {
                            $(this).removeClass('show');
                            $(this).children('ul.dropdown-menu').removeClass('show');
                            $(this).children('.nav-link').attr('aria-expanded', 'false');
                        }
                    }
                });
                var $siblingDropdownItem = $(this).siblings('.dropdown-item');
                var $siblingDropdownMenu = $(this).siblings('.dropdown-menu');

                // check to see if any siblings are showing and closes them before showing new category menu
                if ($siblingDropdownItem.hasClass('show')) {
                    $siblingDropdownItem.removeClass('show');
                    $siblingDropdownItem.children('ul.dropdown-menu')
                    .removeClass('show');
                }

                // expand down to the terniary category level on parent hover
                $(this).parent().addClass('show');
                $siblingDropdownMenu.addClass('show');
                $siblingDropdownMenu.find('.dropdown-item:first-child').addClass('show');
                $siblingDropdownMenu.find('.dropdown:first-child ul').addClass('show');
                $(this).attr('aria-expanded', 'true');

                // synch children heights of visible desktop menu cards
                if ($(this).parents('.navbar-nav')) {
                    var activeMenu = $('.dropdown.show .dropdown-item.show .dropdown-menu.show').length ? $('.dropdown.show .dropdown-item.show .dropdown-menu.show') : $('.dropdown.show .dropdown-menu.show');
                    var childTitle = activeMenu.find('.tile-title');
                    var childDescription = activeMenu.find('.tile-description');
                    var childImg = activeMenu.find('.tile-img, .no-img-placeholder');
                    utils.syncHeights(childTitle);
                    utils.syncHeights(childDescription);
                    utils.syncHeights(childImg);
                }
            }
        })
        .parent()
        .on('mouseleave', function () {
            if (isDesktop(this)) {
                $(this).removeClass('show');
                $(this).find('.dropdown-menu, .dropdown-item').removeClass('show');
                $(this).children('.nav-link').attr('aria-expanded', 'false');
            }
        });

    $('.navbar>.close-menu>.close-button').on('click', function (e) {
        e.preventDefault();
        $('.menu-toggleable-left').removeClass('in');
        $('.menu-toggleable-left').removeClass('ada-enhanced');
        $('.menu-toggleable-left').find("[aria-hidden='false']").attr('aria-hidden', true);
        $('.modal-background').hide();
    });

    $('.navbar-nav, .country-selector').on('click', '.back', function (e) {
        e.preventDefault();
        clearSelection(this);
    });

    $('.navbar-nav, .country-selector').on('click', '.close-button', function (e) {
        e.preventDefault();
        clearSelection(this);
        $('.navbar-nav').find('.top-category').detach();
        $('.navbar-nav').find('.nav-menu').detach();
        $('.navbar-nav').find('.show').removeClass('show');
        $('.menu-toggleable-left').removeClass('in');
        $('.menu-toggleable-left').find("[aria-hidden='false']").attr('aria-hidden', true);
        $('.modal-background').hide();
    });

    $('.navbar-toggler').click(function (e) {
        e.preventDefault();
        $('.main-menu').toggleClass('in');
        $('.main-menu').toggleClass('ada-enhanced');
        $('.menu-toggleable-left').find("[aria-hidden='true']").attr('aria-hidden', false);
        $('.modal-background').show();
    });

    // remove inline styles for mobile
    $(window).on('resize', function () {
        $('.tile-title, .tile-description, .tile-img, .no-img-placeholder').removeAttr('style');
    });

    keyboardAccessibility('.utility-nav .user',
        {
            40: function ($popover) { // down
                if ($popover.children('a').first().is(':focus')) {
                    $popover.children('a').first().next().focus();
                } else {
                    $popover.children('a').first().focus();
                }
            },
            38: function ($popover) { // up
                if ($popover.children('a').first().is(':focus')) {
                    $(this).focus();
                    $popover.removeClass('show');
                } else {
                    $popover.children('a').first().focus();
                }
            },
            27: function ($popover) { // escape
                $(this).focus();
                $popover.removeClass('show');
            },
            9: function ($popover) { // tab
                $popover.removeClass('show');
            }
        },
        function () {
            var $popover = $('.user .popover');
            if (!($popover.hasClass('show'))) {
                $popover.addClass('show');
            }
            return $popover;
        }
    );

    $('.utility-nav .user').on('click', function () {
        if ($('.utility-nav .user .popover').length > 0 && !isDesktop(this)) {
            $('.utility-nav .user .popover').toggleClass('show');
        }
    });

    $('.utility-nav .user').on('mouseenter focusin', function () {
        if ($('.utility-nav .user .popover').length > 0 && isDesktop(this)) {
            $('.utility-nav .user .popover').addClass('show');
        }
    });

    $('.utility-nav .user').on('mouseleave', function () {
        if (isDesktop(this)) {
            $('.utility-nav .user .popover').removeClass('show');
        }
    });
};
