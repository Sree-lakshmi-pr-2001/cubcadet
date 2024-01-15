/**
* Description of the module and the logic it provides
*
* @module cartridge/scripts/google/Helper
*/

'use strict';

var File = require('dw/io/File'),
    FileWriter = require('dw/io/FileWriter'),
    CSVStreamWriter = require('dw/io/CSVStreamWriter'),
    Site = require('dw/system/Site'),
    ProductFieldsHelper = require('./ProductFields.js'),
    StringUtils = require('dw/util/StringUtils');

var Helper = {
    defaults: {
        brandName: null,
        numberOfDays: null,
        feedType: 'full'
    },
    init: function () {
        Helper.brandName = Helper.getPref('googleMerchantBrandName');
        ProductFieldsHelper.Helper = Helper;
    },
    /**
     * Get site custom preference value
     * @param {name} : String
     * @returns {value} : Object
     */
    getPref: function (name) {
        return Site.current.getCustomPreferenceValue(name);
    },
    
    /**
     * Get fileName which will be used as feed file name
     * @returns {fileName} : String
     */
    getFileName: function () {
        var fileName = this.getPref('googleMerchantFileName') + 
            '_' + StringUtils.formatCalendar(dw.system.System.getCalendar(), 'yyyy-MM-dd_HH-mm-ss-SSS') + '.txt';
        return fileName;
    },
    
    /**
     * Fields which will be added in feed file, also this 
     * will be used as first line of feed file (field names)
     * @returns {fields} : Array
     */
    getFieldNames: function () {
        return ['id','title','description','link','mobile_link','price','sale_price',
                'google_product_category','brand','condition',
                'image_link','additional_image_link','swatch_image_link',
                'product_type','size','availability','availability_date',
                'mpn','gtin','prd_id', 'promotion_id'];
    },
    
    getFileInfo: function () {
        var sp = File.SEPARATOR,
            filePath = this.getPref('googleMerchantFilePath'),
            fileDir = File.IMPEX + sp + filePath,
            fileName = this.getFileName(),
            file = new File(fileDir + sp + fileName),
            separator = '\t',
            quote = "'";
        return {
            file: file,
            fileDir: fileDir,
            fileName: fileName,
            separator: separator,
            quote: quote
        }
    },
    
    /**
     * Build CSVStreamWriter
     * @returns {writer} : dw.io.CSVStreamWriter;
     */
    getCSVWriter: function(info){
        
        if(!info.file.exists()){
            (new File(info.fileDir)).mkdirs();
            info.file.createNewFile();
        }

        return new CSVStreamWriter(new FileWriter(info.file), info.separator, info.quote);
    },
    
    getLine: function (product) {
        var line = [],
            pf = ProductFieldsHelper,
            names = Helper.getFieldNames();
        
        for each(var functionName in names) {
            if (functionName in pf && typeof pf[functionName] == 'function'){
                line.push(pf[functionName](product));
            }
        }
        
        return line;
    },
    
    getCategoryPath: function (product) {

        var categoryPath = '',
            topProduct = product;

        if (topProduct.isVariant()) {
            topProduct = product.masterProduct;
        }

        var theCategory = topProduct.getPrimaryCategory();

        if (empty(theCategory)) {
            var categories = topProduct.categories;

            if (!empty(categories)) {
                theCategory = categories[0];
            }
        }

        var cat = theCategory,
            path = new dw.util.ArrayList();

        while (!empty(cat) && !empty(cat.parent)) {
            if (cat.online) {
                path.addAt(0, cat);
            }
            cat = cat.parent;
        }

        for (var index = 0; index < path.length; index++) {

            if (index == 0) {
                categoryPath = categoryPath + path[index].getDisplayName();
            } else {
                categoryPath = categoryPath + ">" + path[index].getDisplayName();
            }
        }
        return categoryPath;
    },
    
    logger: {
        /**
         * Used in debuger
         */
        errorMessage: null,
        error: function (e, logFilename){
            var error = this.prepareLogMessage(e);
            if (logFilename) {
                dw.system.Logger.getLogger('googlefeed-'+logFilename, 'error').error(error);
            } else {
                dw.system.Logger.error(error);
            }
        },
        debug: function (e){
            dw.system.Logger.debug(this.prepareLogMessage(e));
        },
        info: function (e){
            dw.system.Logger.info(this.prepareLogMessage(e));
        },
        prepareLogMessage: function (e){
            var msg = '';
            msg += 'fileName:' + e.fileName + '\n';
            msg += 'lineNumber:' + e.lineNumber + '\n';
            msg += 'message:' + e.message + '\n';
            msg += 'stack:' + e.stack + '\n';
            this.errorMessage = e.message;
            return msg;
        }
    }
}

module.exports = Helper;