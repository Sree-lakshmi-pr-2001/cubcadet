'use strict';

var server = require('server');
server.extend(module.superModule);

server.replace('MiniCart', server.middleware.include, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');

    var currentBasket = BasketMgr.getCurrentBasket();
    var quantityTotal;
    var headerSize = req.querystring.header ? req.querystring.header : '';

    if (currentBasket) {
        quantityTotal = currentBasket.productQuantityTotal;
    } else {
        quantityTotal = 0;
    }

    res.render('/components/header/miniCart', { quantityTotal: quantityTotal, header: headerSize });
    next();
});

server.append('RemoveProductLineItem', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var viewData = res.getViewData();
    viewData.cartShowUrl = URLUtils.abs('Cart-Show').toString();
    next();
});

server.append('Show', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var shipment;
    if (currentBasket) {
        shipment = currentBasket.getDefaultShipment();
    }
    var viewData = res.getViewData();
    var CARBCompliantItemInCart;
    for each(var item in viewData.items){
        if(item.CARBCompliantItem){
            CARBCompliantItemInCart = true;
            break;
        }
    }
    viewData.CARBCompliantItemInCart = CARBCompliantItemInCart ? CARBCompliantItemInCart : false;
    if(!empty(shipment)){
        viewData.shippingAddress = shipment.shippingAddress;
    }
    res.setViewData(viewData);
    next();
});
module.exports = server.exports();
