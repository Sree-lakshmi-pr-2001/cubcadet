"use strict";

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const Q = require('q');
const querystring = require('querystring');
const request = require('request-promise-native').defaults({ simple: false });
const url = require('url');

/**
 * @class
 * @classdesc Webdav is used to perform upload and delete functions on the instance server that is provided by the configuration stored in the gulp builder object (gb)
 */
function Webdav(options) {
    /**
     * Contains the user name for the HTTP request
     * @member {string} user
     */
    this.username = options.username;

    /**
     * Contains the password for the HTTP request
     * @member {string} password
     */
    this.password = options.password;

    /**
     * Contains the host name of the webdav server
     * @member {string} hostname
     */
    this.hostname = 'https://' + (options.certHostname || options.hostname);
    
    /**
     * Contains the host name of the webdav server to activate code on
     * @member {string} activationHostname
     */
    this.activationHostname = 'https://' + options.activationHostname;

    /**
     * Contains the code version to use on the webdav server
     * Making an edit because the dwupload module and sgmf build scripts are out of sync 
     * with regards to variable naming
     */
    if ('codeVersion' in options) {
        this.codeVersion = options.codeVersion;
    }
    else if ('code-version' in options) {
        this.codeVersion = options['code-version'];
    }
    /**
     * Contains the p12 file location
     */
    this.p12 = options.p12;

    /**
     * Contains the p12 passphrase
     */
    this.passphrase = options.passphrase;

    /**
     * Contains the upload path for the webdav call
     */
    this.uploadPath = options.uploadPath || '/on/demandware.servlet/webdav/Sites/Impex/src/instance/';

    /**
     * Contains the url path for the impex status
     */
    this.impexStatusPath = '/on/demandware.store/Sites-Site/default/ViewSiteImpex-Status';

    /**
     * Contains the url path for the impex dispatch
     */
    this.impexDispatchPath = '/on/demandware.store/Sites-Site/default/ViewSiteImpex-Dispatch';

    /**
     * Contains the url path for the code activation script
     */
    this.activationPath = '/on/demandware.store/Sites-Site/default/ViewCodeDeployment-Activate';

    /**
     * Contains the url path for the business manager login form
     */
    this.loginPath = '/on/demandware.store/Sites-Site/default/ViewApplication-ProcessLogin';

    /**
     * The maximum number of times an HTTP request can retry
     * @member {number} MAX_RETRY
     */
    this.MAX_RETRY = 1;
};

/**
 * @function
 * @desc Logs into the business manager using the form instead of basic authentication
 * @returns
 */
Webdav.prototype.formLogin = async function () {
    const method = 'POST',
        deferred = Q.defer();

    // Login form should not include cert.staging
    var hostname = this.hostname;
    if (this.hostname.indexOf('cert.') > -1) {
        hostname = hostname.replace('cert.', '');
    }

    // Build the options for the upload
    let options = this.buildHttpOptions({
        method: method,
        uploadPath: this.loginPath,
        hostname: hostname
    });
    options.form = {
        LoginForm_Login: this.username,
        LoginForm_Password: this.password,
        LoginForm_RegistrationDomain: 'Sites'
    };
    options.jar = true;
    options.ignoreErrors = true;
    options.followRedirect = true;

    if (options) {
        const req = this.handleRequest(options, (res) => {
            if (res.statusCode === 302 || res.statusCode === 200) {
                console.log('Login Successful');
                deferred.resolve();
                return deferred.promise;
            } else {
                deferred.reject(new Error('Failed logged into ' + this.hostname + '. (Response: ' + res.statusCode + ')'));
                return;
            }
        });
    } else {
        deferred.reject(new Error('HTTP Options not properly setup.'));
    }

    return deferred.promise;
};

/**
 * @function
 * @description Uploads the data contained in the filename to the given destination
 * @param {string} filename - Zip file on the drive that contains the cartridges to be deployed to the given version
 * @param {string} dest - Destination that the file will be uploaded to
 */
Webdav.prototype.uploadFile = async function (filename, dest = path.basename(filename)) {
    const method = 'PUT',
        deferred = Q.defer();

    // Build the options for the upload
    let options = this.buildHttpOptions({
        method: method,
        dest: dest
    });
    options.body = fs.createReadStream(filename);

    if (options) {
        const req = this.handleRequest(options, (res) => {
            if (res.statusCode === 201 || res.statusCode === 200) {
                deferred.resolve();
            } else if (res.statusCode === 204) {
                let error = new Error('Remote file exists! The release file was not removed from the server on the last deployment. Please check to make sure that the unzip-files task worked correctly.');
                error.code = res.statusCode;
                deferred.reject(error);
                return;
            } else if (res.statusCode === 401) {
                let error = new Error('Authentication failed. Check your credentials.');
                error.code = res.statusCode;
                deferred.reject(error);
                return;
            } else if (res.statusCode === 405) {
                let error = new Error('Remote server does not support webdav!');
                error.code = res.statusCode;
                deferred.reject(error);
                return;
            } else {
                let error = new Error('Unknown error occurred:', res.statusCode);
                error.code = res.statusCode;
                deferred.reject(error);
                return;
            }
        });

        console.log('Deploying zip to ' + this.hostname + this.uploadPath + dest);
    } else {
        deferred.reject(new Error('HTTP Options not properly setup.'));
    }

    return deferred.promise;
};

