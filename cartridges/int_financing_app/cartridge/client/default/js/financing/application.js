'use strict';
var clientSideValidation = require('org_ma/components/clientSideValidation');
/**
 * Show Dialog Message
 * @param {string} msg - message to show
 * @param {string} title - title for dialog window
 */
function showDialogMsg(msg, title) {
    var financeMsgDialog = $('#financeMsg');
    if (financeMsgDialog.length > 0) {
        financeMsgDialog.remove();
    }
    var enableTitle = title ? '' : 'd-none';
    var htmlString = '<!-- Modal -->'
        + '<div class="modal fade" id="financeMsg" role="dialog" style="display: block;" aria-labelledby="modal-title" data-la-initdispnone="true">'
        + '<div class="modal-dialog" role="document">'
        + '<!-- Modal content-->'
        + '<div class="modal-content">'
        + '<div class="modal-header">'
        + '    <h4 class="modal-title ' + enableTitle + '">' + title + '</h4>'
        + '    <button type="button" class="close pull-right" data-dismiss="modal">'
        + '        &times;'
        + '    </button>'
        + '</div>'
        + '<div class="modal-body">' + msg + '</div>'
        + '<div class="modal-footer">'
        + '</div>'
        + '</div>'
        + '</div>'
        + '</div>';
    if ($('#main').length) $('#main').append(htmlString);
    if ($('#checkout-main').length) $('#checkout-main').append(htmlString);
    $('#financeMsg').modal('show');
}

/**
 * Day validation due to selected month and year
 */
function dayValidation() {
    var yearSelector = $('#financeYear');
    var monthSelector = $('#financeMonth');
    var daySelector = $('#financeDay');

    var year = yearSelector.val();
    var month = monthSelector.val();
    var day = daySelector.val();

    var dayMonthList = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var monthLength = dayMonthList[Number(month) - 1];

    if (month === '2') {
        monthLength += (!(year & 3) && ((year % 100) !== 0 || !(year & 15)));
    }
    var fistOptionText = daySelector.find('option:eq(0)').text();
    // Clear options
    daySelector[0].length = 0;
    for (var i = 0; i <= monthLength; i++) {
        var option = new Option();
        if (i === 0) {
            option.value = '';
            option.text = fistOptionText;
        } else {
            option.value = i;
            option.text = i;
        }

        if (i === Number(day)) {
            option.selected = true;
        }
        daySelector[0].add(option);
    }
}

/**
 * Update Estimation Block (on cart page)
 */
function updateEstimationBlock() {
    var estimationBlock = $('#financeInfoCart').find('.estimation-finance-info');
    var financeCartBlock = $('#financeInfoCart');
    var tdEstimationBlock = $('#financeInfoCart').find('.td-estimation');
    if (estimationBlock.length > 0) {
        var updateUrl = estimationBlock.data('url');
        $.ajax({
            url: updateUrl,
            type: 'get',
            success: function (data) {
                $.spinner().stop();
                if (data.isDisplay) {
                    financeCartBlock.show();
                } else {
                    financeCartBlock.hide();
                }
                tdEstimationBlock.replaceWith(data.content);
            },
            error: function () {
                $.spinner().stop();
            }
        });
    }
}

/**
 * Init Lookup Submit
 */
function initLookupSubmit() {
    $('form[name$=_accountLookup]').on('submit', function (e) {
        e.preventDefault();
        $('.account-lookup-error').addClass('d-none');
        var url = $(this).attr('action');

        var formData = $(this).serialize();

        $.spinner().start();
        $.ajax({
            url: url,
            type: 'post',
            data: formData,
            success: function (data) {
                $.spinner().stop();
                if (typeof data === 'object') {
                    $('.account-lookup-error').removeClass('d-none');
                } else {
                    var financeDialog = $('#financeMsg');
                    financeDialog.find('.modal-body').html(data);
                    var dialogTitle = financeDialog.find('.result-info').data('title');
                    financeDialog.find('.modal-title').text(dialogTitle);
                }
            },
            error: function () {
                $.spinner().stop();
            }
        });
        return false;
    });
}

/**
 * Update billing step with estimation block and financing plans
 */
