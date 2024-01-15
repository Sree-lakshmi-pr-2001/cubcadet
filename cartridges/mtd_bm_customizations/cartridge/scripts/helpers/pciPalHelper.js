/* global session */
'use strict';

var Logger = require('dw/system/Logger').getLogger('Pcipal', 'pciPalHelper.js');
var mtdAPICalls = require('./mtdAPICalls');
var StringUtils = require('dw/util/StringUtils');
var requestHelper = require('./requestHelper');
var epcotOcapiHelper = require('./epcotOcapiHelper');
var net = require('dw/net');
function getPCIPalIFrameData (basketJSON, authOrderId){

    Logger.error('authOrderId : ' + authOrderId);
    return ;
}

// TODO: customer email from basket
function getPCIPalPayload(basketJSON, authCode, agentID, merchantId, safetechMerchantID, websiteShortName){
    // agentID 4318
    // "MerchantID": "010233",
    // "SafetechMerchantID": "300155",
    // "WebsiteShortName": "cub-p"

    // accountConfigurationId should be 2 for test, 0 for prod
    let accountConfigurationId =  epcotOcapiHelper.getSitePreference('pcipal_accountConfigurationId');
    Logger.info('pcipal accountConfigurationId :' + accountConfigurationId);

    let orderTotal = basketJSON.order_total.toFixed(2);
    let payload = {
        "agentID": agentID,
        "accountConfigurationId": accountConfigurationId,
        "paymentData": {
          "OrbitalConnectionUsername": "",
          "OrbitalConnectionPassword": "",
          "MessageType": "A",
          "MerchantID": merchantId,
          "TerminalID": "001",
          "ccCardVerifyPresenceInd": "1",
          "AVSaddress1": basketJSON.billing_address.address1,
          "AVSaddress2": "",
          "AVScity": basketJSON.billing_address.city,
          "AVSstate": basketJSON.billing_address.state_code,
          "AVSname": basketJSON.billing_address.full_name,
          "AVScountryCode": basketJSON.billing_address.country_code,
          "AVSzip": basketJSON.billing_address.postal_code,
          "AVSphoneNum": basketJSON.billing_address.phone,
          "AVSDestname": null,
          "AVSDestaddress1": null,
          "AVSDestaddress2": null,
          "AVSDestcity": null,
          "AVSDeststate": null,
          "AVSDestzip": null,
          "AVSDestcountryCode": null,
          "AVSDestphoneNum": basketJSON.billing_address.phone,
          "OrderID": authCode,
          "Amount": '$' + orderTotal,
          "CustomerEmail": basketJSON.customer_info.email,
          "AddProfileFromOrder": "S",
          "CustomerProfileOrderOverrideInd": "NO",
          "FraudScoreIndicator": "1",
          "RulesTrigger": "N",
          "SafetechMerchantID": safetechMerchantID,
          "Bin": "000001",
          "CustomerRefNum": authCode,
          "WebsiteShortName": websiteShortName
        },
        "skipCallTransfer": false
      };

      if (basketJSON.shipments && basketJSON.shipments.length > 0 && basketJSON.shipments[0].shipping_address) {
        payload.paymentData.AVSDestname =  basketJSON.shipments[0].shipping_address.full_name;
        payload.paymentData.AVSDestaddress1 =  basketJSON.shipments[0].shipping_address.address1;
        payload.paymentData.AVSDestaddress2 = "";
        payload.paymentData.AVSDestcity =  basketJSON.shipments[0].shipping_address.city;
        payload.paymentData.AVSDeststate =  basketJSON.shipments[0].shipping_address.state_code;
        payload.paymentData.AVSDestzip =  basketJSON.shipments[0].shipping_address.postal_code;
        payload.paymentData.AVSDestcountryCode =  basketJSON.shipments[0].shipping_address.country_code;
        payload.paymentData.AVSDestphoneNum =  basketJSON.shipments[0].shipping_address.phone;
      }



    return payload;
}