/**
 * @function
 * @description Unzips the given file name on the server
 * @param {string} filename - Zip file on the drive that contains the cartridges to be deployed to the given version
 * @param {string} dest - Destination that the file will be uploaded to
 */
Webdav.prototype.unzipFile = async function (filename) {
    const method = 'POST',
        deferred = Q.defer();

    // Build the options for the upload
    let options = this.buildHttpOptions({
        method: method,
        dest: filename
    });
    options.form = {
        method: 'UNZIP'
    };

    if (options) {
        const req = this.handleRequest(options, (res) => {
            if (res.statusCode === 201 || res.statusCode === 200) {
                deferred.resolve();
            } else if (res.statusCode === 404) {
                let error = new Error('Given file', filename, 'not found');
                error.code = res.statusCode;
                deferred.reject(error);
                return;
            } else {
                let error = new Error('Unknown error occurred:', res.statusCode);
                error.code = res.statusCode;
                deferred.reject(error);
                return;
            }
        });
    } else {
        deferred.reject(new Error('HTTP Options not properly setup.'));
    }

    return deferred.promise;
};

/**
 * @function
 * @desc Checks to see if an import is ready to run
 * @param dest
 * @returns
 */
Webdav.prototype.importReady = async function () {
    const IMPORT_STATUS_RUNNING = 'Running';
    const IMPORT_PROCESS_NAME = 'Site Import';
    const method = 'GET',
    deferred = Q.defer();

    // Should not include cert.staging
    var hostname = this.hostname;
    if (this.hostname.indexOf('cert.') > -1) {
        hostname = hostname.replace('cert.', '');
    }

    // Build the options for the delete
    let options = this.buildHttpOptions({
        method: method,
        uploadPath: this.impexStatusPath,
        hostname: hostname
    });
    options.jar = true;
    options.rejectUnauthorized = false;

    if (options) {
        const req = this.handleRequest(options, (res) => {
            if (res.statusCode === 200 || res.statusCode === 201) {
                const $ = cheerio.load(res.body);
                let importReady = true;

                $('.table_detail:contains(' + IMPORT_PROCESS_NAME + ')').each(function () {
                    if ($(this).parent().find(':contains(' + IMPORT_STATUS_RUNNING + ')').length > 0) {
                        importReady = false;
                        deferred.reject(new Error('Previous import still in-process. Need to wait/retry.'));
                        return false;
                    }
                });

                if (importReady) {
                    console.log('Import is ready to go!');
                    deferred.resolve();
                }
            } else if (res.statusCode === 401) {
                deferred.reject(new Error('Authentication Failed'));
                return;
            } else if (res.statusCode === 404) {
                console.warn('Page not found');
                deferred.resolve();
            } else if (res.statusCode === 405) {
                deferred.reject(new Error('Remote server does not support webdav!'));
                return;
            } else {
                deferred.reject(new Error('Unknown error occurred:', res.statusCode));
                return;
            }
        });

        console.log('\nChecking if import is ready...');
    } else {
        deferred.reject(new Error('HTTP Options not properly setup.'));
    }

    return deferred.promise;
};

/**
 * @function
 * @desc Run the import for each zip file
 * @param dest
 * @returns
 */
Webdav.prototype.importFile = async function (archiveFilename) {
    const method = 'POST',
    deferred = Q.defer();

    // Should not include cert.staging
    var hostname = this.hostname;
    if (this.hostname.indexOf('cert.') > -1) {
        hostname = hostname.replace('cert.', '');
    }

    // Build the options for the delete
    let options = this.buildHttpOptions({
        method: method,
        uploadPath: this.impexDispatchPath,
        hostname: hostname
    });
    options.form = {
        ImportFileName: archiveFilename,
        realmUse: 'false',
        import: 'OK'
    };
    options.jar = true;
    options.rejectUnauthorized = false;

    if (options) {
        const req = this.handleRequest(options, (res) => {
            if (res.statusCode === 200) {
                console.log('Successful import of ' + archiveFilename);
                deferred.resolve();
                return deferred.promise;
            } else {
                console.log('Failed import of ' + archiveFilename);
                deferred.reject(new Error('Unknown Error: ' + response.statusCode));
                return;
            }
        });

        console.log('\nImporting ' + archiveFilename + '...');
    } else {
        deferred.reject(new Error('HTTP Options not properly setup.'));
    }

    return deferred.promise;
};

/**
 * @function
 * @description Removes the given destination from the server
 * @param {string} dest - Destination that will be removed from the server
 */
