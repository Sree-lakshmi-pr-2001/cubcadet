
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

var _moduleName = 'exportMonetateProductsCSV';

// Module level variables
var ProductIterator,
    Site,
    Status,
    CSVStreamWriter,
    logger,
    productCSVConfig,
    writeFile,
    tmpFile,
    productProcessor,
    csvWriter;


function beforeStep(parameters, stepExecution) {
    // Before Job Step - do all the step initialization here

    // IMPORTANT! When adding a field keep the order according to Feed Specification.
    var MONETATE_CSV_FIELDS = [
        'item_group_id',
        'id',
        'title',
        'image_link',
        'link',
        'description',
        'price',
        'product_type',
        'additional_image_link',
        'availability',
        'brand',
        'color',
        'size'
    ];

    Status = require('dw/system/Status');
    logger = require('dw/system/Logger').getLogger('monetate', 'Monetate');
    Site = require('dw/system/Site');
    CSVStreamWriter = require('dw/io/CSVStreamWriter');
    productProcessor = require('int_monetate/cartridge/scripts/monetate/processProducts');
    writeFile = require('int_monetate/cartridge/scripts/monetate/writeFile');

    productCSVConfig = {
        productImage : Site.getCurrent().getCustomPreferenceValue('monetateImageProductSelector') || 'large',
        searchImage  : Site.getCurrent().getCustomPreferenceValue('monetateImageSearchSelector') || 'medium',
        endCapImage  : Site.getCurrent().getCustomPreferenceValue('monetateImageEndCapSelector') || 'small',
        csvFields    : MONETATE_CSV_FIELDS
    };

    tmpFile = writeFile.initTempFile('csv');

    if (empty(tmpFile.file) && empty(tmpFile.writer)) {
        throw new Error('Error creating a temp file for product feed.');
    }

    csvWriter = new CSVStreamWriter(tmpFile.writer);
    csvWriter.writeNext(MONETATE_CSV_FIELDS);

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
    var csvString = productProcessor.createProductCSV(product, productCSVConfig);

    if (csvString !== '') {
        return csvString;
    }
    //  If no object/item is returned it will not appear in chunk list.
}

function write(productCsv, parameters, stepExecution) {
    // this function receive the List of chunks, defined by the "chunk-size": setting in the steptype.json
    for (var i = 0; i < productCsv.size(); i++) {
        csvWriter.writeNext(productCsv.get(i).toArray());
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
        ZIPFile = writeFile.generateCSVFeed();

        uploadResult = require('int_monetate/cartridge/scripts/monetate/libMonetate').sendToSFTP(ZIPFile);

        if (!uploadResult) {
            logger.error('File:' + ZIPFile.getFullPath() + ' ,could not be uploaded. At module: ' + _logSource);
            throw new Error('File:' + ZIPFile.getFullPath() + ' ,could not be uploaded');
        }
    } else {
        throw new Error('Errors while products CSV generation, can`t proceed with upoload.');
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
