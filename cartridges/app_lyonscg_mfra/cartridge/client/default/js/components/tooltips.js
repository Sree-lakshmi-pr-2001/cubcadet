'use strict';

$(document).ready(function () {
    $(function () {
        $('[data-toggle="tooltip"]').tooltip();

        // pass in html for tooltip content
        $('[data-toggle="html-tooltip"]').tooltip({
            html: true,
            position: 'top'
        });
        $('[data-toggle="popover"]').popover({
            trigger: 'manual'
        });
        $('[data-toggle="popover"]').on('click mouseover mouseout', function () {
            $(this).popover('toggle');
        });
        $('[data-toggle="popover"]').keyup(function (e) {
            var code = e.key;
            if (code === 'Enter') e.preventDefault();
            if (code === ' ' || code === 'Enter') {
                $(this).popover('toggle');
            }
        });
    });
});
