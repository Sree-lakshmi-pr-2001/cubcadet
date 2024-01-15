
'use strict';

/**
 * A chunk-oriented script module.
 * It reads and processes a list of items in chunks of size S and then writes a list of processed items.
 *
 * Configuration of module is in the 'steptypes.json' file in the root of a cartridge.
 *
 * For more information read the 'Chunk-Oriented Script Module' section at
 * @link: https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/Jobs/CreatingaNewJobSchedule.html
 */

var _moduleName = 'exportMonetateProductsXML';

// Module level variables
var ProductIterator,
    Site,
    Status,
    logger,
    productXMLConfig,
    writeFile,
    tmpFile;

// Before Job Step
function beforeStep(parameters, stepExecution) {
    // Do all the step initialization here

    Status = require('dw/system/Status');
    logger = require('dw/system/Logger').getLogger('monetate', 'Monetate');
    Site = require('dw/system/Site');

    productXMLConfig = {
        useVariation : Site.getCurrent().getCustomPreferenceValue('monetateVariationInFeed'),
        productImage : Site.getCurrent().getCustomPreferenceValue('monetateImageProductSelector') || 'large',
        searchImage  : Site.getCurrent().getCustomPreferenceValue('monetateImageSearchSelector') || 'medium',
        endCapImage  : Site.getCurrent().getCustomPreferenceValue('monetateImageEndCapSelector') || 'small'
    };

    writeFile = require('int_monetate/cartridge/scripts/monetate/writeFile');
    tmpFile = writeFile.initTempFile('xml');

    if (empty(tmpFile.file) && empty(tmpFile.writer)) {
        throw new Error('Error creating a temp file for product feed.');
    }

    ProductIterator = require('dw/catalog/ProductMgr').queryAllSiteProducts();

    // Limit for debug
    // @TODO Remove before Shipping
    // ProductIterator.forward(20, 100);
}

function read(parameters, stepExecution) {
    // read a single object. Function should always return data, if return nothing framework will thing that there is no more items.
    if (ProductIterator.hasNext()) {
        return ProductIterator.next();
    }
}

function process(product, parameters, stepExecution) {
    // createProductXML() returns empty string if the product should not be included in export feed
    var xmlString = require('int_monetate/cartridge/scripts/monetate/processProducts').createProductXML(product, productXMLConfig);

    if (xmlString !== '') {
        return xmlString;
    }
    //  If no object/item is returned it will not appear in chunk list.
}

function write(productXml, parameters, stepExecution) {
    // this function receive the List of chunks, defined by the "chunk-size": setting in the steptype.json
    for (var i = 0; i < productXml.size(); i++) {
        tmpFile.writer.writeLine(productXml.get(i));
    }
}

// Do all the cleanup here
function afterStep(success, parameters, stepExecution) {
    var _logSource = _moduleName + '.afterStep()\n',
        uploadResult,
        ZIPFile;

    writeFile.closeTempFile();
    ProductIterator.close();

    if (success) {
        ZIPFile = writeFile.generateXMLFeed();
        uploadResult = require('int_monetate/cartridge/scripts/monetate/libMonetate').sendToSFTP(ZIPFile);

        if (!uploadResult) {
            logger.error('File:' + ZIPFile.getFullPath() + ' ,could not be uploaded. At module: ' + _logSource);
            throw new Error('File:' + ZIPFile.getFullPath() + ' ,could not be uploaded');
        }
    } else {
        throw new Error('Errors while products XML generation, can`t proceed with upoload.');
    }
}

function getTotalCount(parameters, stepExecution) {
    return ProductIterator.count;
}

module.exports = {
    beforeStep    : beforeStep,
    read          : read,
    process       : process,
    write         : write,
    afterStep     : afterStep,
    getTotalCount : getTotalCount
};