function getPCIPalToken(){
    let postData = "grant_type=client_credentials&scope=globalpci";
    let client_id = epcotOcapiHelper.getSitePreference('pcipal_clientId');
    let client_secret = epcotOcapiHelper.getSitePreference('pcipal_clientSecret');
    // let client_id = '5ab470ce-5f72-470f-9e6c-d4be453c9ee6';
    // let client_secret = '6d0r3b5XDlqTswomsjidPHpjmiCqqcKqQtET0i7N';
    // let url = 'https://nam.newvoicemedia.com/auth/connect/token';
    let url = epcotOcapiHelper.getSitePreference('pcipal_tokenUrl');
    Logger.info('pcipal_tokenUrl' + url);
    let base1 = StringUtils.encodeBase64(client_id  + ":" + client_secret);
    Logger.info("pcipal encodeBase64 : " + base1);

    // var httpClient = new net.HTTPClient();
    // httpClient.setTimeout(10000);
    // httpClient.open('POST', 'https://nam.newvoicemedia.com/auth/connect/token');
    // httpClient.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    // httpClient.setRequestHeader('Authorization', 'Basic ' + base1);
    // httpClient.send(postData);
    // Logger.error("status : " + httpClient.statusCode)
    // var jsonRES = JSON.parse(httpClient.text);
    // Logger.error('text : ' + httpClient.text);

    // let username = epcotOcapiHelper.getSitePreference('mtdServicesUsername');
    // let password = epcotOcapiHelper.getSitePreference('mtdServicesPassword');
    // let clientId = epcotOcapiHelper.getSitePreference('mtdServicesClientID');
    // let clientSecret = epcotOcapiHelper.getSitePreference('mtdServicesClientSecret');

    Logger.info(postData);
    let httpResponse = requestHelper.sendRequest(url, base1, postData, "POST", true, "application/x-www-form-urlencoded");
    let jsonRES = null;

    if (httpResponse.statusCode === 200){
        jsonRES = JSON.parse(httpResponse.text);
        Logger.info('getPCIPalToken token : ' + jsonRES.access_token);
        return jsonRES.access_token;
    } else {
        Logger.error('getPCIPalToken responseCode = ' + httpResponse.statusCode);
        return null;
    }

    return jsonRES.access_token;
}

function getPCIPalIFrameDetails(accessToken, pciPalPayload) {
    // let url = "https://nam.api.newvoicemedia.com/globalpci/v1/session";
    let url = epcotOcapiHelper.getSitePreference('pcipal_sessionUrl');
    Logger.info('pcipal_sessionUrl' + url);

    let pciPalValues = {
        sessionGuid : null,
        agentAccessToken : null,
        iframeUrl : null,
        providerSessionGuid : null,
        paymentFormUrl : null,
        agentRefreshToken : null,
        success : false
    }

    let respn1 = requestHelper.sendRequest(url, accessToken, pciPalPayload, 'POST', false,'application/json');
    Logger.info('getPCIPalIFrameDetails response:');
    Logger.info(JSON.stringify(respn1));


    if (respn1.statusCode == 200){
        let json1 = JSON.parse(respn1.text);
        pciPalValues.sessionGuid = json1.sessionGuid;
        pciPalValues.agentAccessToken = json1.agentAccessToken;
        pciPalValues.iframeUrl = json1.iframeUrl;
        pciPalValues.providerSessionGuid = json1.providerSessionGuid;
        pciPalValues.paymentFormUrl = json1.paymentFormUrl;
        pciPalValues.agentRefreshToken=  json1.agentRefreshToken;
        pciPalValues.success = true;
    } else {
        pciPalValues.errorMessage = respn1.errorText;
    }

    return pciPalValues;
}

function getPaymentStatus(sessionGuid) {
    // payment approved means the authorization was successful AND the fraud check came back approved or review status (review is future status)
    // we will return approved, declined or review
    let pciPalSession = getPCIPalSessionInformation(sessionGuid);
    Logger.info('getPaymentStatus  pciPalSession.reversalRequired '  + pciPalSession.reversalRequired);
    let paymentStatus = {
        approvalCode : null,
        chaseData : pciPalSession.chaseData,
        reversalRequired : pciPalSession.reversalRequired
    };
    if (pciPalSession.approvalStatus === 'A') {
        if (pciPalSession.reversalRequired) {
            //TODO: reversal
            paymentStatus.approvalCode = 'REVERSAL';
        } else {
            paymentStatus.approvalCode =  'APPROVED';
        }
    } else {
        paymentStatus.approvalCode =  'DECLINED';
    }


    return paymentStatus;
}

