'use strict';

var StoreMgr = require('dw/catalog/StoreMgr');

/**
 * Get the selected Dealer model
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function checkSelectedDealer(req, res, next) {
    var selectedDealer = StoreMgr.getStoreIDFromSession();
    if (selectedDealer) {
        var StoreModel = require('*/cartridge/models/store');
        var storeMgr = require('dw/catalog/StoreMgr');
        var dealer = storeMgr.getStore(selectedDealer);
        var dealerStoreModel = new StoreModel(dealer);
        var viewData = res.getViewData();
        viewData.selectedDealer = dealerStoreModel;
        res.setViewData(viewData);
    }
    next();
}

module.exports = {
    check: checkSelectedDealer
};
