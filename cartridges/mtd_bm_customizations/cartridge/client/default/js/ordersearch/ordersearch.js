/* eslint-disable block-scoped-var */
'use strict';

// eslint-disable-next-line require-jsdoc
function getReasonCodeText(code) {
    if (code === '12') return code + ' - Customer Service';
    if (code === '13') return code + ' - Sales';
    if (code === '14') return code + ' - Quality / Recalls';
    if (code === '15') return code + ' - Product Development';
    if (code === '42') return code + ' - Consumer Direct';
    if (code === '60') return code + ' - Warranty';
    if (code === '61') return code + ' - Missing Part / Component';
    if (code === '91') return code + ' - Good Will / Charitable Donations';
    return '';
}

// eslint-disable-next-line require-jsdoc
function financial(x) {
    if (x == null) {
        return '-';
    }
    return '$' + Number.parseFloat(x).toFixed(2);
}

// eslint-disable-next-line require-jsdoc
function convertDate(date) {
    var newDate = new Date(date);
    var convertedDate = newDate.toLocaleDateString();
    return convertedDate;
}

// eslint-disable-next-line require-jsdoc
function clearSearchFields() {
    console.log('clearing search fields');
    document.getElementById('customerName').value = '';
    document.getElementById('customerZip').value = '';
    document.getElementById('phoneNumber').value = '';
    document.getElementById('orderNumber').value = '';
    document.getElementById('emailAddress').value = '';
    document.getElementById('orders').innerHTML = '';
    document.getElementById('selectedOrder').innerHTML = '';
    document.getElementById('trackingInformation').innerHTML = '';
    document.getElementById('paymentInformation').innerHTML = '';
    var chaseIdExists = document.getElementById('chaseAuthId');
    if (chaseIdExists) {
        chaseIdExists.value = '';
    }
}

// eslint-disable-next-line require-jsdoc
function searchForOrder(data) {
    document.getElementById('selectedOrder').innerHTML = '';
    document.getElementById('orders').innerHTML = 'Retrieving orders...';

    jQuery.ajax({
        type: 'POST',
        url: '/on/demandware.store/Sites-Site/default/EpcotOrderInquiry-AJAXOrderSearch',
        data: data,
        success: function (searchJSON) {
            document.getElementById('orders').innerHTML = '';
            if (searchJSON.orders && searchJSON.orders.length > 0) {
                var orderTemplate = document.getElementById('order-template');
                var orders = document.getElementById('orders');
                var ordersInstance = document.importNode(orderTemplate.content, true);
                ordersInstance.querySelector('.hits').textContent = 'hits : ' + searchJSON.orders.length;

                searchJSON.orders.forEach(function (order) {
                    var ordersResultsTemplate = document.getElementById('order-results-template');
                    var ordersResultsInstance = document.importNode(ordersResultsTemplate.content, true);
                    var headers = ordersInstance.querySelector('.ordersHeader');
                    ordersResultsInstance.querySelector('.selectButton').id = order.header.salesOrderId;
                    ordersResultsInstance.querySelector('.epcotOrderNumber').textContent = order.header.epcotOrderNumber;
                    ordersResultsInstance.querySelector('.orderNumber').textContent = order.header.orderNumber;
                    ordersResultsInstance.querySelector('.orderTotal').textContent = '$' + order.totals.grandTotal.toFixed(2);
                    ordersResultsInstance.querySelector('.billingName').textContent = order.address.billing.name;
                    ordersResultsInstance.querySelector('.orderDate').textContent = convertDate(order.header.orderDate);
                    ordersResultsInstance.querySelector('.orderStatus').textContent = order.header.orderStatusDescription;
                    // force phonenumber to XXX-XXX-XXXX format
                    var phoneNumber = order.address.billing.phone;
                    phoneNumber = phoneNumber.replace(/\D/g, '');
                    phoneNumber = phoneNumber.slice(0, 3) + '-' + phoneNumber.slice(3, 6) + '-' + phoneNumber.slice(6, 15);
                    ordersResultsInstance.querySelector('.phoneNumber').textContent = phoneNumber;
                    ordersResultsInstance.querySelector('.cityState').textContent = order.address.billing.city + ', ' + order.address.billing.state;
                    headers.append(ordersResultsInstance);
                });
                orders.appendChild(ordersInstance);
                $('.orderSearchResults').dataTable({ paging: true });
            } else {
                console.log('No orders found');
                var html = 'No orders found';
                document.getElementById('orders').innerHTML = html;
            }
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        }
    });
}


