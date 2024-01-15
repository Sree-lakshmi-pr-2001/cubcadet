'use strict';

var server = require('server');
var Site = require('dw/system/Site');

/**
 * Save address validated
 *
 * @param {boolean} validationFlag - validation flag
 */
function saveAddressValidated(validationFlag) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var currentBasket = BasketMgr.getCurrentBasket();
    if (currentBasket) {
        Transaction.wrap(function () {
            currentBasket.custom.addressValidated = validationFlag;
        });
    }
}

/**
 * Verify Address
 */
server.post('Verify', function (req, res, next) {
    var AddressRequest = require('~/cartridge/scripts/helpers/AddressRequest');
    var AddressModel = require('~/cartridge/scripts/models/Address');
    var AddressUtil = require('~/cartridge/scripts/helpers/Util');
    var ContentMgr = require('dw/content/ContentMgr');
    var ContentModel = require('*/cartridge/models/content');
    var Resource = require('dw/web/Resource');
    var validationResponse;
    var googleAddressCountry = Site.getCurrent().getCustomPreferenceValue('country');

    // Check US Sites and desable addrress validation flag.
    var desableAddressValidation = true;
    var enableGoogleAddressValidation = Site.getCurrent().getCustomPreferenceValue('enableGoogleAddressValidation');
    if (enableGoogleAddressValidation) {
        desableAddressValidation = false;
        var addressRequest = AddressRequest.getRequest();
        var addressRequest1 = {
            address: {
                'regionCode': addressRequest.country,
                'locality': addressRequest.cityOrMunicipality,
                'administrativeArea': addressRequest.stateOrProvince,
                'postalCode': addressRequest.postalCode,
                'addressLines': addressRequest.address1
            }
        }
        var googleAddressValidation = require('~/cartridge/scripts/helpers/GoogleAddressValidation');

        validationResponse = googleAddressValidation.verify(addressRequest1);

        if (validationResponse.result.verdict.addressComplete) {
            var errorValidationAsset = ContentMgr.getContent('error-address-validation');
            var assetModel = (errorValidationAsset) ? new ContentModel(errorValidationAsset) : '';
            validationResponse.dialog = {
                headerTitle: Resource.msg('dialog.title', 'addressvalidation', null),
                originAddressTxt: Resource.msg('dialog.originadress', 'addressvalidation', null),
                correctedAddressTxt: Resource.msg('dialog.correctedaddress', 'addressvalidation', null),
                addressNotFoundTxt: Resource.msg('dialog.addressnotfound', 'addressvalidation', null),
                useThisAddressBtn: Resource.msg('dialog.usethisaddress', 'addressvalidation', null),
                editAddressBtn: Resource.msg('dialog.editAddress', 'addressvalidation', null),
                indicateTheAddressTxt: Resource.msg('dialog.indicatetheaddress', 'addressvalidation', null),
                errorValidationAsset: (assetModel) ? assetModel.body.markup : ''
            };

            var addressRequest = AddressRequest.getRequest();
            validationResponse.originalAddress = {
                address1: addressRequest.address1,
                address2: '',
                city: addressRequest.cityOrMunicipality,
                state: addressRequest.stateOrProvince,
                postalCode: addressRequest.postalCode,
                country: addressRequest.country,
            },
            {
                serviceError: false,
                errorFlag: false
            }

            var correctedAddressTxt = '';
            correctedAddressTxt = validationResponse.result.address.formattedAddress.split(",");
            var stateCode = correctedAddressTxt[2].trim().split(" ");
            var country = addressRequest.country === 'us' || addressRequest.country === 'US' || addressRequest.country === 'USA';
            var correctedPostalCode = '';
            if (country) {
                correctedPostalCode = validationResponse.result.uspsData.standardizedAddress.zipCode;
            } else {
                correctedPostalCode = validationResponse.result.address.postalAddress.postalCode;
            }

            validationResponse.correctedAddress = {
                address1: correctedAddressTxt[0],
                address2: '',
                city: correctedAddressTxt[1],
                state: stateCode[0],
                postalCode: correctedPostalCode,
                country: validationResponse.result.address.postalAddress.regionCode,
            }
            // by default we shouldn't set error for address validation
            if (country && correctedPostalCode === addressRequest.postalCode) {
                validationResponse = {
                    serviceError: true
                };
                // service is down and we need to set address validation flag to false
                saveAddressValidated(false);
            }
        } else {
            validationResponse = {
                errorFlag: true,
                correctedFlag: false,
            };
            validationResponse.dialog = {
                headerTitle: Resource.msg('dialog.title', 'addressvalidation', null),
                originAddressTxt: Resource.msg('dialog.originadress', 'addressvalidation', null),
                correctedAddressTxt: Resource.msg('dialog.correctedaddress', 'addressvalidation', null),
                addressNotFoundTxt: Resource.msg('dialog.addressnotfound', 'addressvalidation', null),
                useThisAddressBtn: Resource.msg('dialog.usethisaddress', 'addressvalidation', null),
                editAddressBtn: Resource.msg('dialog.editAddress', 'addressvalidation', null),
                indicateTheAddressTxt: Resource.msg('dialog.indicatetheaddress', 'addressvalidation', null),
                errorValidationAsset: (assetModel) ? assetModel.body.markup : ''
            };
            validationResponse.correctedAddress = null;

            var addressRequestGoogle = AddressRequest.getRequest();
            var addressRequest1 = {
                "address": {
                    'regionCode': addressRequestGoogle.country,
                    'locality': addressRequestGoogle.cityOrMunicipality,
                    'administrativeArea': addressRequestGoogle.stateOrProvince,
                    'postalCode': addressRequestGoogle.postalCode,
                    'addressLines': addressRequestGoogle.address1
                }, 'enableUspsCass': true
            }
            validationResponse.originalAddress = {
                address1: addressRequestGoogle.address1,
                address2: '',
                city: addressRequestGoogle.cityOrMunicipality,
                state: addressRequestGoogle.stateOrProvince,
                postalCode: addressRequestGoogle.postalCode,
                country: addressRequestGoogle.country,
            }
            // service is down and we need to set address validation flag to false
            saveAddressValidated(false);
        }
    } else {
        if (AddressUtil.VALUE.ADDRESS_VALIDATION_ENABLED && desableAddressValidation == true) {
            // Create Address Request
            var addressRequest = AddressRequest.getRequest();
            // Call API service to verify address
            var validationResult = AddressModel.verify(addressRequest);

            // If we have success response we just return it
            // Otherwise we just mark response as failed
            if (!validationResult.error) {
                validationResponse = validationResult.getDetail('response');
                var errorValidationAsset = ContentMgr.getContent('error-address-validation');
                var assetModel = (errorValidationAsset) ? new ContentModel(errorValidationAsset) : '';
                validationResponse.dialog = {
                    headerTitle: Resource.msg('dialog.title', 'addressvalidation', null),
                    originAddressTxt: Resource.msg('dialog.originadress', 'addressvalidation', null),
                    correctedAddressTxt: Resource.msg('dialog.correctedaddress', 'addressvalidation', null),
                    addressNotFoundTxt: Resource.msg('dialog.addressnotfound', 'addressvalidation', null),
                    useThisAddressBtn: Resource.msg('dialog.usethisaddress', 'addressvalidation', null),
                    editAddressBtn: Resource.msg('dialog.editAddress', 'addressvalidation', null),
                    indicateTheAddressTxt: Resource.msg('dialog.indicatetheaddress', 'addressvalidation', null),
                    errorValidationAsset: (assetModel) ? assetModel.body.markup : ''
                };
                // by default we shouldn't set error for address validation
                saveAddressValidated(true);
            } else {
                validationResponse = {
                    serviceError: true
                };
                // service is down and we need to set address validation flag to false
                saveAddressValidated(false);
            }
        } else {
            validationResponse = {
                serviceDisabled: true
            };
            // AVS is disabled and address validation flag is false
            saveAddressValidated(false);
        }
    }
    res.json(validationResponse);
    next();
});


/**
 * User choose original address instead of suggested
 */
server.get('UseOriginal', function (req, res, next) {
    saveAddressValidated(false);
    res.json({ success: true });
    next();
});

module.exports = server.exports();