function updateBillingStep() {
    var estimationBlock = $('.finance-estimation-block');
    var financingPlanBlock = $('.financing-plans-list');
    if (estimationBlock.length > 0) {
        var estimationUrl = estimationBlock.data('url');
        $.ajax({
            url: estimationUrl,
            type: 'get',
            success: function (data) {
                estimationBlock.html(data);
            },
            error: function () {
            }
        });
    }
    if (financingPlanBlock.length > 0) {
        var plansUrl = financingPlanBlock.data('url');
        $.ajax({
            url: plansUrl,
            type: 'get',
            success: function (data) {
                financingPlanBlock.html(data);
                $("body").trigger("updateFinance", {});
            },
            error: function () {
            }
        });
    }
}

module.exports = {
    methods: {
        updateEstimationBlock: updateEstimationBlock,
        updateBillingStep: updateBillingStep
    },
    getUrl: function () {
        $('body').on('click', '.finance-link, .td-apply-finance', function (e) {
            e.preventDefault();
            var url = $(this).data('url');
            $.spinner().start();
            $.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                success: function (jsonResponse) {
                    $.spinner().stop();
                    if (jsonResponse.success) {
                        window.location.href = jsonResponse.url;
                    } else if ('msg' in jsonResponse) {
                        showDialogMsg(jsonResponse.msg);
                    }
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },
    showDetails: function () {
        $('body').on('click', '.td-payment-details', function (e) {
            e.preventDefault();
            var url = $(this).data('url');
            var title = $(this).data('title');
            $.spinner().start();
            $.ajax({
                url: url,
                type: 'get',
                success: function (data) {
                    $.spinner().stop();
                    showDialogMsg(data, title);
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },
    accountLookup: function () {
        $('body').on('click', '.finance-account-lookup-link', function (e) {
            e.preventDefault();
            var url = $(this).data('url');
            var dialogTitle = $(this).data('title');
            $.spinner().start();
            $.ajax({
                url: url,
                type: 'get',
                success: function (data) {
                    $.spinner().stop();
                    showDialogMsg(data, dialogTitle);
                    clientSideValidation.invalid();
                    clientSideValidation.submit();
                    initLookupSubmit();
                    $('#financeYear').on('change', dayValidation);
                    $('#financeMonth').on('change', dayValidation);
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
        $('body').on('click', '.copy-to-clipboard', function (e) {
            e.preventDefault();
            var accountNumber = $('#foundAccountNumber').val();
            var $temp = $('<input>');
            $('body').append($temp);
            $temp.val(accountNumber).select();
            document.execCommand('copy');
            $temp.remove();
        });
        $('body').on('click', '.print-account', function (e) {
            e.preventDefault();
            var divToPrint = $('#foundAccountToPrint').html();
            var frame1 = $('<iframe />');
            frame1[0].name = 'frame1';
            frame1.css({ position: 'absolute', top: '-1000000px' });
            $('body').append(frame1);
            var frameDoc = frame1[0].contentWindow || frame1[0].contentDocument.document || frame1[0].contentDocument;
            frameDoc.document.open();
            // Create a new HTML document.
            frameDoc.document.write('<html><head><title></title>');
            frameDoc.document.write('</head><body>');
            // Append the DIV contents.
            frameDoc.document.write(divToPrint);
            frameDoc.document.write('</body></html>');
            frameDoc.document.close();
            setTimeout(function () {
                window.frames.frame1.focus();
                window.frames.frame1.print();
                frame1.remove();
            }, 500);
        });
        $('body').on('click', '.use-account', function (e) {
            e.preventDefault();
            var accountNumber = $('#foundAccountNumber').val();
            $('#accountNumber').val(accountNumber);
            $('#financeMsg').modal('hide');
        });
    },

    prequalUrl: function () {
        $('.prequal').on('click', function (e) {
            e.preventDefault();
            var url = $(this).data('prequalurl');
            $.spinner().start();
            $.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                success: function (jsonResponse) {
                    $.spinner().stop();
                    if (jsonResponse.success) {
                        window.location.href = jsonResponse.url;
                    } else if ('msg' in jsonResponse) {
                        showDialogMsg(jsonResponse.msg);
                    }
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },
};
