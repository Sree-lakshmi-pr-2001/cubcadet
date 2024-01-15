'use strict';

var server = require('server');

var cache = require('*/cartridge/scripts/middleware/cache');
var imageHelpers = require('*/cartridge/scripts/helpers/imageHelpers');

/**
 * DIS-GetURL
 *
 * Route to allow for fetching of DIS URLs for content, product or cartridge images in MarkupText attributes.
 *
 * Examples: Use transformed images in the body of a content asset, HTML content slot or product description.
 *
 * Http parameter options:
 * src (String) - Relative path of image within root of static library set by the context parameter.
 * context (String) - Which static directory will be utilized. Values are 'catalog', 'content', or 'cartridge'.
 * contextId (String, optional) - When context is set to 'catalog', the ID of the catalog to be used. Default is whichever catalog is assigned to the storefront.
 *
 * You may also use any of the parameters listed within the DIS documentation here:
 * https://documentation.demandware.com/DOC2/index.jsp?topic=%2Fcom.demandware.dochelp%2FImageManagement%2FCreatingImageTransformationURLs.html
 *
 * Use like this in your content asset code:
 * <img src="$include('DIS-GetURL', 'context', 'catalog', 'src', 'example-directory/example-image.jpg', 'scaleWidth', '1440')$" />
 *
 **/

server.get(
    'GetURL',
    server.middleware.include,
    cache.applyDefaultCache,
    function (req, res, next) {
        var params = req.querystring;
        var urlString = '';

        if (Object.prototype.hasOwnProperty.call(params, 'src') && Object.prototype.hasOwnProperty.call(params, 'context')) {
            var URL = require('dw/web/URL');

            // migrating relevant data from parameter map to transform object
            var transform = {};
            Object.keys(params).forEach(function (key) {
                var type = imageHelpers.getTransformParameterType(key);

                if (type !== null) {
                    transform[key] = request.httpParameterMap[key][type]; // eslint-disable-line no-undef
                }
            });

            // get URL, and if it's good, save as string
            var tempURL = imageHelpers.getImageURL(transform, params.src, params.context, params.contextId);
            if (tempURL instanceof URL) {
                urlString = tempURL.toString();
            }
        }

        res.print(urlString);

        next();
    }
);

module.exports = server.exports();