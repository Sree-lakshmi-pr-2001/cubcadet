var currentCategory;
var currentBefore;
var currentAfter;
var currentBeforeEach;
var currentAfterEach;

var suite = require('/app_test/cartridge/scripts/lib/TestSuiteBase');
suite.tests = [];

function describe(name, func) {
   	currentCategory = name;
	
	func();
	
	var tests = suite.tests.filter(function(test) {
		return ((test.category === currentCategory) && (!test.skip)); 
	});
	
	if (tests.length) {
		tests[0].before = currentBefore;
		tests[tests.length-1].after = currentAfter; 
	}
	
	currentCategory = null;
	currentBefore = null;
	currentAfter = null;
	currentBeforeEach = null;
	currentAfterEach = null;
	
	suite.name = name;
	
	return suite;
}

function it(name, func) {
	var test = createTest(name, func, false);
	
	if (name) {
		suite.tests.push(test);
	}
	return {
		expectedError: function(expectedError) {
			test.expectedError = expectedError;
		} 
	}
}

it.skip = function(name, func) {
	suite.tests.push(createTest(name, func, true));
}

function beforeEach(func) {
	if (func) {
		currentBeforeEach = func;
	}
}

function afterEach(func) {
	if (func) {
		currentAfterEach = func;
	}
}

function before(func) {
	if (func) {
		currentBefore = func;
	}
}

function after(func) {
	if (func) {
		currentAfter = func;
	}
}

function createTest(name, func, skip) {
	var test = {
			'name': name,
			'run' : func,
			'skip': skip,
			'category': currentCategory,
			'beforeEach': currentBeforeEach,
			'afterEach': currentAfterEach
		};
	return test;
}

module.exports.describe = describe;
module.exports.it = it;
module.exports.beforeEach = beforeEach;
module.exports.afterEach = afterEach;
module.exports.before = before;
module.exports.after = after;