"use strict";
function updateFinancingHeader(forceHideDisclaimer, useDefaultPlan) {
    var $selectedPlanInput = useDefaultPlan ? $(".financing-radio").find("input[type=radio][data-is-default-plan='true']") : $(".financing-radio").find("input[type=radio]:checked");

    if ($selectedPlanInput.length > 0) {
        $($selectedPlanInput[0]).trigger("click", {forceHideDisclaimer: forceHideDisclaimer, useDefaultPlan: useDefaultPlan});
    } else {
        $($(".financing-radio")[0]).trigger("click", {forceHideDisclaimer: forceHideDisclaimer, useDefaultPlan: useDefaultPlan});
    }
}

module.exports = function () {
    $("body").on("click", ".financing-radio", function (e, options) {
        var financingPlanTitle = $(this).find(".financing-plan-title");
        var financingPlanDisclaimer = $(this).find(".financing-plan-disclaimer");
        var financingPlan = financingPlanDisclaimer.html();
        var forceHideDisclaimer = options && options.forceHideDisclaimer ? options.forceHideDisclaimer : null;
        var useDefaultPlan = options && options.useDefaultPlan ? options.useDefaultPlan : null;

        $(".financing-options-text").html(`
            <div class="label-title financing-plan-title">${financingPlanTitle.html()}</div>
            <div class="label-disclaimer financing-plan-disclaimer d-lg-none d-xl-none">${financingPlan}</div>
        `);

        // Only adds disclaimer info if financing options are not expanded
        var $activePayment = $(".payment-options .nav-link.active");
        if (!forceHideDisclaimer && (useDefaultPlan || (!$activePayment.length || !$activePayment.hasClass("finance-card-tab")))) {
            $(".financing-options-text").append(`
                <div class="label-disclaimer financing-plan-disclaimer d-none d-sm-none d-md-none">${financingPlan}</div>
            `);
        }

        if(window.screen.width < 1024){
            if(e.target.id && e.target.id == $(this).find('input[type=radio].custom-control-input').attr('id')){
                $('.custom-control.custom-radio.financing-radio').find('.finance-radio').css('background-color','#FFF');
                $('.custom-control.custom-radio.financing-radio').find('.finance-radio').removeClass('enabled');
                $(e.currentTarget).find('.finance-radio').css('background-color','#efefef');
                $(e.currentTarget).find('.finance-radio').addClass('enabled');
            }
        }

        if(window.screen.width > 1024){
            $('.custom-control.custom-radio.financing-radio').find('.finance-radio').css('background-color','#FFF');
            $('.custom-control.custom-radio.financing-radio').find('.finance-radio').removeClass('enabled');
            $(e.currentTarget).find('.finance-radio').addClass('enabled');
        }
    });

    $(window).on('resize',function(){
        if(window.screen.width > 1024){
            $('.custom-control.custom-radio.financing-radio').find('.finance-radio').css('background-color','#FFF');
        } 

        if(window.screen.width < 1024){
            if($('.custom-control.custom-radio.financing-radio').find('.enabled')){
                $('.custom-control.custom-radio.financing-radio').find('.enabled').css('background-color','#efefef');
            }
        }
    });

    $("body").on("click", ".payment-options .nav-link", function() {
        var $el = $(this);
        if (!$el.hasClass("active")) {
            $(".tab-pane.active").each(function() {
                $(this).removeClass("active");
            })

            if ($el.hasClass("finance-card-tab")) {
                updateFinancingHeader(true);
            } else {
                updateFinancingHeader(false, true);
            }
        }

        $(".js-pay-btn").removeAttr("disabled");
    });

    $("body").on("updateFinance", function() {
        updateFinancingHeader();
    });

    var $activePayment = $(".payment-options .nav-link.active");
    if ($activePayment.length && $activePayment.hasClass("finance-card-tab")) {
        updateFinancingHeader();
    }
};
