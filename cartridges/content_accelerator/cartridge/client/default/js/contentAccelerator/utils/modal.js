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
                    success: function (data) {
                        var parsedAssetHtml = parseAssetHtml(data);
                        var modalTitle = parsedAssetHtml.title[0] && parsedAssetHtml.title[0].textContent ? parsedAssetHtml.title[0].textContent : '';


                        $targetContainer.html(parsedAssetHtml.content);
                        var contentAssetHtml = $targetContainer.html();
                        var htmlString = '<!-- Modal -->'
                            + '<div class="modal fade" id="' + targetDialogStr.substr(1) + '" tabindex="-1" role="dialog" aria-labelledby="modal-title" data-la-initdispnone="true">'
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

                            if (embedVideo && !($(targetDialogStr).find('#video').attr('src'))) {
                                // when the modal is opened autoplay it
                                $(targetDialogStr).on('shown.bs.modal', function () {
                                    $(targetDialogStr).find('#video').attr('src', embedVideo + '?autoplay=1&controls=0');
                                });
                                // stop playing the youtube video when I close the modal
                                $(targetDialogStr).on('hide.bs.modal', function () {
                                    $(targetDialogStr).find('#video').attr('src', embedVideo);
                                });
                            } else {
                                var videoSrc = $(targetDialogStr).find('div[data-src]').attr('data-src');
                                $(targetDialogStr).on('shown.bs.modal', function () {
                                    $(targetDialogStr).find('iframe').attr('src', videoSrc + '?autoplay=1&controls=0');
                                });

                                $(targetDialogStr).on('hide.bs.modal', function () {
                                    $(targetDialogStr).find('iframe').attr('src', videoSrc);
                                });
                            }
                        } else {
                            $('#main').append(htmlString);
                        }
                        // can't use variable $targetDialog for some reason, tries to run before ajax finishes even on ajax event complete.
                        $(targetDialogStr).modal('show');
                    }
                });
            }

            $targetDialog.find('.close, .close-btn').on('click', function () {
                $targetDialog.modal('hide');
            });
        });
    }
};

module.exports = function () {
    modal.init();
};
