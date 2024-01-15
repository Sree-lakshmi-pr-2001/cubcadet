/**
* Job Step Type that delete files from folder 
*/

'use strict';

var Logger = require('dw/system/Logger').getLogger('cs.job.DeleteFiles');
var File = require('dw/io/File');
var Status = require('dw/system/Status');

var StepUtil = require('~/cartridge/scripts/util/StepUtil');

/**
 * Bootstrap function for the Job
 *
 * @return {dw.system.Status} Exit status for a job run
 */
var run = function () {
    var args = arguments[0];

    if (StepUtil.isDisabled(args)) {
        return new Status(Status.OK, 'OK', 'Step disabled, skip it...');
    }

    // Load input Parameters
    var sourceFolder = StepUtil.replacePathPlaceholders(args.SourceFolder);

    var filePattern = args.FilePattern;
    var noFilesFoundStatus = args.NoFileFoundStatus;
    var fileDaysOld = args.FileDaysOld;
    
    var oldCalendar = dw.system.System.getCalendar();
    if (fileDaysOld != null && fileDaysOld > 0) {
        oldCalendar.add(dw.util.Calendar.DAY_OF_YEAR, -fileDaysOld);
    }


    // Open directories and check for existence
    var sourceDirectory = new File(sourceFolder);

    if (!sourceDirectory.isDirectory()) {
        Logger.error('Source folder is not a directory: ' + sourceFolder);
        return new Status(Status.ERROR, 'ERROR', 'Source folder does not exist.');
    }

    var files = sourceDirectory.listFiles();
    var atLeastOneProcessed = false;
    
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        
        if (filePattern && file.getName().match(filePattern) === null) {
            continue;
        }
        
        if (fileDaysOld != null && fileDaysOld > 0) {
            var fileCalendar = new dw.util.Calendar(new Date(file.lastModified()))
            if (fileCalendar.after(oldCalendar)) {
                continue;
            }
        }

        dw.system.Logger.getRootLogger().info('DeleteFiles:  Deleting file ' + file.fullPath + '...');
        file.remove();
        atLeastOneProcessed = true;
    }

    if (atLeastOneProcessed === false) {
        Logger.info('Nothing to delete.');

        switch (noFilesFoundStatus) {
        case 'ERROR':
            return new Status(Status.ERROR, 'ERROR', 'No files to delete.');

        default:
            return new Status(Status.OK, 'NO_FILE_FOUND', 'No files to delete.');
        }
    }

    return new Status(Status.OK);
};

exports.Run = run;
