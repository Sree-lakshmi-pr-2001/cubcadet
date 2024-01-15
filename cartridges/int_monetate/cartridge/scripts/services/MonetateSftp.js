'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var monetateSftp = LocalServiceRegistry.createService('Monetate.SFTP', {
    createRequest: function (service, params) {
        var origCredentialID = service.getCredentialID() || service.getConfiguration().getID(),
        credArr = origCredentialID.split('-'),
        credArrSiteID = credArr[credArr.length-1],
        siteID = require('dw/system/Site').current.ID;
        if (credArrSiteID !== siteID) {
            // Attempt to set to site-specific credential
            try {
                service.setCredentialID(credArr[0] + '-' + siteID);
            } catch(e) {
                // site-specific credential doesn't exist, reset
                service.setCredentialID(origCredentialID);
            }
        }
        var args = Array.prototype.slice.call(arguments, 1);
        service.setOperation.apply(service, args);
        return service;
    },
    parseResponse: function (service, result) {
        return result;
    }
});

module.exports = monetateSftp;