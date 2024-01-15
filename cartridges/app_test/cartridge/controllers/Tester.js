'use strict';

var server = require('server');

/**
 * This action will render all the test suites that are configured in the 'tests.json' file
 */
server.get('Start', function (req, res, next) {
    var System = require('dw/system/System');
    var listOfTestSuites;
    if (System.getInstanceType() === System.PRODUCTION_SYSTEM) {
        return next(new Error('Tests cannot be run on production instance!'));
    }

    var LogError = require('*/cartridge/scripts/lib/LogError');

    try {
        listOfTestSuites = require('*/cartridge/scripts/testsuites.json');
    } catch (e) {
        LogError('Tester-Start', e);
        return next(new Error(e));
    }

    res.render('displayTestSuites', {
        ListOfTestSuites: listOfTestSuites
    });
    next();
});

/**
 * This action will display the tests for a test suite in a table
 */
server.get('DisplaySuite', function (req, res, next) {
    var System = require('dw/system/System');
    var suite;
    if (System.getInstanceType() === System.PRODUCTION_SYSTEM) {
        return next(new Error('Tests cannot be run on production instance!'));
    }

    var LogError = require('*/cartridge/scripts/lib/LogError');
    var TestSuiteMgr = require('*/cartridge/scripts/lib/TestSuiteMgr');

    try {
        suite = TestSuiteMgr.get(req.querystring.suite);
    } catch (e) {
        LogError('Tester-DisplaySuite', e);
        return next(new Error(e));
    }

    res.render('displayTestSuite', {
        TestSuite: suite
    });
    next();
});

/**
 * This action will run a test
 */
server.get('Run', function (req, res, next) {
    var System = require('dw/system/System');
    var Transaction = require('dw/system/Transaction');
    var testSuite;
    if (System.getInstanceType() === System.PRODUCTION_SYSTEM) {
        return next(new Error('Tests cannot be run on production instance!'));
    }

    var LogError = require('*/cartridge/scripts/lib/LogError');
    var TestSuiteMgr = require('*/cartridge/scripts/lib/TestSuiteMgr');

    try {
        var testToRun = parseInt(req.querystring.testid, 10);
        Transaction.wrap(function () {
            testSuite = TestSuiteMgr.get(req.querystring.suite).run(testToRun);
        });
    } catch (e) {
        LogError('Tester-Run', e);
        return next(new Error(e));
    }

    if ('format' in req.querystring && req.querystring.format === 'xml') {
        res.render('returnXML', {
            TestSuite: testSuite
        });
    } else {
        res.render('returnJSON', {
            Result: JSON.stringify(testSuite)
        });
    }
    next();
});

module.exports = server.exports();
