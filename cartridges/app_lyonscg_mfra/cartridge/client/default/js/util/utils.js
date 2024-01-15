'use strict';

var _ = require('lodash');

var utils = {
    /**
     * @desc Media breakpoints that are used throughout the Javascript
     */
    breakpoints: { // updated with Cub Breakpoints
        xs: 0,
        sm: 544,
        md: 768,
        lg: 1025,
        xl: 1366
    },

    /**
     * @function
     * @description Returns either an object with all of the available breakpoints or a specific viewport based on the given size
     * @param {string=} size The viewport to return
     * @param {Object=} breakpoints A custom breakpoints object
     * @returns {Object|string} - breakpoints or specific viewport
     */
    getViewports: function (size, breakpoints) {
        var bps = breakpoints || this.breakpoints;

        if (size) {
            var viewport = bps[size];

            if (viewport) {
                return viewport;
            }

            window.console.error('Unexpected viewport size given in util.getViewports');
            throw new Error('Unexpected viewport size given in util.getViewports');
        } else {
            return breakpoints;
        }
    },

    /**
     * @function
     * @description Returns the current viewport name (ex: 'medium') or 'max' if the current window is larger than any defined viewport width
     * @returns {string} - current viewport name
     */
    getCurrentViewport: function () {
        var w = window.innerWidth;
        var viewports = utils.getViewports();
        var viewport = 'max';
        // Traverse the object from small up to desktop, and return the first match
        _.each(viewports, function (value, name) {
            if (w <= value) {
                viewport = name;
            }
        });
        return viewport;
    },

    /**
     * @function
     * @description appends the parameter with the given name and value to the given url and returns the changed url
     * @param {string} url the url to which the parameter will be added
     * @param {string} name the name of the parameter
     * @param {string} value the value of the parameter
     * @returns {string} - URL with parameter
     */
    appendParamToURL: function (url, name, value) {
        // quit if the param already exists
        if (url.indexOf(name + '=') !== -1) {
            return url;
        }
        var separator = url.indexOf('?') !== -1 ? '&' : '?';
        return url + separator + name + '=' + encodeURIComponent(value);
    },

    /**
     * @function
     * @description remove the parameter and its value from the given url and returns the changed url
     * @param {string} url the url from which the parameter will be removed
     * @param {string} name the name of parameter that will be removed from url
     * @returns {string} - URL without parameter
     */
    removeParamFromURL: function (url, name) {
        if (url.indexOf('?') === -1 || url.indexOf(name + '=') === -1) {
            return url;
        }
        var hash;
        var params;
        var domain = url.split('?')[0];
        var paramUrl = url.split('?')[1];
        var newParams = [];
        // if there is a hash at the end, store the hash
        if (paramUrl.indexOf('#') > -1) {
            hash = paramUrl.split('#')[1] || '';
            paramUrl = paramUrl.split('#')[0];
        }
        params = paramUrl.split('&');
        for (var i = 0; i < params.length; i++) {
            // put back param to newParams array if it is not the one to be removed
            if (params[i].split('=')[0] !== name) {
                newParams.push(params[i]);
            }
        }
        return domain + '?' + newParams.join('&') + (hash ? '#' + hash : '');
    },

    /**
     * appends params to a url
     * @param {string} url - Original url
     * @param {Object} params - Parameters to append
     * @returns {string} result url with appended parameters
     */
    appendToUrl: function (url, params) {
        var newUrl = url;
        newUrl += (newUrl.indexOf('?') !== -1 ? '&' : '?') + Object.keys(params).map(function (key) {
            return key + '=' + encodeURIComponent(params[key]);
        }).join('&');

        return newUrl;
    },

    /**
     * @function
     * @description extract the query string from URL
     * @param {string} url the url to extra query string from
     * @returns {string|Object} - Query String from URL
     **/
    getQueryString: function (url) {
        var qs;
        if (!_.isString(url)) {
            return null;
        }
        var a = document.createElement('a');
        a.href = url;
        if (a.search) {
            qs = a.search.substr(1); // remove the leading ?
        }
        return qs;
    },

    /**
     * @function
     * @description Checks to see if the given element is in the current viewport
     * @param {string} el - Element to check
     * @param {string} offsetToTop - Offset to give the top value
     * @returns {boolean} - Whether or not the element is in the viewport
     */
    elementInViewport: function (el, offsetToTop) {
        var top = el.offsetTop;
        var left = el.offsetLeft;
        var width = el.offsetWidth;
        var height = el.offsetHeight;

        while (el.offsetParent) {
            var offsetParent = el.offsetParent;
            top += offsetParent.offsetTop;
            left += offsetParent.offsetLeft;
        }

        if (typeof offsetToTop !== 'undefined') {
            top -= offsetToTop;
        }

        if (window.pageXOffset !== null) {
            return (
                top < (window.pageYOffset + window.innerHeight) &&
                left < (window.pageXOffset + window.innerWidth) &&
                (top + height) > window.pageYOffset &&
                (left + width) > window.pageXOffset
            );
        }

        if (document.compatMode === 'CSS1Compat') {
            return (
                top < (window.document.documentElement.scrollTop + window.document.documentElement.clientHeight) &&
                left < (window.document.documentElement.scrollLeft + window.document.documentElement.clientWidth) &&
                (top + height) > window.document.documentElement.scrollTop &&
                (left + width) > window.document.documentElement.scrollLeft
            );
        }

        return false;
    },

    /**
     * @function
     * @description Appends the parameter 'format=ajax' to a given path
     * @param {string} path the relative path
     * @returns {string} - URL with format param of ajax
     */
    ajaxUrl: function (path) {
        return this.appendParamToURL(path, 'format', 'ajax');
    },

    /**
     * @function
     * @description Converts the given relative URL to an absolute URL
     * @param {string} url - URL to convert
     * @returns {string} - Absolute URL
     */
    toAbsoluteUrl: function (url) {
        var absURL = url;
        if (url.indexOf('http') !== 0 && url.charAt(0) !== '/') {
            absURL = '/' + url;
        }
        return absURL;
    },

    /**
     * @function
     * @description Loads css dynamically from given urls
     * @param {Array} urls Array of urls from which css will be dynamically loaded.
     */
    loadDynamicCss: function (urls) {
        var i = urls.length;
        var len = urls.length;
        for (i = 0; i < len; i++) {
            this.loadedCssFiles.push(this.loadCssFile(urls[i]));
        }
    },

    /**
     * @function
     * @description Loads css file dynamically from given url
     * @param {string} url The url from which css file will be dynamically loaded.
     * @returns {jQuery} - CSS Link Element
     */
    loadCssFile: function (url) {
        return $('<link/>').appendTo($('head')).attr({
            type: 'text/css',
            rel: 'stylesheet'
        }).attr('href', url); // for i.e. <9, href must be added after link has been appended to head
    },
    // array to keep track of the dynamically loaded CSS files
    loadedCssFiles: [],

    /**
     * @function
     * @description Removes all css files which were dynamically loaded
     */
    clearDynamicCss: function () {
        var i = this.loadedCssFiles.length;
        while (i-- > 0) {
            $(this.loadedCssFiles[i]).remove();
        }
        this.loadedCssFiles = [];
    },

    /**
     * @function
     * @description Extracts all parameters from a given query string into an object
     * @param {string} qs The query string from which the parameters will be extracted
     * @returns {Object} - Object with params from the query string
     */
    getQueryStringParams: function (qs) {
        if (!qs || qs.length === 0) { return {}; }
        var params = {};
        var unescapedQS = decodeURIComponent(qs);
        // Use the String::replace method to iterate over each
        // name-value pair in the string.
        unescapedQS.replace(new RegExp('([^?=&]+)(=([^&]*))?', 'g'),
            function ($0, $1, $2, $3) {
                params[$1] = $3;
            }
        );
        return params;
    },

    /**
     * @function
     * @description Fills in the given form with the given address information
     * @param {Object} address - Address fields object
     * @param {Object} $form - Form jQuery object
     */
    fillAddressFields: function (address, $form) {
        var fields = Object.keys(address);
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            if (field !== 'ID' && field !== 'UUID' && field !== 'key') {
                // if the key in address object ends with 'Code', remove that suffix
                // keys that ends with 'Code' are postalCode, stateCode and countryCode
                $form.find('[name$="' + field.replace('Code', '') + '"]').val(address[field]);
                // update the state fields
                if (field === 'countryCode') {
                    $form.find('[name$="country"]').trigger('change');
                    // retrigger state selection after country has changed
                    // this results in duplication of the state code, but is a necessary evil
                    // for now because sometimes countryCode comes after stateCode
                    $form.find('[name$="state"]').val(address.stateCode);
                }
            }
        }
    },

    /**
     * @function
     * @description Binds the onclick-event to a delete button on a given container,
     *              which opens a confirmation box with a given message
     * @param {string} container - The name of element to which the function will be bind
     * @param {string} message - The message the will be shown upon a click
     */
    setDeleteConfirmation: function (container, message) {
        $(container).on('click', '.delete', function () {
            return window.confirm(message); // eslint-disable-line
        });
    },

    /**
     * @function
     * @description Scrolls a browser window to a given x point
     * @param {string} xLocation - The x coordinate
     */
    scrollBrowser: function (xLocation) {
        $('html, body').animate({
            scrollTop: xLocation
        }, 500);
    },

    /**
     * @function
     * @desc Determines if the device that is being used is mobile
     * @returns {boolean} - Wether or not the browser is currently mobile
     */
    isMobile: function () {
        var mobileAgentHash = ['mobile', 'tablet', 'phone', 'ipad', 'ipod', 'android', 'blackberry', 'windows ce', 'opera mini', 'palm'];
        var idx = 0;
        var isMobile = false;
        var userAgent = (navigator.userAgent).toLowerCase();

        while (mobileAgentHash[idx] && !isMobile) {
            isMobile = (userAgent.indexOf(mobileAgentHash[idx]) >= 0);
            idx++;
        }
        return isMobile;
    },

    /**
     * @function
     * @description Executes a callback function when the user has stopped resizing the screen.
     * @param {function} callback - Callback function for the resize event
     * @return  {function} - Callback function for the resize event
     */
    smartResize: function (callback) {
        var timeout;

        $(window).on('resize', function () {
            clearTimeout(timeout);
            timeout = setTimeout(callback, 100);
        }).resize();

        return callback;
    },

    /**
     * @function
     * @desc Generates a min-width matchMedia media query based on the given params
     * @param {string} size - Breakpoint to use for the media query
     * @param {Object} breakpoints - Override of the util breakpoints (optional)
     * @returns {boolean} - Wether or not the given media query matches
     */
    mediaBreakpointUp: function (size, breakpoints) {
        var breakpoint = this.getViewports(size, breakpoints);
        var mediaQuery = window.matchMedia('(min-width: ' + breakpoint + 'px)');
        return mediaQuery.matches;
    },

    /**
     * @function
     * @desc Generates a min-width matchMedia media query based on the given params
     * @param {string} size - Breakpoint to use for the media query
     * @param {Object} breakpoints - Override of the util breakpoints object (optional)
     * @returns {boolean} - Wether or not the given media query matches
     */
    mediaBreakpointDown: function (size, breakpoints) {
        var bps = typeof breakpoints !== 'undefined' ? breakpoints : this.breakpoints;
        var nextSize = this.getNextObjectKey(bps, size);

        if (typeof nextSize === 'string') {
            var breakpoint = this.getViewports(nextSize, breakpoints) - 1;
            var mediaQuery = window.matchMedia('(max-width: ' + breakpoint + 'px)');
            return mediaQuery.matches;
        }

        return true;
    },

    /**
     * @function
     * @desc Generates a min-width and max-width matchMedia media queries based on the given params
     * @param {string} sizeMin - Min breakpoint to use for the media query
     * @param {string} sizeMax - Max breakpoint to use for the media query
     * @param {Object} breakpoints - Override of the util breakpoints object (optional)
     * @returns {boolean} - Wether or not the given media query matches
     */
    mediaBreakpointBetween: function (sizeMin, sizeMax, breakpoints) {
        var min = this.mediaBreakpointUp(sizeMin, breakpoints);
        var max = this.mediaBreakpointDown(sizeMax, breakpoints);

        return min && max;
    },

    /**
     * @function
     * @desc Generates a min-width and max-width matchMedia media query based on the given params
     * @param {string} size - Breakpoint to use for the media query
     * @param {Object} breakpoints - Override of the util breakpoints object (optional)
     * @returns {boolean} - Wether or not the given media query matches
     */
    mediaBreakpointOnly: function (size, breakpoints) {
        return this.mediaBreakpointBetween(size, size, breakpoints);
    },

    /**
     * @function
     * @desc Retrieves the next key in the object or null if it doesn't exist
     * @param {Object} obj - Object to get the next key from
     * @param {string} key - Key to base the next key index on
     * @returns {string}|{null} - The next key of the given object or null if one doesn't exist
     */
    getNextObjectKey: function (obj, key) {
        var keys = Object.keys(obj);
        var nextIndex = keys.indexOf(key) + 1;

        if (keys.length > nextIndex) {
            return keys[nextIndex];
        }

        return null;
    },

    /**
     * @function
     * @desc Retrieves the util breakpoints object
     * @returns {Object} - All of the breakpoints
     */
    getBreakpoints: function () {
        return this.breakpoints;
    },

    /**
     * @function
     * @desc Syncs the heights of all elements of the passed in selector
     * @param {string} selector - Selector of element to sync
     */
    syncHeights: function (selector) {
        var maxHeight = 0;
        $(selector).each(function () {
            $(this).removeAttr('style');
            if ($(this).height() > maxHeight) {
                maxHeight = $(this).height();
            }
        });
        $(selector).height(maxHeight);
    },

    /**
     * @function
     * @desc formats 10-digit numbers into (xxx) xxx-xxx format
     * @param {string} phoneNumber - the number to format
     * @returns {string} the formatted value
     */
    formatPhoneDisplay: function (phoneNumber) {
        return phoneNumber.replace(/^([0-9]{3})(\d*)([0-9]{4})$/, '($1) $2-$3');
    }
};

module.exports = utils;
