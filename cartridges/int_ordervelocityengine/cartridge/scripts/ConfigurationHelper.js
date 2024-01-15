var System = require('dw/system/System')
var Calendar = require('dw/util/Calendar')
var StringUtils = require('dw/util/StringUtils')

var WatcherPreferences = {
	/* 
	@function
	@name setBaseData
	@description Sets the baseData of the ConfigurationHelper object to the provided JSON configuration.
	@params {object} object The JSON object from the custom preferences
	*/	
	setBaseData: function(object) {
		this.baseData = object;
	},
	/* 
	@function
	@name isValid
	@description Determines if JSON is valid. Checks that the JSON is valid JSON as well as if all of the inputs are numerical.
	@returns {boolean}
	*/
	isValid: function() {
	    var domains = this.getDomains(),
		arrayLength = domains.length,
		trueArray = [],
		timeCheckArray = [],
		obj = JSON.parse(this.baseData);
		if (obj && typeof obj === 'object' && obj !== null) {
			for (var i = 0; i < arrayLength; i++) {
				secondLevel = obj[domains[i]];
				for (var key in secondLevel) {
					if (secondLevel.hasOwnProperty(key)) {
					    timeCheckArray.push(secondLevel[key]);
					}
				}
			}
			for (var z in timeCheckArray) {
			    for (var j in timeCheckArray[z]) {
			        var timeCheckNumber = timeCheckArray[z][j].timeToCheck;
			        var orderFaultNumber = timeCheckArray[z][j].ordersToFault;
			        if (timeCheckNumber === "") {
			            return false;
			        }
			        if (orderFaultNumber === "") {
			            return false;
			        }
			        if ( isNaN(Number(timeCheckNumber))) {
			            return false;
			        }
		            if ( isNaN(Number(orderFaultNumber))) {
			            return false;
			        }
			    }
			}
			return true;
		} else {
			return false 
		}
	},
	/*
	@function
	@name isMultiDomain
	@description Checks the configuration to see if it specifies multiple domains
	@returns {boolean}
	*/
	isMultiDomain: function() {
		var parsed = JSON.parse(this.baseData);
		if ( parsed["brandedDomain"] == "true" ) {
			return true;
		} else {
			return false;
		}
	},
	/*
	@function
	@name getDomains
	@description returns the domains that are stored in the ConfigurationHelper object
	@returns {Array}
	*/
	getDomains: function() {
		obj = JSON.parse(this.baseData);
			var keysToCheck = [];
			for (var key in obj) {
			    if (obj.hasOwnProperty(key)) {
			        if (key != "brandedDomain" && key != "splitByProcessor") {
			          keysToCheck.push(key);
			        }
			    }
			}
		return keysToCheck;
	},
	/*
	@function
	@name isByProcessor
	@description Checks the ConfigurationHelper object to see if multiple processors are enabled.
	@returns {boolean}
	*/
	isByProcessor: function() {
		var parsed = JSON.parse(this.baseData);
		if ( parsed["splitByProcessor"] === "true" ) {
			return true;
		} else {
			return false;
		}
	},
	/*
	@function
	@name getProcessors
	@description returns the processors that are stored in the ConfigurationHelper object
	@returns {Array}
	*/ 
	getProcessors: function(){
		var obj = JSON.parse(this.baseData);
		if (this.isByProcessor() === false) {
			return null;
		}
		var domains = this.getDomains(),
		secondLevel,
		processors = [],
		arrayLength = domains.length,
		uniqueProcessors;
		
		for (var i = 0; i < arrayLength; i++) {
			secondLevel = obj[domains[i]];
			for (var key in secondLevel) {
				if (secondLevel.hasOwnProperty(key)) {
					processors.push(key);
				}
			}
		}
		uniqueProcessors = processors.filter(function(item, i, ar){ return ar.indexOf(item) === i; });
		return uniqueProcessors;
	},
	/*
	@function
	@name getMinOrders
	@description return the orders needed at the current time for the supplied domain and processor
	@params {string} domain Prefix of the domain being checked
	@params {string} processor ID of the processor being checked.
	@returns {number}
	*/
	getMinOrders: function(domain, processor) {
		var cal = System.calendar,
		todaysDate = new Date(StringUtils.formatCalendar(cal)),
		currentTime = todaysDate.getHours(),
		parsed = JSON.parse(this.baseData);
		return parsed[domain][processor][currentTime]["ordersToFault"];
	},
	/*
	@function
	@name getTimeFrame
	@description return how far back in minutes to check at the current time for the supplied domain and processor.
	@params {string} domain Prefix of the domain being checked
	@params {string} processor ID of the processor being checked.
	@returns {number}
	*/
	getTimeFrame: function(domain, processor) {
		var cal = System.calendar,
		todaysDate = new Date(StringUtils.formatCalendar(cal)),
		currentTime = todaysDate.getHours(),
		parsed = JSON.parse(this.baseData);
		return parsed[domain][processor][currentTime].timeToCheck;
	}
	
};
module.exports = WatcherPreferences;