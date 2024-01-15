'use strict';

/**
 * Show iframe video in modal window
 * @param  {string} videoID Youtube video ID
 */
function showVideo(videoID) {
    var htmlString = '<!-- Modal -->'
        + '<div class="modal fade" id="VideoModal" role="dialog" aria-labelledby="modal-title" data-la-initdispnone="true">'
            + '<div class="modal-dialog modal-lg video-dialog"> role="document"'
                + '<!-- Modal content-->'
                + '<div class="modal-content">'
                    + '<div class="modal-header">'
                        + '<button type="button" class="close pull-right" data-dismiss="modal">'
                            + '&times;'
                        + '</button>'
                    + '</div>'
                    + '<div class="modal-body">'
                        + '<div class="video-container">'
                            + '<iframe title="youtube video" src="//www.youtube.com/embed/' + videoID + '?autoplay=1" id="ytplayer" class="iframe-video" type="text/html" frameborder="0"></iframe>'
                        + '</div>'
                    + '</div>'
                    + '<div class="modal-footer"></div>'
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

/* eslint-disable */
/**
 * Show Embed iframe video
 * @param  {string} videoID Youtube video ID
 */
function showEmbedVideo(videoID) {
    /**
     * Loading YT script
     */
    function loadPlayer() {
        if (typeof (YT) == 'undefined' || typeof (YT.Player) == 'undefined') {
            var tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            window.onYouTubePlayerAPIReady = function () {
                onYouTubePlayer();
            };
        }
    }

    var player;
    /**
     * Init YT iframe
     */
    function onYouTubePlayer() {
        player = new YT.Player('player', {
            height: '720',
            width: '1280',
            videoId: videoID,
            events: {
                'onReady': onPlayerReady
            }
        });
    }

    /**
     * Play video
     */
    function onPlayerReady(event) {
        event.target.playVideo();
    }

    loadPlayer();
}
/* eslint-enable */

/**
 * Initialize Video functionality
 */
function video() {
    $('body').on('click', '.js-video-link', function (e) {
        var $link = $(this);

        if ($link.data('id')) {
            e.preventDefault();

            showVideo($link.data('id'));
        }
    });

    $(document).ready(function () {
        if ($('.js-embed-video-link').length) {
            var $videoWrapper = $('.js-embed-video-link');
            if ($videoWrapper.data('id')) {
                showEmbedVideo($videoWrapper.data('id'));
            }
        }
    });
}

module.exports = video;