// eslint-disable-next-line require-jsdoc
function determineSearchType() {
    var orderNumber = document.getElementById('orderNumber').value;
    var customerName = document.getElementById('customerName').value;
    var customerZip = document.getElementById('customerZip').value;
    var phoneNumber = document.getElementById('phoneNumber').value;
    var emailAddress = document.getElementById('emailAddress').value;

    document.getElementById('trackingInformation').innerHTML = '';
    document.getElementById('paymentInformation').innerHTML = '';
    document.getElementById('selectedOrder').innerHTML = '';
    if ($('#chaseAuthId').length > 0) {
        var chaseAuthId = document.getElementById('chaseAuthId').value;
    }

    var data = null;
    if (orderNumber) {
        data = { orderNumber: orderNumber, searchType: 'byOrderNumber' };
        return (data);
    } else if (phoneNumber) {
        phoneNumber = encodeURI(phoneNumber);
        data = { phoneNumber: phoneNumber, searchType: 'byPhoneNumber' };
        return (data);
    } else if (emailAddress) {
        data = { emailAddress: emailAddress, searchType: 'byEmailAddress' };
        return (data);
    } else if (customerName && customerZip) {
        var adjustedName = encodeURIComponent(customerName.trim());
        var adjustedZip = encodeURIComponent(customerZip);
        console.log(adjustedName);
        console.log(adjustedZip);
        data = { customerName: adjustedName, customerZip: adjustedZip, searchType: 'byNameAndZip' };
        return (data);
    } else if (chaseAuthId) {
        data = { chaseAuthId: chaseAuthId, searchType: 'byChaseAuthId' };
        return (data);
    }
    console.log('Error with search fields');
    let currentSite = document.getElementById('hiddenSite').value;
    alert('You must specify one of the following search fields before performing a search: \n\n-EPCOT / Online / COM Order Number \n-Customer Name & Postal Code \n-Email Address \n-Phone Number' + (currentSite === 'epcotus' ? '\n-Chase Auth Id' : ''));
    return null;
}