function getPCIPalSessionInformation(sessionGuid) {
    let url = epcotOcapiHelper.getSitePreference('pcipal_sessionUrl') + "/" + sessionGuid;
    //let url = "https://nam.api.newvoicemedia.com/globalpci/v1/session" + "/" + sessionGuid;
    let accessToken = getPCIPalToken();
    let pciPalPayload = null;
    let approvalStatus = null;
    let reversalRequired = false;
    let fraudStatus = null;

    let chaseData = {
        chaseApprovalStatus: null,
        chaseAutoDecisionResponse: null,
        chaseCustomerReferenceNumber: null,
        chaseFraudStatusCode: null,
        chaseMerchantId: null,
        chaseRespCode: null,
        chaseRespDateTime: null,
        chaseTxRefIdx: null,
        chaseTxRefNum: null,
        chaseCardBrand: null,
        chaseTransactionId: null,
        chaseExpirationDate: null
    };

    let result = requestHelper.sendRequest(url, accessToken, pciPalPayload, 'GET', false);
    Logger.info('pci pal response from get session for sessionGuid : ' + sessionGuid);
    Logger.info(JSON.stringify(result));

    if (result.statusCode == 200 && result.text){
        var jsonRES = JSON.parse(result.text);

        if (jsonRES.paymentResultData) {
            if (jsonRES.paymentResultData.ApprovalStatus){
                if (jsonRES.paymentResultData.ApprovalStatus == '1'){
                    Logger.info('ApprovalStatus was 1, approved payment');
                    approvalStatus = 'A';

                    if (jsonRES.paymentResultData.FraudStatusCode == 'A000' && jsonRES.paymentResultData.RespCode == '00' && jsonRES.paymentResultData.AutoDecisionResponse == 'A'){
                        Logger.info('fraud check passes, no reversal needed');
                        reversalRequired = false;
                        fraudStatus = false;
                        chaseData.chaseApprovalStatus = jsonRES.paymentResultData.ApprovalStatus;
                        chaseData.chaseAutoDecisionResponse = jsonRES.paymentResultData.chaseAutoDecisionResponse;
                        chaseData.chaseCustomerReferenceNumber = jsonRES.paymentResultData.CustomerRefNumOut;
                        chaseData.chaseFraudStatusCode = jsonRES.paymentResultData.FraudStatusCode;
                        chaseData.chaseMerchantId= jsonRES.paymentResultData.MerchantID;
                        chaseData.chaseRespCode= jsonRES.paymentResultData.RespCode;
                        chaseData.chaseRespDateTime= jsonRES.paymentResultData.RespCode;
                        chaseData.chaseTxRefIdx= jsonRES.paymentResultData.TxRefIdx;
                        chaseData.chaseTxRefNum= jsonRES.paymentResultData.TxRefNum;
                        chaseData.chaseBrand= jsonRES.paymentResultData.CardBrandOut;
                        chaseData.orderId= jsonRES.paymentResultData.OrderID;

                    } else {
                        Logger.info('requires reversal, fraud score : ' + jsonRES.paymentResultData.FraudStatusCode + ', RespCode : ' + jsonRES.paymentResultData.RespCode + ', AutoDecisionResponse : ' + jsonRES.paymentResultData.AutoDecisionResponse);
                        reversalRequired = true;
                        fraudStatus = true;

                        chaseData.chaseApprovalStatus = jsonRES.paymentResultData.ApprovalStatus;
                        chaseData.chaseAutoDecisionResponse = jsonRES.paymentResultData.chaseAutoDecisionResponse;
                        chaseData.chaseCustomerReferenceNumber = jsonRES.paymentResultData.CustomerRefNumOut;
                        chaseData.chaseFraudStatusCode = jsonRES.paymentResultData.FraudStatusCode;
                        chaseData.chaseMerchantId= jsonRES.paymentResultData.MerchantID;
                        chaseData.chaseRespCode= jsonRES.paymentResultData.RespCode;
                        chaseData.chaseRespDateTime= jsonRES.paymentResultData.RespCode;
                        chaseData.chaseTxRefIdx= jsonRES.paymentResultData.TxRefIdx;
                        chaseData.chaseTxRefNum= jsonRES.paymentResultData.TxRefNum;
                        chaseData.chaseBrand= jsonRES.paymentResultData.CardBrandOut;
                        chaseData.orderId= jsonRES.paymentResultData.OrderID;
                    }

                    // additions
                    chaseData.chaseCardBrand = jsonRES.paymentResultData.CardBrandOut;
                    chaseData.chaseTransactionId = jsonRES.paymentResultData.OrderIDOut;
                    chaseData.chaseExpirationDate = jsonRES.paymentResultData.fullExpiry;
                } else {
                    Logger.error('ApprovalStatus was ' + jsonRES.paymentResultData.ApprovalStatus + ' declined payment');
                    approvalStatus = 'D';
                }
            } else {
                Logger.error('no jsonRES.paymentResultData.ApprovalStatus');
                approvalStatus = 'E';
            }
        } else {
            Logger.error('no paymentResultData');
            approvalStatus = 'E';
            fraudStatus = 'E'
            reversalRequired = false;
        }

        // if (jsonRES.paymentResultData && jsonRES.paymentResultData.ApprovalStatus){
        //     if (jsonRES.paymentResultData.ApprovalStatus == '1'){
        //         approvalStatus = 'A';
        //     } else {
        //         approvalStatus = 'D';
        //     }
        // } else {
        //     Logger.error("no paymentResultData or jsonRES.paymentResultData.ApprovalStatus ");
        //     approvalStatus = 'E';
        // }

    } else {
        approvalStatus = 'E';
        Logger.error("bad response");
    }

    return ({
        approvalStatus: approvalStatus,
        reversalRequired: reversalRequired,
        fraudStatus: fraudStatus,
        chaseData: chaseData
    });
}

module.exports.getPCIPalIFrameData=getPCIPalIFrameData;
module.exports.getPCIPalPayload=getPCIPalPayload;
module.exports.getPCIPalToken=getPCIPalToken;
module.exports.getPCIPalIFrameDetails=getPCIPalIFrameDetails;
module.exports.getPaymentStatus=getPaymentStatus;