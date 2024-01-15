'use strict';

var server = require('server');
server.extend(module.superModule);

var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var ecommerce = require('*/cartridge/scripts/middleware/ecommerce');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var OrderFactory = require('../scripts/factories/order');
var Logger = require('dw/system/Logger');
var Locale = require('dw/util/Locale');
var collections = require('*/cartridge/scripts/util/collections');

server.append(
    'Confirm',
    function (req, res, next) {
        var ContentMgr = require('dw/content/ContentMgr');
        var ContentModel = require('*/cartridge/models/content');
        var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
        var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
        var apiContent = ContentMgr.getContent('order-confirm-metadata');
        if (apiContent) {
            var content = new ContentModel(apiContent, 'content/contentAsset');

            pageMetaHelper.setPageMetaData(req.pageMetaData, content);
            pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
        }

        var pepperjamHelper = require('*/cartridge/scripts/util/PepperjamHelper');
        var viewData = res.getViewData();

        // Get Pepperjam tracking URL
        var pepperjamTrackingUrl = null;
        var orderId = req.querystring.ID;
        if (orderId) {
            pepperjamTrackingUrl = pepperjamHelper.getTrackingUrl(orderId);
        }
        viewData.pepperjamTrackingUrl = pepperjamTrackingUrl;

        var OrderMgr = require('dw/order/OrderMgr');
        var order = OrderMgr.getOrder(orderId);
        var isAftermarketOnlyOrder = false;
        var shipments = order.getShipments();

        if (shipments && shipments.length > 0) {
            let shipment = shipments[0];
            isAftermarketOnlyOrder = ShippingHelper.isAftermarketOnlyOrder(shipment);
        }

        viewData.isConfirmation = true;
        viewData.afterMarketOnly =isAftermarketOnlyOrder;
        return next();
    }, pageMetaData.computedPageMetaData
);


server.replace(
    'Track',
    ecommerce.checkEcommerceEnabled,
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.validateRequest,
    csrfProtection.generateToken,
    function (req, res, next) {
        // var order;
        var validForm = true;
        var orderModel = null;
        var currentLocale = Locale.getLocale(req.locale.id);
        var profileForm = server.forms.getForm('profile');
        var errorFromService = false;
        profileForm.clear();
        if (req.querystring.trackOrderEmail && req.querystring.trackOrderPostal && req.querystring.trackOrderNumber) {
            var trackOrderNumber = req.querystring.trackOrderNumber.toUpperCase();
            var trackOrderPostal = req.querystring.trackOrderPostal.replace(' ', '').toUpperCase();
            var trackOrderEmail = req.querystring.trackOrderEmail.toLowerCase();
            var orderFromEpcot = OrderFactory.getOrderFromEpcot(trackOrderNumber, trackOrderEmail, trackOrderPostal);

            if (orderFromEpcot && orderFromEpcot.error === false) {
                // valid epcot order
                orderModel = orderFromEpcot;
                validForm = true;
            } else {
                Logger.error('orderFromEpcot was null or orderFromEpcot.error was true');
                var orderFromSFCC = OrderFactory.getOrderFromSFCC(trackOrderNumber, trackOrderEmail, trackOrderPostal, currentLocale);
                if (orderFromSFCC && orderFromSFCC.error === false) {
                    orderModel = orderFromSFCC;
                    validForm = true;
                } else {
                    Logger.error('orderFromSFCC was null or orderFromSFCC.error was true');
                    validForm = false;

                    if (orderFromSFCC.error === true) {
                        errorFromService = true;
                    }
                }
            }
        } else {
            validForm = false;
        }

        if (!validForm) {
            var actionUrl = URLUtils.url('Order-Track');

            res.render('account/order/orderTrackingLookup', {
                navTabValue: 'login',
                orderTrackFormError: !validForm,
                profileForm: profileForm,
                userName: '',
                actionUrl: actionUrl,
                errorFromService: errorFromService
            });
            next();
        } else {
            var exitLinkText;
            var exitLinkUrl;

            exitLinkText = !req.currentCustomer.profile
                ? Resource.msg('link.continue.shop', 'order', null)
                : Resource.msg('link.orderdetails.myaccount', 'account', null);

            exitLinkUrl = !req.currentCustomer.profile
                ? URLUtils.url('Home-Show')
                : URLUtils.https('Account-Show');

            res.render('account/orderDetails', {
                order: orderModel,
                exitLinkText: exitLinkText,
                exitLinkUrl: exitLinkUrl
            });

            var ContentMgr = require('dw/content/ContentMgr');
            var ContentModel = require('*/cartridge/models/content');
            var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

            var apiContent = ContentMgr.getContent('order-track-metadata');
            if (apiContent) {
                var content = new ContentModel(apiContent, 'content/contentAsset');

                pageMetaHelper.setPageMetaData(req.pageMetaData, content);
                pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
            }

            var viewData = res.getViewData();
            // Remove showing td account number of specific order detail in history
            // because td account number is not available in order
            viewData.isNotShowingTDAccountNumber = true;
            res.setViewData(viewData);

            next();
        }
    }, pageMetaData.computedPageMetaData
);