// eslint-disable-next-line require-jsdoc
function showSelectedOrder(salesOrderId) {
    var loadingHtml = 'Retrieving order details...';
    document.getElementById('selectedOrder').innerHTML = loadingHtml;
    document.getElementById('trackingInformation').innerHTML = '';
    document.getElementById('paymentInformation').innerHTML = '';

    var data = { salesOrderId: salesOrderId };
    jQuery.ajax({
        type: 'POST',
        url: '/on/demandware.store/Sites-Site/default/EpcotOrderInquiry-AJAXGetSelectedOrder',
        data: data,
        success: function (orderResult) {
            // selected order table
            document.getElementById('selectedOrder').innerHTML = '';
            var orderTemplate = document.getElementById('order-details-template');
            var order = document.getElementById('selectedOrder');
            var orderInstance = document.importNode(orderTemplate.content, true);

            var orderHeader = orderResult.header;
            console.log(orderHeader);

            orderInstance.querySelector('.orderNumber').textContent = orderHeader.orderNumber;

            orderInstance.querySelector('.createdDate').textContent = convertDate(orderHeader.createdDate);
            orderInstance.querySelector('.modifiedDate').textContent = convertDate(orderHeader.modifiedDate);
            orderInstance.querySelector('.submittedDate').textContent = convertDate(orderHeader.submittedDate);

            orderInstance.querySelector('.submitUsername').textContent = orderHeader.submitUsername;
            orderInstance.querySelector('.modifiedUsername').textContent = orderHeader.modifiedUsername;
            orderInstance.querySelector('.createdUsername').textContent = orderHeader.createdUsername;

            orderInstance.querySelector('.comOrderNumber').textContent = orderHeader.comOrderNumber;
            orderInstance.querySelector('.shippingMethodDescription').textContent = orderHeader.shippingMethodDescription;
            orderInstance.querySelector('.paymentDescription').textContent = orderHeader.paymentDescription;

            orderInstance.querySelector('.customerPONumber').textContent = orderHeader.customerPONumber;
            orderInstance.querySelector('.customerPONote1').textContent = orderHeader.customerPONote1;
            orderInstance.querySelector('.customerPONote2').textContent = orderHeader.customerPONote2;

            if (orderResult.details.length > 0) {
                orderInstance.querySelector('.noChargeReason').textContent = getReasonCodeText(orderResult.details[0].noChargeReason);
                orderInstance.querySelector('.noChargeModelNumber').textContent = orderResult.details[0].noChargeModelNumber;
                orderInstance.querySelector('.noChargeSerialNumber').textContent = orderResult.details[0].noChargeSerialNumber;
            }

            // eslint-disable-next-line no-unused-vars
            var billTo = orderHeader.billTo.name + ', ' + orderHeader.billTo.address;
            if (orderHeader.billTo.specialAddress) {
                billTo += ' ' + orderHeader.billTo.specialAddress;
            }
            billTo += ', ' + orderHeader.billTo.city + ', ' + orderHeader.billTo.state + ' ' + orderHeader.billTo.zipCode + ', ' + orderHeader.billTo.countryCode;

            // eslint-disable-next-line no-unused-vars
            var shipTo = orderHeader.shipTo.name + ', ' + orderHeader.shipTo.address;
            if (orderHeader.shipTo.specialAddress) {
                shipTo += ' ' + orderHeader.shipTo.specialAddress;
            }
            shipTo += ', ' + orderHeader.shipTo.city + ', ' + orderHeader.shipTo.state + ' ' + orderHeader.shipTo.zipCode + ', ' + orderHeader.shipTo.countryCode;

            orderInstance.querySelector('.billTo').textContent = billTo;
            orderInstance.querySelector('.shipTo').textContent = shipTo;
            orderInstance.querySelector('.authId').textContent = orderHeader.originalAuthId;

            order.appendChild(orderInstance);

            // add additional auths
            if (orderResult.header.authIds.length > 0) {
                var authTemplate = document.getElementById('auth-header-template');
                var authHeader = document.getElementById('additionalAuthIds');
                var authHeaderInstance = document.importNode(authTemplate.content, true);
                orderResult.header.authIds.forEach(function (individualAuth) {
                    var authDetailsTemplate = document.getElementById('auth-details-template');
                    var authDetailsInstance = document.importNode(authDetailsTemplate.content, true);
                    var headers = authHeaderInstance.querySelector('.authHeader');
                    authDetailsInstance.querySelector('.paymentStatus').textContent = individualAuth.paymentStatus;
                    authDetailsInstance.querySelector('.active').textContent = individualAuth.active;
                    authDetailsInstance.querySelector('.authOrderId').textContent = individualAuth.authOrderId;
                    authDetailsInstance.querySelector('.merchantId').textContent = individualAuth.merchantId;
                    authDetailsInstance.querySelector('.dateAuthorizationExpires').textContent = convertDate(individualAuth.dateAuthorizationExpires);
                    authDetailsInstance.querySelector('.dateAuthorized').textContent = convertDate(individualAuth.dateAuthorized);
                    console.log(individualAuth.authOrderId);
                    headers.append(authDetailsInstance);
                });
                authHeader.appendChild(authHeaderInstance);
            }

            // tracking number table
            var trackingHeaderTemplate = document.getElementById('tracking-header-template');
            var trackingHeader = document.getElementById('trackingInformation');
            var trackingHeaderInstance = document.importNode(trackingHeaderTemplate.content, true);

            orderResult.details.forEach(function (lineItem) {
                console.log(lineItem);
                var trackingDetailsTemplate = document.getElementById('tracking-details-template');
                var trackingDetailsInstance = document.importNode(trackingDetailsTemplate.content, true);
                var headers = trackingHeaderInstance.querySelector('.trackingHeader');
                var trackingDiv = document.createElement('div');
                lineItem.trackingDetails.forEach(function (trackingInfo) {
                    var trackingLink = document.createElement('a');
                    trackingLink.textContent = trackingInfo.trackingNumber;
                    trackingLink.target = '_blank';
                    trackingLink.className = 'trackingNumberUrl';
                    if (trackingInfo.appendTrackingURL === 'Y') {
                        trackingLink.href = trackingInfo.trackingURL + trackingInfo.trackingNumber;
                    }
                    trackingDiv.appendChild(trackingLink);
                    trackingDiv.appendChild(document.createElement('br'));
                });
                trackingDetailsInstance.querySelector('.trackingNumber').innerHTML = trackingDiv.innerHTML;
                trackingDetailsInstance.querySelector('.carrier').textContent = lineItem.carrier;
                trackingDetailsInstance.querySelector('.itemNumber').textContent = lineItem.itemNumber;
                trackingDetailsInstance.querySelector('.description').textContent = lineItem.description;
                trackingDetailsInstance.querySelector('.quantityShipped').textContent = lineItem.quantityOrdered + ' (' + lineItem.quantityShipped + ')';
                trackingDetailsInstance.querySelector('.dateShipped').textContent = lineItem.dateShipped;
                trackingDetailsInstance.querySelector('.unit').textContent = financial(lineItem.unit);
                trackingDetailsInstance.querySelector('.extended').textContent = financial(lineItem.extended);
                trackingDetailsInstance.querySelector('.discount').textContent = financial(lineItem.discount);
                trackingDetailsInstance.querySelector('.noCharge').textContent = lineItem.noCharge;
                trackingDetailsInstance.querySelector('.ltlFlag').textContent = lineItem.ltlFlag;
                headers.parentNode.append(trackingDetailsInstance);
            });
            trackingHeader.appendChild(trackingHeaderInstance);

            // pricing table
            var paymentTemplate = document.getElementById('payment-template');
            var paymentInformation = document.getElementById('paymentInformation');
            var paymentInstance = document.importNode(paymentTemplate.content, true);

            paymentInstance.querySelector('.orderPromo').textContent = orderResult.header.billingDetails.orderPromo;
            paymentInstance.querySelector('.shippingPromo').textContent = orderResult.header.billingDetails.shippingPromo;

            paymentInstance.querySelector('.dealerFulfillmentCheckbox').textContent = 'NO';
            paymentInstance.querySelector('.waiveHandlingCheckbox').textContent = 'NO';
            paymentInstance.querySelector('.waiveFreightCheckbox').textContent = 'NO';
            if (orderResult.header.billingDetails.dealerFulfillment === 'Y') {
                paymentInstance.querySelector('.dealerFulfillmentCheckbox').textContent = 'YES';
            }
            if (orderResult.header.billingDetails.waiveHandling === 'Y') {
                paymentInstance.querySelector('.waiveHandlingCheckbox').textContent = 'YES';
            }
            if (orderResult.header.billingDetails.waiveFreight === 'Y') {
                paymentInstance.querySelector('.waiveFreightCheckbox').textContent = 'YES';
            }
            paymentInstance.querySelector('.subTotal').textContent = financial(orderResult.header.billingDetails.subTotal);
            paymentInstance.querySelector('.tax').textContent = financial(orderResult.header.billingDetails.tax);
            paymentInstance.querySelector('.handling').textContent = financial(orderResult.header.billingDetails.handling);
            paymentInstance.querySelector('.freight').textContent = financial(orderResult.header.billingDetails.freight);
            paymentInstance.querySelector('.discount').textContent = financial(orderResult.header.billingDetails.discount);
            paymentInstance.querySelector('.total').textContent = financial(orderResult.header.billingDetails.total);
            // at end
            paymentInformation.appendChild(paymentInstance);
            window.location.href = '#selectedOrder';
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        }
    });
}

