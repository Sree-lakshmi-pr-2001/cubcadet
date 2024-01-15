'use strict';

var utils = require('lyonscg/util/utils');
var carousels = require('../components/carousels');

module.exports = {
    tabsInit: function () {
        var $tabRoot = $('.dealer-tabs');
        var $tabAllHeadings = $('[data-tab-heading]');
        var $tabAllContents = $('[data-tab-content]');

        /**
         * Highlights the active tab heading
         */
        function setHeadingActiveBg() {
            var $tabHeadingBg = $('.dealer-tab-heading-active-bg');
            var $tabHeadingActive = $('.dealer-tab-heading.active');
            $tabHeadingBg.css('left', $tabHeadingActive.position().left + 'px');
            $tabHeadingBg.css('width', $tabHeadingActive.innerWidth() + 'px');
        }
        setHeadingActiveBg();
        utils.smartResize(setHeadingActiveBg);

        $tabAllHeadings.on('click', function (e) {
            e.preventDefault();
            if ($tabRoot.hasClass('js-sliding')) return;
            var isDesktop = utils.mediaBreakpointUp('lg');
            var isActiveTabClicked = $(this).hasClass('active');
            if (isActiveTabClicked && isDesktop) return;
            var activeTabId = $(this).data('tab-heading');
            // Handle the tab heading
            var $tabActiveHeadings = $('[data-tab-heading="' + activeTabId + '"]');
            $tabAllHeadings.removeClass('active');
            $tabAllHeadings.attr('aria-expanded', 'false');
            if (!isActiveTabClicked) {
                $tabActiveHeadings.addClass('active');
                $tabActiveHeadings.attr('aria-expanded', 'true');
            }
            // Handle the tab content
            var $tabActiveContent = $('[data-tab-content="' + activeTabId + '"]');
            $tabRoot.addClass('js-sliding');
            if (isActiveTabClicked) {
                $tabActiveContent.stop().slideUp(500, function () {
                    $tabRoot.removeClass('js-sliding');
                    $(this).removeClass('active').removeAttr('style');
                });
            } else {
                $tabActiveContent.stop().slideDown(500, function () {
                    $tabRoot.removeClass('js-sliding');
                    $(this).addClass('active').removeAttr('style');
                });
                $tabAllContents.not($tabActiveContent).slideUp(500, function () {
                    $(this).removeClass('active').removeAttr('style');
                });
            }
            // Update heading active bg
            setHeadingActiveBg();
            // Recalculate the slick slider height
            $(window).resize();
        });
    },

    promotionsCarousel: function () {
        carousels.promotionsCarousel();
    },

    newsCarousel: function () {
        carousels.newsCarousel();
    },

    forms: function () {
        $('#testDriveForm').on('submit', function (event) {
            event.preventDefault();
            // Validate Checkboxes
            var $availableProducts = $(this).find('.available-products-group [type="checkbox"]');
            var hasCheckedProduct = $availableProducts.is(':checked');
            var $feedback = $(this).find('.available-products-group .custom-invalid-feedback');
            if (!hasCheckedProduct) {
                $feedback.show();
                return false;
            } else { // eslint-disable-line no-else-return
                $feedback.hide();
            }
            // Validate Recaptcha
            var $recaptcha = $('#testDriveRecaptcha');
            $('#testDriveFormSuccessMessage').css('display', 'none');
            $('#testDriveFormErrorMessage').css('display', 'none');
            if (window.grecaptcha.getResponse(window.testDriveRecaptcha).length === 0) {
                $recaptcha.next('.invalid-feedback').show();
                return false;
            } else { // eslint-disable-line no-else-return
                $recaptcha.next('.invalid-feedback').hide();
                $('#testDriveForm').css('display', 'none');
            }
            $.post($(this).attr('action'), $(this).serialize(), function (json) {
                if (json.success) {
                    $('#testDriveFormSuccessMessage').css('display', 'block');
                } else {
                    $('#testDriveFormErrorMessage').css('display', 'block');
                }
            }, 'json').fail(function () {
                $('#testDriveFormErrorMessage').css('display', 'block');
            });
            return false;
        });

        $('#contactUsForm').on('submit', function (event) {
            event.preventDefault();
            var $recaptcha = $('#contactUsRecaptcha');
            $('#contactUsFormSuccessMessage').css('display', 'none');
            $('#contactUsFormErrorMessage').css('display', 'none');
            if (window.grecaptcha.getResponse(window.contactUsRecaptcha).length === 0) {
                $recaptcha.next('.invalid-feedback').show();
                return false;
            } else { // eslint-disable-line no-else-return
                $recaptcha.next('.invalid-feedback').hide();
                $('#contactUsForm').css('display', 'none');
            }
            $.post($(this).attr('action'), $(this).serialize(), function (json) {
                if (json.success) {
                    $('#contactUsFormSuccessMessage').css('display', 'block');
                } else {
                    $('#contactUsFormErrorMessage').css('display', 'block');
                }
            }, 'json').fail(function () {
                $('#contactUsFormErrorMessage').css('display', 'block');
            });
            return false;
        });

        $('[type="tel"]').on('input', function () {
            var inputValue = $(this).val();
            var filteredInput = inputValue.replace(/[^\d]/g, '');
            $(this).val(filteredInput);
        });
    },

    dealerGoogleReveiws: function () {
        var starWidth = 15;

        $.fn.stars = function () {
            return $(this).each(function () {
                $(this).html($('<span />').width(Math.max(0, (Math.min(5, parseFloat($(this).html())))) * starWidth));
            });
        };

        $(document).ready(function () {
            if (window.matchMedia('(min-width: 767px)').matches) {
                $('.dealer-home .dealer-details .dealer-details-general').find('span.dealer-review-star').stars();
            } else {
                $('.dealer-home .dealer-details .dealer-details-website-reviews').find('span.dealer-review-star').stars();
            }
        });
    }
};
