'use strict';

/**
 * Init globally reusable modals for content assets
 *
 * The function adds an event listener on the ".modal-link" class in a button element.
 *
 * Required Attributes:
 * data-content=”#contentContainer” - This will be the Content Asset container ID.
 * data-link=”contentAssetURL” - This will be the Page Link to the Content Asset.
 *
 * Optional Attributes:
 * enable-title=”boolean” - Enable/Disable the Content Asset page title.
 * large-modal="boolean" - Enable/Disable the large modal size - will be responsive.
 */

/**
 * Parse HTML code in Ajax response
 *
 * @param {string} html - Rendered HTML from content asset
 * @return {content} - content asset components
 */
function parseAssetHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));

    var title = $html.find('.hero h1').length > 0 ? $html.find('.hero h1') : '';
    var content = $html.find('.content-asset-container').removeClass('container');

    return { title: title, content: content };
}

/**
 * Creates the content asset container
 *
 * @param {string} target - content asset ID name
 * @return {html} - content asset container
 */
function assetContainer(target) {
    var targetStr = target.substr(1);
    var htmlContainer = '<div id="' + targetStr + '" style="display: none"></div>';

    return htmlContainer;
}

var modal = {
    init: function () {
        $('body').find('.modal-link').each(function () {
            $(this).attr('data-toggle', 'modal');
        });

        $('body').on('click', '.modal-link', function (e) {
            e.preventDefault();

            var enableTitle = $(this).attr('enable-title') === 'true' ? '' : 'd-none'; // Default False
            var lgModal = $(this).attr('large-modal') === 'true' ? 'modal-lg' : ''; // Default False
            var xlModal = $(this).attr('xl-modal') === 'true' ? 'modal-xl' : ''; // Default False
            var targetLink = $(this).data('link');
            var targetContainerStr = $(this).data('content');
            var targetDialogStr = $(this).data('content') + '-dialog';
            var isVideoModal = !!$(this).hasClass('video-modal');
            var embedVideo = $(this).data('embedvideo');

            // need to prevent duplicate modals on the page
            if ($(targetDialogStr).length) {
                $(targetDialogStr).remove();
            }

            if (!$(targetContainerStr).length) {
                $(this).parent().append(assetContainer(targetContainerStr));
            }

            $(this).attr('data-target', targetDialogStr); // Bootstrap requires the data-target attribute to target the modal

            var $targetContainer = $(targetContainerStr);
            var $targetDialog = $(targetDialogStr);

            if ($targetDialog.length > 0) {
                $targetDialog.modal('show');
            } else {
                $.ajax({
                    url: targetLink,
                    method: 'GET',
                    dataType: 'html',
                    beforeSend: function () {
                        $.spinner().start();
                    },
                    success: function (data) {
                        var parsedAssetHtml = parseAssetHtml(data);
                        var modalTitle = parsedAssetHtml.title[0] && parsedAssetHtml.title[0].textContent ? parsedAssetHtml.title[0].textContent : '';

                        $targetContainer.html(parsedAssetHtml.content);
                        var contentAssetHtml = $targetContainer.html();
                        var htmlString = '<!-- Modal -->'
                            + '<div class="modal fade " id="' + targetDialogStr.substr(1) + '" tabindex="-1" role="dialog" aria-labelledby="modal-title" data-la-initdispnone="true">'
                            + '<div class="modal-dialog ' + lgModal + ' ' + xlModal + '" role="document">'
                            + '<!-- Modal content-->'
                            + '<div class="modal-content">'
                            + '<div class="modal-header">'
                            + '<div><h4 class="modal-title ' + enableTitle + '">' + modalTitle + '</h4></div>'
                            + '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'
                            + '<span aria-hidden="true"></span>'
                            + '</button>'
                            + '</div>'
                            + '<div class="modal-body">' + contentAssetHtml + '</div>'
                            + '<div class="modal-footer">'
                            + '<button class="btn btn-primary close-btn" data-dismiss="modal">'
                            + 'Close'
                            + '</button>'
                            + '</div>'
                            + '</div>'
                            + '</div>'
                            + '</div>';

                        var videoHtmlString = '<!-- Modal -->'
                            + '<div class="modal fade" id="' + targetDialogStr.substr(1) + '" tabindex="-1" role="dialog" aria-labelledby="modal-title" data-la-initdispnone="true">'
                            + '<div class="modal-dialog modal-xl video-modal" role="document">'
                            + '<!-- Modal content-->'
                            + '<div class="modal-content bg-dark">'
                            + '<div class="modal-header">'
                            + '<div><h4 class="modal-title ' + enableTitle + '">' + modalTitle + '</h4></div>'
                            + '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'
                            + '<span aria-hidden="true"></span>'
                            + '</button>'
                            + '</div>'
                            + '<div class="modal-body">' + contentAssetHtml + '</div>'
                            + '</div>'
                            + '</div>'
                            + '</div>';

                        if (isVideoModal) {
                            $('#main').append(videoHtmlString);
                            var $modal = $('#main').find(targetDialogStr);
                            var videoElementSelector = '#video';

                            var youtubeURL = $modal.find('.embed-responsive').length > 0 ? $modal.find('.embed-responsive').data('src') : '';

                            if (youtubeURL) {
                                videoElementSelector = '.embed-responsive-item';
                                embedVideo = youtubeURL;
                            }

                            if (embedVideo && !($modal.find(videoElementSelector).attr('src'))) {
                                // when the modal is opened autoplay it
                                $modal.on('shown.bs.modal', function () {
                                    $(this).find(videoElementSelector).attr('src', embedVideo + '?autoplay=1&controls=0');
                                });
                                // stop playing the youtube video when I close the modal
                                $modal.on('hide.bs.modal', function () {
                                    $(this).find(videoElementSelector).attr('src', embedVideo);
                                });
                            }
                        } else {
                            $('#main').append(htmlString);
                        }

                        $(targetDialogStr).modal('show');
                        $.spinner().stop();
                    }
                });

                $targetDialog.find('.close, .close-btn').on('click', function () {
                    $targetDialog.modal('hide');
                });
            }
        });
    }
};

module.exports = function () {
    modal.init();
};