server.get(
    'TrackLanding',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var actionUrl = URLUtils.url('Order-Track');

        res.render('/account/order/orderTrackingLookup', {
            actionUrl: actionUrl,
            showHeader: false
        });
        next();
    }
);

server.append(
    'History',
    function (req, res, next) {
        var ContentMgr = require('dw/content/ContentMgr');
        var ContentModel = require('*/cartridge/models/content');
        var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

        var apiContent = ContentMgr.getContent('order-history-metadata');
        if (apiContent) {
            var content = new ContentModel(apiContent, 'content/contentAsset');

            pageMetaHelper.setPageMetaData(req.pageMetaData, content);
            pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
        }

        next();
    }, pageMetaData.computedPageMetaData
);

server.append(
    'Details',
    function (req, res, next) {
        var ContentMgr = require('dw/content/ContentMgr');
        var ContentModel = require('*/cartridge/models/content');
        var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

        var apiContent = ContentMgr.getContent('order-details-metadata');
        if (apiContent) {
            var content = new ContentModel(apiContent, 'content/contentAsset');

            pageMetaHelper.setPageMetaData(req.pageMetaData, content);
            pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
        }

        var viewData = res.getViewData();
        viewData.isConfirmation = false;

        next();
    }, pageMetaData.computedPageMetaData
);

server.get('OrderProcessedByReviewer',
    function(req,res,next){
        var Transaction = require('dw/system/Transaction');
        var OrderMgr = require('dw/order/OrderMgr');
        var Encoding = require('dw/crypto/Encoding');
        var encodedOrderNo = req.querystring.orderNo;
        var processedType = req.querystring.process;
        if(encodedOrderNo && processedType && (processedType === 'APPROVED' || processedType ===  'NOT_APPROVED')){
            var decodeOrderNoBytes = Encoding.fromBase64(encodedOrderNo);
            var decodeOrderNo = decodeOrderNoBytes.toString();
            var order = OrderMgr.getOrder(decodeOrderNo);
            if(!empty(order)){
                if(order && order.custom && order.custom.globalComplianceCheckStatus && order.custom.globalComplianceCheckStatus == 'MANUAL'){
                    if(processedType === 'APPROVED'){
                        Transaction.wrap(function(){
                            order.custom.globalComplianceCheckStatus = 'APPROVED';
                        })
                    } else{
                        Transaction.wrap(function(){
                            order.custom.globalComplianceCheckStatus = 'NOT_APPROVED';
                        })
                    }
                    res.render('/common/approve',{error:false});
                } else {
                    errorText = 'This order was already processed to approved or declined.'
                    res.render('/common/approve',{error:true,errorText:errorText});
                }
            } else {
                errorText = 'Please check, this order is not available.'
                res.render('/common/approve',{error:true,errorText:errorText});
            }
        } else {
            errorText = 'Please check, order number or order processing type is incorrect'
            res.render('/common/approve',{error:true,errorText:errorText});
        }
        
    next();
});

module.exports = server.exports();