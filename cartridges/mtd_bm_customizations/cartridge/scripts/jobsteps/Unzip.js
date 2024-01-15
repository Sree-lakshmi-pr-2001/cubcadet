/**
* Job Step Type that moves (or copies) files from folder A to folder B
*/

'use strict';

var Logger = require('dw/system/Logger').getLogger('cs.job.MoveFiles');
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
    var targetFolder = StepUtil.replacePathPlaceholders(args.TargetFolder);

    var filePattern = args.FilePattern;
    var noFilesFoundStatus = args.NoFileFoundStatus;
    var deleteZipFile = args.DeleteZipFile;

    // Open directories and check for existence
    var sourceDirectory = new File(sourceFolder);
    var targetDirectory = new File(targetFolder);

    Logger.info('sourceDirectory : ' + sourceDirectory);
    Logger.info('targetDirectory : ' + targetDirectory);

    if (!sourceDirectory.exists()) {
        Logger.error('Source folder does not exists so we cannot move files from that directory: ' + sourceFolder);
        return new Status(Status.ERROR, 'ERROR', 'Source folder does not exist.');
    }

    if (!sourceDirectory.isDirectory()) {
        Logger.error('Source folder is not a directory: ' + sourceFolder);
        return new Status(Status.ERROR, 'ERROR', 'Source folder is not a directory.');
    }

    if (!targetDirectory.isDirectory()) {
        Logger.error('Target folder is not a directory: ' + targetDirectory);
        return new Status(Status.ERROR, 'ERROR', 'Target folder does not exist.');
    }

    var list = sourceDirectory.list();
    var filteredList = [];

    var targetFolderExists = false;

    list.forEach(function (element) {
        // Check RegEx pattern
        if (filePattern && element.match(filePattern) === null) {
            return;
        }

        filteredList.push(element);
    });

    if (filteredList.length === 0) {
        Logger.info('Nothing to unzip.');

        switch (noFilesFoundStatus) {
        case 'ERROR':
            return new Status(Status.ERROR, 'ERROR', 'No files to unzip.');

        default:
            return new Status(Status.OK, 'NO_FILE_FOUND', 'No files to unzip.');
        }
    }

    Logger.info('filteredList.length : '  + filteredList.length);

    // Second iteration: Unzip files
    filteredList.forEach(function (element) {
        // Check RegEx pattern
        if (filePattern && element.match(filePattern) === null) {
            Logger.debug('  - skipping because of RegEx: {0}', element);
            return;
        }

        var sourceFile = new File(sourceFolder + '/' + element);
        var targetFile = new File(targetFolder + '/' );

        Logger.debug ('sourceFile : ' + sourceFile);

        sourceFile.unzip(targetFile);
        if (deleteZipFile){
            sourceFile.remove();
        }
        
    });

    return new Status(Status.OK);
};

exports.Run = run;