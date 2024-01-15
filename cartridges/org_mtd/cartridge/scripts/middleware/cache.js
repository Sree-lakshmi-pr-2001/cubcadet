'use strict';

var base = module.superModule;

/**
 * Applies the availability sensitive page cache.
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
*/
function applyAvailabilitySensitiveCache(req, res, next) {
    res.cachePeriod = 3; // eslint-disable-line no-param-reassign
    res.cachePeriodUnit = 'minutes'; // eslint-disable-line no-param-reassign
    next();
}

module.exports = {
    applyDefaultCache: base.applyDefaultCache,
    applyPromotionSensitiveCache: base.applyPromotionSensitiveCache,
    applyInventorySensitiveCache: base.applyInventorySensitiveCache,
    applyShortPromotionSensitiveCache: base.applyShortPromotionSensitiveCache,
    applyAvailabilitySensitiveCache: applyAvailabilitySensitiveCache
};
