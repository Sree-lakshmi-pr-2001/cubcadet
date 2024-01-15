var OrderQueryHelper = require('int_ordervelocityengine/cartridge/scripts/order_query/OrderQueryHelper.js');
var ConfigurationHelper = require('int_ordervelocityengine/cartridge/scripts/ConfigurationHelper.js');
var SendEmailHelper = require('int_ordervelocityengine/cartridge/scripts/send_email/SendEmailHelper.js')
var Site = require( 'dw/system/Site' );
var System = require('dw/system/System')
var Calendar = require('dw/util/Calendar')
var StringUtils = require('dw/util/StringUtils')

function orderVelocityEngine() {
	var cal = System.calendar;
	var timeNow = new Date(StringUtils.formatCalendar(cal, "MM/dd/yyyy h:mm a"));
	var localTimeZone = cal.timeZone.split('/')[1];
	// set the config data using the step params and the configuration helper
	var customConfigPreferences = Site.getCurrent().getCustomPreferenceValue("OrderVelocityEngineJSON");
	ConfigurationHelper.setBaseData(customConfigPreferences);
	// set up variables to hold various preferences
	
	// check to see if site is multi-domain
	var isMulti = ConfigurationHelper.isMultiDomain();
	// check to see if site is by processor
	var byProc = ConfigurationHelper.isByProcessor();
	// if multi is true check all domains, else just check
	if (isMulti === true) {
		var domains = ConfigurationHelper.getDomains();
		var domains;
		var domainLength = Object.keys(domains).length;
		if (byProc === true) {
			var processors = ConfigurationHelper.getProcessors();
			var processorLength = Object.keys(processors).length;
			//loop through the domains
			for (var i = 0; i < domainLength; i++) {
				// loop through each processor for each domain
				for (var k = 0; k < processorLength; k++) {
					var timeToCheck = ConfigurationHelper.getTimeFrame(domains[i], processors[k]);
					var orderList = OrderQueryHelper.getOrders(timeToCheck);
					var successfulOrders = OrderQueryHelper.numberOfSuccessfulOrdersByProcessorAndDomain(orderList, processors[k], domains[i]);
					var minOrders = ConfigurationHelper.getMinOrders(domains[i], processors[k]);
					if (minOrders > successfulOrders) {
						var failedOrders = OrderQueryHelper.numberOfFailedOrdersByDomain(orderList, domains[i]);
						var startTime = new Date(timeNow.getTime() - (timeToCheck * 60 * 1000));
						var templateParameters = {
							"startTime": startTime.toLocaleString().split('GMT')[0] + " " + localTimeZone,
							"endTime": timeNow.toLocaleString().split('GMT')[0] + " " + localTimeZone,
							"numberOfOrdersByDomain": successfulOrders,
							"domainName": domains[i],
							"minNumberOfOrders": minOrders,
							"processorName": processors[k],
							"numberOfFailedOrders": failedOrders,
							"siteID": Site.getCurrent().getID()
						}
						SendEmailHelper.sendEmail(templateParameters, '/order_watcher_email/email.isml', Site.getCurrent().getCustomPreferenceValue("OrderVelocityEngineEmail"), Site.getCurrent().getCustomPreferenceValue("OrderVelocityEngineSendingEmail"), 'Order Velocity Engine Warning');
					}
				}
			}
		} else {
			for (var i = 0; i < domainLength; i++) {
				var timeToCheck = ConfigurationHelper.getTimeFrame(domains[i], "default");
				var orderList = OrderQueryHelper.getOrders(timeToCheck);
				var minOrders = ConfigurationHelper.getMinOrders(domains[i], "default");
				var successfulOrders = OrderQueryHelper.numberOfSuccessfulOrdersByProcessorAndDomain(orderList, "default", domains[i]);
				var z;
				if ( minOrders > successfulOrders ) {
					var failedOrders = OrderQueryHelper.numberOfFailedOrdersByDomain(orderList, domains[i]);
					var startTime = new Date(timeNow.getTime() - (timeToCheck * 60 * 1000));
					var offset = startTime.getTimezoneOffset
					var templateParameters = {
						"startTime": startTime.toLocaleString().split('GMT')[0] + " " + localTimeZone,
						"endTime": timeNow.toLocaleString().split('GMT')[0] + " " + localTimeZone,
						"numberOfOrdersByDomain": successfulOrders,
						"domainName": domains[i],
						"minNumberOfOrders": minOrders,
						"processorName": "default processor",
						"numberOfFailedOrders": failedOrders,
						"siteID": Site.getCurrent().getID()
					}
					SendEmailHelper.sendEmail(templateParameters, '/order_watcher_email/email.isml', Site.getCurrent().getCustomPreferenceValue("OrderVelocityEngineEmail"), Site.getCurrent().getCustomPreferenceValue("OrderVelocityEngineSendingEmail"), 'Order Velocity Engine Warning');
				}
			}
		}
	} else {
		if(byProc === true) {
			var processors = ConfigurationHelper.getProcessors();
			var processorLength = Object.keys(processors).length;
			for (var k = 0; k < processorLength; k++) {
				var baseDataParsed = JSON.parse(ConfigurationHelper.baseData);
				var processorCheck = baseDataParsed["default"];
				if (processorCheck.hasOwnProperty(processors[k])) {
					var timeToCheck = ConfigurationHelper.getTimeFrame('default', processors[k]);
					var orderList = OrderQueryHelper.getOrders(timeToCheck);
					var successfulOrders = OrderQueryHelper.numberOfSuccessfulOrdersByProcessorAndDomain(orderList, processors[k], 'default');
					var minOrders = ConfigurationHelper.getMinOrders('default', processors[k]);
					if (minOrders > successfulOrders) {
						var failedOrders = OrderQueryHelper.numberOfFailedOrdersByDomain(orderList, 'default');
						var startTime = new Date(timeNow.getTime() - (timeToCheck * 60 * 1000));
						var templateParameters = {
							"startTime": startTime.toLocaleString().split('GMT')[0] + " " + localTimeZone,
							"endTime": timeNow.toLocaleString().split('GMT')[0] + " " + localTimeZone,
							"numberOfOrdersByDomain": successfulOrders,
							"domainName": "default domain",
							"minNumberOfOrders": minOrders,
							"processorName": processors[k],
							"numberOfFailedOrders": failedOrders,
							"siteID": Site.getCurrent().getID()
						}
						SendEmailHelper.sendEmail(templateParameters, '/order_watcher_email/email.isml', Site.getCurrent().getCustomPreferenceValue("OrderVelocityEngineEmail"), Site.getCurrent().getCustomPreferenceValue("OrderVelocityEngineSendingEmail"), 'Order Velocity Engine Warning');
					}
				}
			}
		} else {
			var timeToCheck = ConfigurationHelper.getTimeFrame('default', 'default');
			var orderList = OrderQueryHelper.getOrders(timeToCheck);
			var successfulOrders = OrderQueryHelper.numberOfSuccessfulOrdersByProcessorAndDomain(orderList, 'default', 'default');
			var minOrders = ConfigurationHelper.getMinOrders('default', 'default');
			if (minOrders > successfulOrders) {
				var failedOrders = OrderQueryHelper.numberOfFailedOrdersByDomain(orderList, 'default');
				var startTime = new Date(timeNow.getTime() - (timeToCheck * 60 * 1000));

				var templateParameters = {
					"startTime": startTime.toLocaleString().split('GMT')[0] + " " + localTimeZone,
					"endTime": timeNow.toLocaleString().split('GMT')[0] + " " + localTimeZone,
					"numberOfOrdersByDomain": successfulOrders,
					"domainName": 'default',
					"minNumberOfOrders": minOrders,
					"processorName": 'default',
					"numberOfFailedOrders": failedOrders,
					"siteID": Site.getCurrent().getID()
				}
				SendEmailHelper.sendEmail(templateParameters, '/order_watcher_email/email.isml', Site.getCurrent().getCustomPreferenceValue("OrderVelocityEngineEmail"), Site.getCurrent().getCustomPreferenceValue("OrderVelocityEngineSendingEmail"), 'Order Velocity Engine Warning');
			}
		}
	}
}

exports.execute = orderVelocityEngine;