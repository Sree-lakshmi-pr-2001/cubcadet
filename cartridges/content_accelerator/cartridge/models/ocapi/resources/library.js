'use strict';

/** Model Imports */
var OcapiDataModel = require('*/cartridge/models/ocapi/data');
var OcapiCustomerModel = require('*/cartridge/models/ocapi/resources/customer');
var OcapiService = require('*/cartridge/scripts/service/OcapiService');

/**
 * @function
 * @desc Setup the library model and extend it with the data model
 * @param {string} libraryId - ID of the library to be used when accessing the API
 */
function OcapiLibraryModel(libraryId) {
    this.libraryId = libraryId;

    // Get an auth token to use in library API calls
    var customerModel = new OcapiCustomerModel();
    this.authorization = customerModel.getOauthToken();
}

OcapiLibraryModel.prototype = new OcapiDataModel();

/**
 * @function
 * @desc Retrieves the resource location for this API model
 * @returns {string} - Resource location URI
 */
OcapiLibraryModel.prototype.getResourceLocation = function () {
    // apiLocation and version come from the parent class
    return this.apiLocation + this.version + '/libraries/' + this.libraryId;
};

/**
 * @function
 * @desc Retrieves a content asset based on the given ID
 * @param {string} contentId - ID of the content asset to be retrieved
 * @return {Object|string} returns the service object or the service response
 */
OcapiLibraryModel.prototype.getContentAsset = function (contentId) {
    var resourceLocation = this.getResourceLocation();
    var authToken = this.authorization;
    var requestData = {
        path: resourceLocation + '/content/' + contentId,
        headers: {
            Authorization: authToken
        }
    };

    var serviceResponse = OcapiService.call(requestData);

    if (serviceResponse.ok) {
        var obj = serviceResponse.object;
        return obj;
    }

    // Error occurred with service
    return serviceResponse.status;
};

/**
 * @function
 * @desc Retrieves all subfolders
 * @param {string} folderId - ID of the folder to retrieve subfolders in
 * @return {Object|string} returns the service object or the service response
 */
OcapiLibraryModel.prototype.getAllSubFolders = function (folderId) {
    var folder = folderId || 'root';
    var resourceLocation = this.getResourceLocation();
    var authToken = this.authorization;
    var requestData = {
        path: resourceLocation + '/folders/' + folder + '/sub_folders',
        headers: {
            Authorization: authToken
        }
    };

    var serviceResponse = OcapiService.call(requestData);

    if (serviceResponse.ok) {
        var obj = serviceResponse.object;
        return obj;
    }

    // Error occurred with service
    return serviceResponse.status;
};

/**
 * @function
 * @desc Retrieves all content assets
 * @return {Object|string} returns the service object or the service response
 */
OcapiLibraryModel.prototype.getAllContentAssets = function () {
    var resourceLocation = this.getResourceLocation();
    var authToken = this.authorization;
    var requestData = {
        path: resourceLocation + '/folders/root?levels=2',
        headers: {
            Authorization: authToken
        }
    };

    var serviceResponse = OcapiService.call(requestData);

    if (serviceResponse.ok) {
        var obj = serviceResponse.object;
        return obj;
    }

    // Error occurred with service
    return serviceResponse.status;
};

/**
 * @function
 * @desc Creates a content asset based on the given parameters
 * @param {string} contentId - ID of the content asset to be created
 * @param {Object} contentData - Data to be used in the creation of the content asset
 * @param {string} locale - the locale
 * @return {Object|string} returns the service object or the service response
 */
OcapiLibraryModel.prototype.createContentAsset = function (contentId, contentData) {
    var _ = require('*/cartridge/scripts/lib/underscore');
    var resourceLocation = this.getResourceLocation();
    var authToken = this.authorization;
    var defaultData = {
        '_type': 'content_asset'
    };

    var requestData = {
        requestMethod: 'PUT',
        path: resourceLocation + '/content/' + contentId,
        headers: {
            Authorization: authToken
        },
        data: _.extend(defaultData, contentData)
    };

    var serviceResponse = OcapiService.call(requestData);

    if (serviceResponse.ok) {
        var obj = serviceResponse.object;
        return obj;
    }

    // Error occurred with service
    return serviceResponse.status;
};

