var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var PaymentMgr = require('dw/order/PaymentMgr');

var OrderQueryHelper = {
    // @function
    // @name dateXMinutesAgo
    // @description Takes in minutes and returns the Date [x] number of minutes ago.
    // @params {integer} minutes The number of minutes to go back.
    dateXMinutesAgo: function(minutes : Number) {
        var currentDate = new Date(),
            offset = minutes * 60 * 1000;

        return new Date(currentDate.getTime() - offset);
    },
    // @function
    // @name getOrderProcessors
    // @description Takes an order and returns the processors associated with it.
    // @params {Object} order Order object
    getOrderProcessors: function(order : dw.order.Order) {
        var processors = [];

        if (!empty(order) && !order.getPaymentInstruments().isEmpty()) {
            var paymentInstruments = order.getPaymentInstruments().toArray();

            for(var paymentInstrumentIndex in paymentInstruments) {
                var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstruments[paymentInstrumentIndex].getPaymentMethod());
                if (!empty(paymentMethod) &&
                    !empty(paymentMethod.getPaymentProcessor()) &&
                    !empty(paymentMethod.getPaymentProcessor().getID())) {
                    
                    processors.push(paymentMethod.getPaymentProcessor().getID());
                }
            }

        }

        return processors;
    },
    // @function
    // @name getOrders
    // @description Returns the orders from [x] minutes ago
    // @params {integer} minutes The number of minutes to go back.
    getOrders: function(minutes : Number) {
        if (!empty(minutes)) {
            var query = "creationDate > {0}",
                queryDate = this.dateXMinutesAgo(minutes),
                orderQuery = OrderMgr.queryOrders(query, "creationDate asc" , queryDate),
                orders = orderQuery.asList();

            return orders;
        } else {
            return [];
        }
    },
    // @function
    // @name numberOfFailedOrdersByProcessorAndDomain
    // @description Returns the number of failed orders by processor and domain name (orderPrefix)
    // @params {Object[]} orders Array of orders
    // @params {string} processorName Name of the processor you are using
    // @params {string} domainName Name of the orderPrefix you are looking for
    numberOfFailedOrdersByProcessorAndDomain: function(orders : dw.util.List, processorName : String, domainName : String) {
        if (!orders.isEmpty() && !empty(processorName) && !empty(domainName)) {
            var numberOfFailedOrdersByProcessor = 0;

            for (var i = 0, ordersLength = orders.size(); i < ordersLength; i++) {
                var includesProcessor = this.getOrderProcessors(orders.get(i)).indexOf(processorName),
                    orderStatus = orders.get(i).status.value;

                if (processorName === 'default' && domainName === 'default') {

                    if (orderStatus === Order.ORDER_STATUS_FAILED) {

                        numberOfFailedOrdersByProcessor++;

                    }

                } else if (processorName === 'default') {

                    if (orderStatus === Order.ORDER_STATUS_FAILED && 
                        orders.get(i).orderNo.includes(domainName)) {

                        numberOfFailedOrdersByProcessor++;
                    }

                } else if (domainName === 'default') {

                    if (orderStatus === Order.ORDER_STATUS_FAILED && 
                        includesProcessor != -1) {

                        numberOfFailedOrdersByProcessor++;
                    }

                } else {

                    if (orderStatus === Order.ORDER_STATUS_FAILED && 
                        includesProcessor != -1 &&
                        orders.get(i).orderNo.includes(domainName)) {

                        numberOfFailedOrdersByProcessor++;
                    }

                }
            }

            return numberOfFailedOrdersByProcessor;
        } else {
            return 0;
        }
    },
    // @function
    // @name numberOfFailedOrdersByDomain
    // @description Returns the number of failed orders by domain name (orderPrefix)
    // @params {Object[]} orders Array of orders
    // @params {string} domainName Name of the orderPrefix you are looking for
    numberOfFailedOrdersByDomain: function(orders : dw.util.List, domainName : String) {
        if (!orders.isEmpty() && !empty(domainName)) {
            var numberOfFailedOrdersByDomain = 0;

            for (var i = 0, ordersLength = orders.size(); i < ordersLength; i++) {
                var orderStatus = orders.get(i).status.value;

                if (domainName === 'default') {

                    if (orderStatus === Order.ORDER_STATUS_FAILED) {

                        numberOfFailedOrdersByDomain++;
                    }

                } else {

                    if (orderStatus === Order.ORDER_STATUS_FAILED && 
                        orders.get(i).orderNo.includes(domainName)) {

                        numberOfFailedOrdersByDomain++;
                    }

                }
            }

            return numberOfFailedOrdersByDomain;
        } else {
            return 0;
        }
    },
    // @function
    // @name numberOfSuccessfulOrdersByProcessorAndDomain
    // @description Returns the number of successful orders by processor and domain name (orderPrefix)
    // @params {Object[]} orders Array of orders
    // @params {string} processorName Name of the processor you are using
    // @params {string} domainName Name of the orderPrefix you are looking for
    numberOfSuccessfulOrdersByProcessorAndDomain: function(orders : dw.util.List, processorName : String, domainName : String) {
        if (!orders.isEmpty() && !empty(processorName) && !empty(domainName)) {
            var numberOfSuccessfulOrdersByProcessor = 0;

            for (var i = 0, ordersLength = orders.size(); i < ordersLength; i++) {
                var includesProcessor = this.getOrderProcessors(orders.get(i)).indexOf(processorName),
                    orderStatus = orders.get(i).status.value;

                if (processorName === 'default' && domainName === 'default') {

                    if (orderStatus === Order.ORDER_STATUS_CREATED || orderStatus === Order.ORDER_STATUS_NEW) {

                        numberOfSuccessfulOrdersByProcessor++;

                    }

                } else if (processorName === 'default') {

                    if ((orderStatus === Order.ORDER_STATUS_CREATED || orderStatus === Order.ORDER_STATUS_NEW) && 
                        orders.get(i).orderNo.includes(domainName)) {

                        numberOfSuccessfulOrdersByProcessor++;
                    }

                } else if (domainName === 'default') {

                    if ((orderStatus === Order.ORDER_STATUS_CREATED || orderStatus === Order.ORDER_STATUS_NEW) && 
                        includesProcessor != -1) {

                        numberOfSuccessfulOrdersByProcessor++;
                    }

                } else {

                    if ((orderStatus === Order.ORDER_STATUS_CREATED || orderStatus === Order.ORDER_STATUS_NEW) && 
                        includesProcessor != -1 &&
                        orders.get(i).orderNo.includes(domainName)) {

                        numberOfSuccessfulOrdersByProcessor++;
                    }

                }
            }

            return numberOfSuccessfulOrdersByProcessor;
        } else {
            return 0;
        }
    },
    // @function
    // @name numberOfSuccessfulOrdersByDomain
    // @description Returns the number if successful orders by domain name (orderPrefix)
    // @params {Object[]} orders Array of orders
    // @params {string} domainName Name of the orderPrefix you are looking for
    numberOfSuccessfulOrdersByDomain: function(orders : dw.util.List, domainName : String) {
        if (!orders.isEmpty() && !empty(domainName)) {        
            var numberOfSuccessfulOrdersByDomain = 0;

            for (var i = 0, ordersLength = orders.size(); i < ordersLength; i++) {
                var orderStatus = orders.get(i).status.value;

                if (domainName === 'default') {

                    if (orderStatus === Order.ORDER_STATUS_CREATED || orderStatus === Order.ORDER_STATUS_NEW) {

                        numberOfSuccessfulOrdersByDomain++;
                    }

                } else {

                    if ((orderStatus === Order.ORDER_STATUS_CREATED || orderStatus === Order.ORDER_STATUS_NEW) && 
                        orders.get(i).orderNo.includes(domainName)) {

                        numberOfSuccessfulOrdersByDomain++;
                    }

                }
            }

            return numberOfSuccessfulOrdersByDomain;
        } else {
            return 0;
        }
    },
    // @function
    // @name numberOfOrdersByDomain
    // @description Returns the number if successful orders by domain name (orderPrefix)
    // @params {Object[]} orders Array of orders
    // @params {string} domainName Name of the orderPrefix you are looking for
    numberOfOrdersByDomain: function(orders : dw.util.List, domainName : String) {
        if (!orders.isEmpty() && !empty(domainName)) {        
            var numberOfOrdersByDomain = 0;

            for (var i = 0, ordersLength = orders.size(); i < ordersLength; i++) {
                var orderStatus = orders.get(i).status.value;
                if (domainName === 'default') {

                    numberOfOrdersByDomain++;

                } else {

                    if (orders.get(i).orderNo.includes(domainName)) {

                        numberOfOrdersByDomain++;
                    }

                }
            }

            return numberOfOrdersByDomain;
        } else {
            return 0;
        }
    }
};

module.exports = OrderQueryHelper;