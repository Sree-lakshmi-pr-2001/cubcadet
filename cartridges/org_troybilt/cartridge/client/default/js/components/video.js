'use strict';

/**
 * Show iframe video in modal window
 * @param  {string} videoID Youtube video ID
 */
function showVideo(videoID) {
    var htmlString = '<!-- Modal -->'
        + '<div class="modal fade" id="VideoModal" tabindex="-1" role="dialog" aria-labelledby="modal-title" data-la-initdispnone="true">'
        + '<div class="modal-dialog modal-xl video-modal" role="document">'
        + '<!-- Modal content-->'
        + '<div class="modal-content bg-dark">'
        + '<div class="modal-header">'
        + '<div><h4 class="modal-title"></h4></div>'
        + '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'
        + '<span aria-hidden="true"></span>'
        + '</button>'
        + '</div>'
        + '<div class="modal-body">'
        + '<div class="video-container">'
        + '<iframe title = "youtube video" src="//www.youtube.com/embed/' + videoID + '?autoplay=1" id="ytplayer" class="iframe-video" type="text/html" frameborder="0"></iframe>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '</div>';

    $('#main').append(htmlString);

    $('#VideoModal').on('hide.bs.modal', function () {
        $('#VideoModal').remove();
    });
    $('#VideoModal').modal('show');
}

/**
 * Initialize Video functionality
 */
function video() {
    $('body').on('click keydown', '.js-video-link', function (e) {
        if (e.type === 'click' || e.which === 13 || e.which === 32) {
            var $link = $(this);
            if ($link.data('id')) {
                e.preventDefault();

                showVideo($link.data('id'));
            }
        }
    });
}

module.exports = video;
