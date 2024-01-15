'use strict';

/**
 * Provides the job framework workflow for updating line item order status 
 * with updates from an OMS.
 *
 * @module scripts/OrderStatusWorkflow
 */

/* Script Modules */

var File = require('dw/io/File');
var FileReader = require('dw/io/FileReader');
var SortedSet = require('dw/util/SortedSet');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var UpdateStatusLogger = require('dw/system/Logger').getLogger('updateOrderStatus', 'updateOrderStatus');
var libOrderStatus = require('int_orderstatus/cartridge/scripts/libOrderStatus.js');

/**
 * Uses preferrences set in job step to locate the downloaded OMS XML file,
 * iterate through the lines, and send each line to libOrderStatus.UpdateOrderWithJSON()
 * to update line item values.
 *
 * @args {String} arguments The file location set in download-orders job step
 *
 */

function execute() {
    try {
        var filesLocationDir = arguments[0].file_location;
        var rootDirectory = new File(File.IMPEX + File.SEPARATOR + filesLocationDir);
        var archiveSrc = File.IMPEX + File.SEPARATOR + filesLocationDir + File.SEPARATOR + 'archive';
        var currentDate = StringUtils.formatCalendar(new Calendar(), 'dd-MM-yyyy');
        var archiveSuccessDir = new File(archiveSrc + File.SEPARATOR + 'success' + File.SEPARATOR + currentDate);
        var archiveErrorDir = new File(archiveSrc + File.SEPARATOR + 'error' + File.SEPARATOR + currentDate);
        var fileList =  new SortedSet();
        
        if (!archiveSuccessDir.exists()) {
            archiveSuccessDir.mkdirs();
        }
        
        if (!archiveErrorDir.exists()) {
            archiveErrorDir.mkdirs();
        }

        getRecursiveFiles(rootDirectory, fileList, archiveSrc);

        for each (var fileSource in fileList) {
            var file = File(fileSource);
            var fileReader = FileReader(file);

            var nextLine = "";
            var successFileHandling = true;

            while (nextLine = fileReader.readLine()) {
                
                try {
                    var lineParts = nextLine.split('|');
                    UpdateStatusLogger.info('JSON: {0}', StringUtils.trim(lineParts[1]));
                    libOrderStatus.UpdateOrderWithJSON(JSON.parse(StringUtils.trim(lineParts[1])));
                } catch (orderException) {
                    var exception = orderException;
                    successFileHandling = false;
                    UpdateStatusLogger.error('{0}: {1}', exception, exception.stack);
                }
            }
            fileReader.close();

            // Upload to archive folder
            if (successFileHandling) {
                file.copyTo(new File(archiveSuccessDir.getFullPath() + File.SEPARATOR + file.getName()));
            } else {
                file.copyTo(new File(archiveErrorDir.getFullPath() + File.SEPARATOR + file.getName()));
            }
            file.remove();
        }
        
    } catch (e) {
        var exception = e;
        UpdateStatusLogger.error('{0}: {1}', exception, exception.stack);
    } finally {
        clearArchiveDirs(archiveSrc);
    }
}

/**
 * A recursive function to collect all files below a directory.
 *
 * @param rootDirectory : File      The root directory
 * @param fileList : SortedSet      The list of files
 */
function getRecursiveFiles(rootDirectory, fileList, archiveSrc) {
    if (empty(rootDirectory)
        || !rootDirectory.isDirectory()) {
        return;
    }

    for each (var file in rootDirectory.listFiles()) {
        if (file.isDirectory()) {
            if (file.name !== 'archive') {
                getRecursiveFiles(file, fileList, archiveSrc);
            }
        } else {
            fileList.add(file);
        }
    }
}

/**
 * Clear archive directories
 * 
 * @param {String} archiveSrc
 */
function clearArchiveDirs(archiveSrc) {
    var archiveSuccessDir = new File(archiveSrc + File.SEPARATOR + 'success');
    var archiveErrorDir = new File(archiveSrc + File.SEPARATOR + 'error');
    var fileList = new SortedSet();
    for each (var file in archiveSuccessDir.listFiles()) {
        if (file.isDirectory()) {
            fileList.add(file);
        }
    }
    
    for each (var file in archiveErrorDir.listFiles()) {
        if (file.isDirectory()) {
            fileList.add(file);
        }
    }
    
    for each (var file in fileList) {
        handleOldArchive(file);
    }
}

/**
 * Handle archive dirs
 * 
 * @param {dw.io.File} file
 */
function handleOldArchive(file) {
    var dirName = file.getName();
    var dirNameParts = dirName.split('-');
    var dirDate = new Date(dirNameParts[2], dirNameParts[1] - 1, dirNameParts[0]);
    var dirCalendar = new Calendar(dirDate);
    var compareCalendar = new Calendar();
    compareCalendar.add(Calendar.DAY_OF_YEAR, -30);
    if (compareCalendar.compareTo(dirCalendar) == 1) {
        file.remove();
    }
}

exports.execute = execute;