'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

/**
 *  Extend Submit payment to define if need to show prop65 message
 */
server.append(
    'SubmitPayment',
    function (req, res, next) {
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var BasketMgr = require('dw/order/BasketMgr');
            var prop65Helper = require('*/cartridge/scripts/helpers/prop65Helpers');
            var currentBasket = BasketMgr.getCurrentBasket();

            // Verify prop65
            var prop65Response = prop65Helper.buildResponse(currentBasket);

            res.json({
                prop65: prop65Response
            });
        });
        return next();
    }
);

module.exports = server.exports();
