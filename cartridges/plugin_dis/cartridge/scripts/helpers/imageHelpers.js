'use strict';

/**
 * getContextData - Getting appropriate context data object for the image transform.
 *
 * @param {string} context - Which static directory will be utilized. Values are 'catalog', 'content', or 'cartridge'.
 * @param {string} contextId - optional - When context is set to 'catalog', the ID of the catalog to be used. Default is whichever catalog is assigned to the storefront.
 * @returns {Object} Context data object
 */
function getContextData(context, contextId) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var contextData = null;
    var contextMapping = {
        catalog: {
            context: 'CONTEXT_CATALOG',
            contextId: contextId || CatalogMgr.siteCatalog.ID
        },
        content: {
            context: 'CONTEXT_LIBRARY',
            contextId: null
        },
        cartridge: {
            context: 'CONTEXT_SITE',
            contextId: null
        }
    };

    if (typeof contextMapping[context] !== 'undefined') {
        contextData = contextMapping[context];
    }

    return contextData;
}

/**
 * getTransformParameterType - Getting appropriate data type for given parameter. For use in converting http parameter
 * values to transform object property values.
 *
 * @param {string} key - The key of the param we need the data type for.
 * @returns {string} Parameter data type for use in DIS transforms
 */
function getTransformParameterType(key) {
    var type = null;
    var typeMapping = {
        cropX: 'doubleValue',
        cropY: 'doubleValue',
        cropWidth: 'doubleValue',
        cropHeight: 'doubleValue',
        scaleWidth: 'doubleValue',
        scaleHeight: 'doubleValue',
        scaleMode: 'stringValue',
        imageX: 'doubleValue',
        imageY: 'doubleValue',
        imageURI: 'stringValue',
        format: 'stringValue',
        quality: 'doubleValue',
        strip: 'booleanValue'
    };

    if (typeof typeMapping[key] !== 'undefined') {
        type = typeMapping[key];
    }

    return type;
}

/**
 * getImageURL - Returns a transformed image URL using DIS.
 *
 * @param {Object} transform - transform object accepted by the dw.web.URLUtils.absImage API
 * @param {string} src - Relative path of image within root of static library set by the context parameter.
 * @param {string} context - Which static directory will be utilized. Values are 'catalog', 'content', or 'cartridge'.
 * @param {string} contextId - optional - When context is set to 'catalog', the ID of the catalog to be used. Default is whichever catalog is assigned to the storefront.
 * @returns {dw.web.URL} Transformed image URL
 */
function getImageURL(transform, src, context, contextId) {
    var URLUtils = require('dw/web/URLUtils');
    var contextData = getContextData(context, contextId);

    return URLUtils.absImage(URLUtils[contextData.context], contextData.contextId, src, transform);
}

module.exports = {
    getImageURL: getImageURL,
    getTransformParameterType: getTransformParameterType
};
