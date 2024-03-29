'use strict';

const File = require('dw/io/File');
const Site = require('dw/system/Site');
const Status = require('dw/system/Status');
const Logger = require('dw/system/Logger').getLogger('Bazaarvoice', 'bvDownloadFeeds.js');

const BV_Constants = require('bc_bazaarvoice/cartridge/scripts/lib/libConstants').getConstants();
const BVHelper = require('bc_bazaarvoice/cartridge/scripts/lib/libBazaarvoice').getBazaarVoiceHelper();
const BV_Services = require('bc_bazaarvoice/cartridge/scripts/lib/ServiceInit');


module.exports.execute = function(parameters, stepExecution) {
	try {
		var service = BV_Services['sftpImport' + Site.current.ID];
    	var result;
    	 
        var fpath = BV_Constants.RatingsFeedPath;
		if(empty(fpath)){
			throw new Error('BV_Constants.RatingsFeedPath is null or empty! Verify the configuration in libConstants.ds');
		}
		var fname = BVHelper.getRatingsFeedName();
		if(empty(fname)){
			throw new Error('BV_Constants.RatingsFeedFilename is null or empty! Verify the configuration in libConstants.ds');
		}
		
		result = service.setOperation('cd', fpath).call();
		if(!result.isOk()) {
			throw new Error('Error while accessing folder on BV FTP Server.');
		}
		
		//make sure the directories have been made
		var tempPath = [File.TEMP, 'bv', 'ratings'].join(File.SEPARATOR);
		var tempFile = new File(tempPath);
		tempFile.mkdirs();
		
		//create the file for downloading
		tempPath = [File.TEMP, 'bv', 'ratings', 'ratings.xml.gz'].join(File.SEPARATOR);
		tempFile = new File(tempPath);
        
		result = service.setOperation('getBinary', fpath + File.SEPARATOR + fname, tempFile).call();
        if(result.isOk()) {
        	//gunzip
        	tempPath = [File.TEMP, 'bv', 'ratings'].join(File.SEPARATOR);
        	tempFile.gunzip(new File(tempPath));
        	
        	//need to rename the file after gunzip to remove the .gz 
        	tempPath = [File.TEMP, 'bv', 'ratings', 'ratings.xml'].join(File.SEPARATOR);
        	tempFile = new File(tempPath);
        	
        	if(!tempFile.exists()) {
        		throw new Error('GUNZIP of ratings.xml.gz was unsuccessful.  ratings.xml does not exist.');
        	}
        } else {
        	Logger.info('Download failed: ' + result.msg);
    		return new Status(Status.ERROR, 'ERROR', result.msg);
        }
	} catch(e) {
		Logger.error('Exception caught: ' + e.message);
		return new Status(Status.ERROR, 'ERROR', e.message);
	}
	
	return new Status(Status.OK);
};