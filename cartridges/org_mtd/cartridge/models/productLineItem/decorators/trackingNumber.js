'use strict';

module.exports = function (object, trackingNumbers) {
    Object.defineProperty(object, 'trackingNumbers', {
        enumerable: true,
        value: trackingNumbers
    });
};
