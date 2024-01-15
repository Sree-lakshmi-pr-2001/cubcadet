/**
 *    Google Product Feed Script specifically for google
 *    It is used to generate a text file containing a list of products and its attributes
 *
 *    The information related to the Google Product Feed can be found at the link given below
 *    http://www.google.com/support/merchants/
 *
 */


var ProductMgr = require('dw/catalog/ProductMgr'),
    Helper = require('./Helper'),
    File = require('dw/io/File'),
    Calendar = require('dw/util/Calendar'),
    StringUtils = require('dw/util/StringUtils'),
    Status = require('dw/system/Status');

var GoogleFeed = {
    /**
     * Step 1: Generate Google Feed File
     */
    run: function (args) {
        try {
            Helper.init();

            var productIterator = ProductMgr.queryAllSiteProducts(),
                fileInfo = Helper.getFileInfo(),
                csvWriter = Helper.getCSVWriter(fileInfo);

            /**
             * write header
             */
            csvWriter.writeNext(Helper.getFieldNames());

            while(productIterator.hasNext()) {
                var product = productIterator.next();
                if (product.master) {
                    continue;
                }
                if (product.online && product.searchable && !product.custom.glExcludedProduct) {
                    csvWriter.writeNext(Helper.getLine(product));
                }
            }

            csvWriter.close();
            productIterator.close();
            args.JobContext.put('FileName', fileInfo.file.fullPath);
            return new Status(Status.OK);
        } catch (e) {
            Helper.logger.error(e, 'feed');
            return new Status(Status.ERROR, null, e.message);
        }
    },

    /**
     * Step 2: send generated file to sftp server
     */
    upload: function (args) {
        var ftp = new dw.net.SFTPClient();
        Helper.init();
        try {
            var conn = false,
                port = Helper.getPref('googleMerchantPort'),
                hostName = Helper.getPref('googleMerchantHostName'),
                userName = Helper.getPref('googleMerchantHostUserName'),
                password = Helper.getPref('googleMerchantHostPassword'),
                hostFileName = Helper.getPref('googleMerchantFileName'),
                file = new File(args.JobContext.FileName),
                feedpath = Helper.getPref('googleMerchantFeedPath');

            ftp.setTimeout(600000);

            if (!empty(port)) {
                conn = ftp.connect(hostName, new Number(port), userName, password);
            } else {
                conn = ftp.connect(hostName , userName , password)
            }
            if(conn){
                ftp.putBinary(feedpath + '/' + hostFileName,file);
                ftp.disconnect();
                return new Status(Status.OK);
            }else{
                throw new Error('Error while trying to connect to Google FTP server');
            }
        } catch(e) {
            return new Status(Status.OK);

            Helper.logger.error(e, 'feed');
            return new Status(Status.ERROR, null, e.message);
        }
    },

    /**
     * Step 3: archive generated file
     */
    archive: function (args) {
        try {
            var fileInfo = Helper.getFileInfo(),
                filePath = fileInfo.fileDir,
                folderName = 'archive',
                successName = 'googlefeed',
                fileName = new File(args.JobContext.FileName),
                newFilePath = filePath + File.SEPARATOR + folderName;


            var file = new File(newFilePath),
                calendar = new Calendar();

            calendar.timeZone = 'GMT';
            var gmtDateString = StringUtils.formatCalendar(calendar, "yyyy-MM-dd_HH-mm-ss");

            if (!file.exists()){
                file.mkdirs();
            }

            var newName = successName + "__" + gmtDateString + '.txt';
            var newfilename = new File(newFilePath + File.SEPARATOR + newName);
            fileName.renameTo(newfilename);
            return new Status(Status.OK);
        } catch (e) {
            var error = e;
            Helper.logger.error(e, 'feed');
            return new Status(Status.ERROR, null, e.message);
        }
    },

    /**
     * Step 4: cleanup working folder
     */
    cleanup: function (args) {
        try  {
            var daysToBeArchived = Helper.getPref('googleMerchantArchiveDays'),
                fileInfo = Helper.getFileInfo(),
                filePath = fileInfo.fileDir,
                cleanupDate = new Calendar(),
                localArchiveFolder = new File(filePath + File.SEPARATOR + 'archive');

            if (!localArchiveFolder.exists()) {
               throw new Error('Folder Archive ' + localArchiveFolder.fullPath + ' does not exist.');
            }

            var calendar = new Calendar();
            calendar.timeZone = 'GMT';

            var oldCalendar = dw.system.System.getCalendar();
            oldCalendar.setTime(calendar.getTime());
            oldCalendar.add(Calendar.DAY_OF_YEAR, -1 * daysToBeArchived);
            oldCalendar.add(Calendar.MINUTE, -10);

            for each (var archiveFile in localArchiveFolder.listFiles()) {
                var fileCalendar  = new Calendar(new Date(archiveFile.lastModified()));
                if (fileCalendar.before(oldCalendar)) {
                    archiveFile.remove();
                }
            }

        } catch (e) {
            var error = e;
            Helper.logger.error(e, 'feed');
            return new Status(Status.ERROR, null, e.message);
        }
    }
}

module.exports = GoogleFeed;