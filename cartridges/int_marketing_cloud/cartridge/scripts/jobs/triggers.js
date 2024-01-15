'use strict';
var Logger = require('dw/system/Logger');
/**
 * @module jobs/triggers
 */

/**
 * Use with array filter, to filter hooks not matching the communication handler pattern
 * @param {string} hook The hook path/ID
 * @returns {boolean} Whether hook is comm handler
 */
function hookFilter(hook) {
    var match = 'app.communication.';
    var exclude = match +'handler.';
    var hookFilter1 = hook.name.slice(0, match.length) === match &&
        hook.name.slice(0, exclude.length) !== exclude;
    Logger.error('mtd - hookFilter1 : ' + hookFilter1);
    return hookFilter1;
}

/**
 * Initializes trigger configurations
 */
function initTriggers() {
    var triggerModel = require(module.cartridge).trigger;
    var hooks = require('~/hooks.json').hooks.filter(hookFilter);
    hooks.forEach(function(hook){
        var trigger = triggerModel(hook.name);
        trigger.rebuild();
    });
}

exports.initTriggers = initTriggers;