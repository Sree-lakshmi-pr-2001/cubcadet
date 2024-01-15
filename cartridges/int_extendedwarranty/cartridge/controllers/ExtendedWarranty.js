'use strict';

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var WarrantyFactory = require('*/cartridge/scripts/factories/warranty');
var Site = require('dw/system/Site');
var Calendar = require('dw/util/Calendar');

server.get('AddToCart', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');


    var CartModel = require('*/cartridge/models/cart');
    var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');

    var currentBasket = BasketMgr.getCurrentOrNewBasket();

    var warrantyInfo = JSON.parse('{"' + res.viewData.queryString.replace(/&/g, '","').replace(/=/g,'":"') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) })
    
    var enterSerialNumberForm = server.forms.getForm('eligibilityCheck');

    Transaction.wrap(function () {
        var productID = warrantyInfo.warrantyPid;
        result = cartHelper.addProductToCart(
            currentBasket,
            warrantyInfo.warrantyPid,
            1, 
            {}, 
            {}, 
            false,
            {}
        );

        for (let p = 0; p < currentBasket.allProductLineItems.length; p++) {
            if (currentBasket.allProductLineItems[p].productID === warrantyInfo.warrantyPid) {
                currentBasket.allProductLineItems[p].custom['ew-type'] = "EW_AFT";
                currentBasket.allProductLineItems[p].custom['ew-model'] = warrantyInfo.model;
                currentBasket.allProductLineItems[p].custom['ew-productName'] = warrantyInfo.itemDescription;
                currentBasket.allProductLineItems[p].custom['ew-aftermarket-purchase-date'] = warrantyInfo.ewAftermarketPurchaseDate;
                currentBasket.allProductLineItems[p].custom['ew-aftermarket-purchased-from'] = warrantyInfo.ewPurchasedFrom;
                currentBasket.allProductLineItems[p].custom['ew-aftermarket-factory-number'] = warrantyInfo.itemNumber;
                currentBasket.allProductLineItems[p].custom['ew-aftermarket-serial-number'] = warrantyInfo.serialNumber;
                currentBasket.allProductLineItems[p].custom['ew-existing-registration'] = warrantyInfo.registered === 'true' ? true : false;
                currentBasket.allProductLineItems[p].custom['ew-aftermarket-end-use'] = "Residential";
            }
        }

    });

    var warrantyHelpers = require('*/cartridge/scripts/helpers/warrantyHelpers');
    var aftermarketOnly = warrantyHelpers.checkForAfterMarketOnlyBasket(currentBasket);

    res.redirect(URLUtils.url('Cart-Show'));
            return next();
}
);

server.post('ConfirmMyProduct', function (req, res, next) {
    var productInfo = req.form;
    productInfo.serialNumber = productInfo.serialNumber.toUpperCase();

    res.render('/eligibilityCheck/addToCart', {
        productInfo : productInfo
    });
    next();
}
);

server.get('EnterSerialNumber',  function (req, res, next) {
    var enterSerialNumberForm = server.forms.getForm('eligibilityCheck');
    enterSerialNumberForm.clear();

    res.render('/eligibilityCheck/enterSerialNumber', { 
        enterSerialNumberForm : enterSerialNumberForm
    });
    next();
}
);