Webdav.prototype.deleteDestination = async function (dest = '') {
    const method = 'DELETE',
        deferred = Q.defer();

    // Build the options for the delete
    const options = this.buildHttpOptions({
        method: method,
        dest: dest
    });

    if (options) {
        const req = this.handleRequest(options, (res) => {
            if (res.statusCode === 204) {
                deferred.resolve();
            } else if (res.statusCode === 401) {
                deferred.reject(new Error('Authentication Failed'));
                return;
            } else if (res.statusCode === 404) {
                console.warn('Remote version did not exist! You may need to set overwriteRelease to false in the deployment config. Proceeding with build.');
                deferred.resolve();
            } else if (res.statusCode === 405) {
                deferred.reject(new Error('Remote server does not support webdav!'));
                return;
            } else {
                deferred.reject(new Error('Unknown error occurred:', res.statusCode));
                return;
            }
        });

        console.log('\nRemoving', options.url.path, 'from the server.');
    } else {
        deferred.reject(new Error('HTTP Options not properly setup.'));
    }

    return deferred.promise;
};

/**
 * @function
 * @description Activates the given code version
 * @param {String} version - The code version to activate
 */
Webdav.prototype.activateCode = async function (version = this.codeVersion) {
    const method = 'POST',
    deferred = Q.defer();

    // Build the options for the delete
    let options = this.buildHttpOptions({
        method: method,
        uploadPath: this.activationPath,
        hostname: this.activationHostname
    });
    options.form = {
        CodeVersionID: version
    };
    options.jar = true;
    options.rejectUnauthorized = false;

    if (options) {
        const req = this.handleRequest(options, (res) => {
            if (res.statusCode === 200) {
                // look for the active version check image to ensure code is activated
                var $ = cheerio.load(res.body);
                var activeVersionName = $('.table_detail img[title="Active version."]').parent('.table_detail').next('.table_detail').find('a.table_detail_link2').text();
                if (activeVersionName === version) {
                    console.log('Code version activated on ' + this.hostname + '. Deployment successful!');
                } else {
                    console.error('Error: code version not activated on ' + this.hostname + '. Check CSRF settings');
                }
                deferred.resolve();
                return;
            } else {
                deferred.reject(new Error('Unknown Error: ' + response.statusCode));
                return;
            }
        });

        console.log('\nActivating code at ' + version + '...');
    } else {
        deferred.reject(new Error('HTTP Options not properly setup.'));
    }

    return deferred.promise;
};

/**
 * @function
 * @description uploads the data contained in filename to the given destination
 * @param {object} options - Options used to build the HTTP request
 */
Webdav.prototype.buildHttpOptions = function (options) {
    // Check to make sure a user and password exist before continuing
    if (typeof this.username !== 'string' || typeof this.password !== 'string') {
        console.error('Required properties missing: `user` and `pass`.');
        return false;
    }

    options.hostname = options.hostname || this.hostname;
    options.uploadPath = options.uploadPath || this.uploadPath;
    options.dest = options.dest || '';

    const destUrl = options.hostname + options.uploadPath + options.dest;

    var deconstructedDest = url.parse(destUrl),
        httpOptions = {
            method : options.method,
            url: deconstructedDest,
            auth : {
                user: this.username,
                pass: this.password
            },
            resolveWithFullResponse: true,
            secureProtocol: 'TLSv1_2_method'
        };

    // Add some extra attributes if the server is using two factor authentication
    if (typeof this.p12 !== 'undefined' && destUrl.indexOf('https://cert') === 0) {
        console.log("Two Factor Enabled Using File: " + this.p12);
        httpOptions.pfx = fs.readFileSync(this.p12);
        httpOptions.passphrase = this.passphrase;
        httpOptions.honorCipherOrder = true;
        httpOptions.rejectUnauthorized = false;
        httpOptions.securityOptions = 'SSL_OP_NO_SSLv3';
    }

    return httpOptions;
};

/**
 * @function
 * @description uploads the data contained in filename to the given destination
 * @param {Object} options - HTTP options to be used in the request
 * @param {requestCallback} callback - Callback function that will handle the HTTP request
 */
Webdav.prototype.handleRequest = async function (options, callback) {
    // Turn off unauthorized rejections for TLS connections
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

    let res = null

    try {
        res = await request(options);
        callback(res);
    } catch (e) {
        console.error('problem with request: ' + e.message);

        if (typeof this.p12 !== 'undefined' && this.hostname.indexOf('-') > -1) {
            console.warn('WARNING: Hyphens detected in hostname. Two-factor authentication requires usage of the dot convention in hostname.');
        }

        // Retry the request if an error has occurred up to the MAX_RETRY limit (default of 1)
        if (this.MAX_RETRY--) {
            this.handleRequest(options, callback);
        }
    }

    return res !== null ? res.request : null;
};

module.exports = Webdav;