$(function () {
    console.log('window -> on load');
    // idleTimeout.startTimer();
    $('#breadCrumbList').append('<li class="breadcrumb-item active" aria-current="page">Order Inquiry</li>');
});

// eslint-disable-next-line require-jsdoc
function handleEnterKeyInput() {
    var data = determineSearchType();
    if (data) {
        searchForOrder(data);
    }
}

module.exports = {
    methods: {
        determineSearchType: determineSearchType,
        searchForOrder: searchForOrder,
        convertDate: convertDate,
        clearSearchFields: clearSearchFields,
        financial: financial,
        getReasonCodeText: getReasonCodeText,
        showSelectedOrder: showSelectedOrder
    },


    formValidate: function () {
        $('#orderSearch').on('click', function (e) {
            e.preventDefault();
            var data = determineSearchType();
            if (data) {
                searchForOrder(data);
            }
        });
    },

    clearAllSearchFields: function () {
        $('#clearSearch').on('click', function (e) {
            e.preventDefault();
            clearSearchFields();
        });
    },

    showOrderDetails: function () {
        $('#orders').on('click', 'button', function (e) {
            e.preventDefault();
            console.log('Order selected : ' + this.id);
            showSelectedOrder(this.id);
        });
    },

    handleInput: function () {
        $('#orderNumber').on('keyup', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                handleEnterKeyInput();
            }
        });
        $('#customerName').on('keyup', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                handleEnterKeyInput();
            }
        });
        $('#customerZip').on('keyup', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                handleEnterKeyInput();
            }
        });
        $('#phoneNumber').on('keyup', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                handleEnterKeyInput();
            }
        });
        $('#emailAddress').on('keyup', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                handleEnterKeyInput();
            }
        });
    },

    testFunction: function () {
        var customerNameInputField = $('#customerName');
        var customerZipInputField = $('#customerZip');
        var phoneNumberInputField = $('#phoneNumber');
        var orderNumberInputField = $('#orderNumber');
        var emailAddressInputField = $('#emailAddress');

        $('#customerName').on('mouseover', function (e) {
            e.preventDefault();
            phoneNumberInputField.attr('disabled', true);
            orderNumberInputField.attr('disabled', true);
            emailAddressInputField.attr('disabled', true);
        });
        $('#customerName').on('mouseleave', function (e) {
            e.preventDefault();
            phoneNumberInputField.attr('disabled', false);
            orderNumberInputField.attr('disabled', false);
            emailAddressInputField.attr('disabled', false);
        });
        $('#customerZip').on('mouseover', function (e) {
            e.preventDefault();
            phoneNumberInputField.attr('disabled', true);
            orderNumberInputField.attr('disabled', true);
            emailAddressInputField.attr('disabled', true);
        });
        $('#customerZip').on('mouseleave', function (e) {
            e.preventDefault();
            phoneNumberInputField.attr('disabled', false);
            orderNumberInputField.attr('disabled', false);
            emailAddressInputField.attr('disabled', false);
        });

        $('#phoneNumber').on('mouseover', function (e) {
            e.preventDefault();
            customerNameInputField.attr('disabled', true);
            customerZipInputField.attr('disabled', true);
            orderNumberInputField.attr('disabled', true);
            emailAddressInputField.attr('disabled', true);
        });
        $('#phoneNumber').on('mouseleave', function (e) {
            e.preventDefault();
            customerNameInputField.attr('disabled', false);
            customerZipInputField.attr('disabled', false);
            orderNumberInputField.attr('disabled', false);
            emailAddressInputField.attr('disabled', false);
        });

        $('#emailAddress').on('mouseover', function (e) {
            e.preventDefault();
            customerNameInputField.attr('disabled', true);
            customerZipInputField.attr('disabled', true);
            orderNumberInputField.attr('disabled', true);
            phoneNumberInputField.attr('disabled', true);
        });
        $('#emailAddress').on('mouseleave', function (e) {
            e.preventDefault();
            customerNameInputField.attr('disabled', false);
            customerZipInputField.attr('disabled', false);
            orderNumberInputField.attr('disabled', false);
            phoneNumberInputField.attr('disabled', false);
        });

        $('#orderNumber').on('mouseover', function (e) {
            e.preventDefault();
            customerNameInputField.attr('disabled', true);
            customerZipInputField.attr('disabled', true);
            emailAddressInputField.attr('disabled', true);
            phoneNumberInputField.attr('disabled', true);
        });
        $('#orderNumber').on('mouseleave', function (e) {
            e.preventDefault();
            customerNameInputField.attr('disabled', false);
            customerZipInputField.attr('disabled', false);
            emailAddressInputField.attr('disabled', false);
            phoneNumberInputField.attr('disabled', false);
        });
    }
};