server.post('LookupSerialNumber', function (req, res, next) {
        var ProductMgr = require('dw/catalog/ProductMgr');
        var formatCurrency = require('*/cartridge/scripts/util/formatting').formatCurrency;
        var serialNumber = req.form.serialNumber ? req.form.serialNumber.toUpperCase() : null;
        var site = Site;
        var countryCode = "US";
        var sourceSystem = "SFCC";
        var sourceOrderSiteId = "CubCadetDotCom";
        var enterSerialNumberForm = server.forms.getForm('eligibilityCheck');
        var resTemplate = '/eligibilityCheck/confirmFactoryModel';
        var warrantyDisplay;
        var errorTitle = "";
        var ewAftermarketPurchaseDate = "";
        
        var warrantyInfo = WarrantyFactory.getWarrantyInfo(sourceSystem, sourceOrderSiteId, serialNumber, countryCode);
        
        if (warrantyInfo != null && !warrantyInfo.error) {
            if (warrantyInfo.details.response.status === "SUCCESS") {
                enterSerialNumberForm.productType  = "ExtendedWarranty";
                enterSerialNumberForm.ewType.htmlValue = "EW_AFT";
                enterSerialNumberForm.ewAftermarketFactoryNumber.htmlValue =  warrantyInfo.details.response.data.unit.itemNumber; // ???

                /* Processing ewAftermarketPurchaseDate */  

                var unitProductionDate = warrantyInfo.details.response.data.unit.unitProductionDate.split(/\D+/);
                var udate = new Date(Date.UTC(unitProductionDate[0], --unitProductionDate[1], unitProductionDate[2]));
                var cal = new Calendar(udate);
                warrantyExpireDate = cal.getTime().toISOString();

                //Setting this by default because if registered warranty doesn't have a date, this will be set
                ewAftermarketPurchaseDate =  warrantyExpireDate;

                var existingRegistration;
                if (warrantyInfo.details.response.data.unit.registrations.length != 0) {
                    //warrantyInfo.details.response.data.unit.registrations[0].unitSoldDate
                    var unitSoldDate = [];
                    for each(let registration in warrantyInfo.details.response.data.unit.registrations) {
                        /* Let me discuss this internally and get back to you.
                        We may run across multiple registrations, when this happens, 
                        if factory model number matches choose that one. If there are 
                        multiple matches and only one has a unit sold date, 
                        choose the sold date- we are shooting for the best logical response. 
                        If there are multiple matches and no unit sold dates, 
                        please use the logic previously noted for #1.*/

                        if (registration.unitSoldDate) {   // factory model number matches choose that one 
                            unitSoldDate.push(registration.unitSoldDate);
                        }
                        existingRegistration = registration;
                    }

                    // unitSoldDate has something  figure out which one to.
                    // For now, just use the first one   
                    if(unitSoldDate.length > 0) {
                        var unitProductionDate = unitSoldDate[0].split(/\D+/);
                        var udate = new Date(Date.UTC(unitProductionDate[0], --unitProductionDate[1], unitProductionDate[2]));
                        var cal = new Calendar(udate);
                        warrantyExpireDate = cal.getTime().toISOString();

                        ewAftermarketPurchaseDate =  warrantyExpireDate;
                    }    
                }
                var warrantyPriceFormatted = '';
                var warrantyID = warrantyInfo.details.response.data.extendedWarranty.itemNumber;

                // For certain ineligible products we do not get an itemNumber
                if (warrantyID) {
                    var warrantyPriceInfo = ProductMgr.getProduct(warrantyID).priceModel.getPrice();
                    warrantyPriceFormatted = formatCurrency(warrantyPriceInfo.value, warrantyPriceInfo.currencyCode);
                }
                
                enterSerialNumberForm.ewAftermarketPurchaseDate.htmlValue = ewAftermarketPurchaseDate; // Current date or original
                enterSerialNumberForm.ewAftermarketPurchasedFrom.htmlValue = existingRegistration && existingRegistration.purchasedFrom ? existingRegistration.purchasedFrom : '';
                enterSerialNumberForm.ewAftermarketEndUse.htmlValue = "Residential";
                enterSerialNumberForm.ewAftermarketSerialNumber.htmlValue = serialNumber;
                enterSerialNumberForm.ewWarrantyPid.htmlValue = warrantyID;
                enterSerialNumberForm.ewModel.htmlValue = warrantyInfo.details.response.data.unit.model;
                warrantyDisplay = warrantyInfo.details.response.data;

                var errorCodeContent = JSON.parse(Site.current.preferences.custom['EW-Error-Code-Content-Mapping']);
                var errorContent = errorCodeContent[warrantyInfo.details.response.data.eligibleReasonCode]
                if (errorContent !== undefined) {
                    resTemplate = '/eligibilityCheck/displayErrorMessage';
                    var error = dw.content.ContentMgr.getContent(errorContent);
                    warrantyDisplay = error.custom.body.markup;
                    errorTitle = error.name;
                }
            } 
        } else {            
            resTemplate = '/eligibilityCheck/displayErrorMessage';
            
            var error = dw.content.ContentMgr.getContent('EW_ELIG_ERROR');
            warrantyDisplay = error.custom.body.markup ? error.custom.body.markup : '';
            errorTitle = error.name ? error.name : '';
        }

        res.render(resTemplate, {
            warrantyInfo : warrantyDisplay,
            warrantyPrice : warrantyPriceFormatted,
            enterSerialNumberForm : enterSerialNumberForm,
            errorTitle : errorTitle
        });
        next();
    });

module.exports = server.exports();