/**
 * @function
 * @desc Deletes a content asset based on the given ID
 * @param {string} contentId - ID of the content asset to be deleted
 * @return {string} returns the service object or the service response
 */
OcapiLibraryModel.prototype.deleteContentAsset = function (contentId) {
    var resourceLocation = this.getResourceLocation();
    var authToken = this.authorization;
    var requestData = {
        requestMethod: 'DELETE',
        path: resourceLocation + '/content/' + contentId,
        headers: {
            Authorization: authToken
        }
    };

    var serviceResponse = OcapiService.call(requestData);

    if (serviceResponse.ok) {
        var obj = serviceResponse.object;
        return obj;
    }

    // Error occurred with service
    return serviceResponse.status;
};

/**
 * @function
 * @desc Updates a content asset based on the given ID and data
 * @param {string} contentId - ID of the content asset to be updated
 * @param {Object} contentData - Data to be used in updating of the content asset
 * @param {string} site - need to send siteID
 * @return {string} returns the service object or the service response
 */
OcapiLibraryModel.prototype.updateContentAsset = function (contentId, contentData, state) {
    var _ = require('*/cartridge/scripts/lib/underscore');
    var resourceLocation = this.getResourceLocation();
    var authToken = this.authorization;
    var defaultData = {
        '_resource_state': state,
        '_type': 'content_asset'
    };

    var requestData = {
        requestMethod: 'PATCH',
        path: resourceLocation + '/content/' + contentId,
        headers: {
            Authorization: authToken,
            'If-Match': state
        },
        data: _.extend(defaultData, contentData)
    };

    var serviceResponse = OcapiService.call(requestData);

    if (serviceResponse.ok) {
        var obj = serviceResponse.object;
        return obj;
    }

    // Error occurred with service
    return serviceResponse.status;
};

/**
 * @function
 * @desc Retrieves a folder based on the given ID
 * @param {string} folderID - ID of the folder to be retrieved
 * @return {Object|string} returns the service object or the service response
 */
OcapiLibraryModel.prototype.getContentFolder = function (folderID) {
    var resourceLocation = this.getResourceLocation();
    var authToken = this.authorization;
    var requestData = {
        path: resourceLocation + '/folders/' + folderID,
        headers: {
            Authorization: authToken
        }
    };

    var serviceResponse = OcapiService.call(requestData);

    // Error occurred with service
    return serviceResponse;
};

/**
 * @function
 * @desc Creates a folder based on the given parameters
 * @param {string} folderID - ID of the folder to be created
 * @param {Object} contentData - Data to be used in the creation of the content asset
 * @return {Object|string} returns the service object or the service response
 */
OcapiLibraryModel.prototype.createContentFolder = function (folderID, contentData) {
    var _ = require('*/cartridge/scripts/lib/underscore');
    var resourceLocation = this.getResourceLocation();
    var authToken = this.authorization;
    var defaultData = {
        online: true,
        parent_folder_id: 'root'
    };
    var requestData = {
        requestMethod: 'PUT',
        path: resourceLocation + '/folders/' + folderID,
        headers: {
            Authorization: authToken
        },
        data: _.extend(defaultData, contentData)
    };

    var serviceResponse = OcapiService.call(requestData);

    if (serviceResponse.ok) {
        var obj = serviceResponse.object;
        return obj;
    }

    // Error occurred with service
    return serviceResponse.status;
};

OcapiLibraryModel.prototype.putContentInFolder = function (contentID, folderID, contentData) {
    var _ = require('*/cartridge/scripts/lib/underscore');
    var resourceLocation = this.getResourceLocation();
    var authToken = this.authorization;
    var defaultData = {
        default: true
    };
    var requestData = {
        requestMethod: 'PUT',
        path: resourceLocation + '/folder_assignments/' + contentID + '/' + folderID,
        headers: {
            Authorization: authToken
        },
        data: _.extend(defaultData, contentData)
    };

    var serviceResponse = OcapiService.call(requestData);

    if (serviceResponse.ok) {
        var obj = serviceResponse.object;
        return obj;
    }

    // Error occurred with service
    return serviceResponse.status;
};

module.exports = OcapiLibraryModel;
