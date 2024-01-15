/* eslint-disable require-jsdoc */
'use strict';
var sessionStorage = window.sessionStorage;

function storeCrumbs(bread) {
    sessionStorage.setItem('bread', JSON.stringify(bread));
}

function readBreadCrumbs() {
    var bread = sessionStorage.getItem('bread');
    if (!bread) {
        bread = [];
        storeCrumbs(bread);
    } else {
        bread = JSON.parse(bread);
    }
    return bread;
}

function formatLinkFromCurrentPage(currentPage) {
    var listItem = '<li class="breadcrumb-item active" aria-current="page">URL NOT SETUP</li>';
    var basketId;
    if (currentPage === 'WelcomePage') {
        listItem = '<li class="breadcrumb-item" aria-current="page"><a href="Epcot-Welcome">Home</a></li>';
    }
    if (currentPage === 'OrderSearch') {
        listItem = '<li class="breadcrumb-item" aria-current="page"><a href="EpcotOrderInquiry-Home">Order Search</a></li>';
    }
    if (currentPage === 'ManageUsers') {
        listItem = '<li class="breadcrumb-item" aria-current="page"><a href="EpcotAdmin-ManageUsers">Manage Users</a></li>';
    }
    if (currentPage === 'ManageRoles') {
        listItem = '<li class="breadcrumb-item" aria-current="page"><a href="EpcotAdmin-ManageUsers">Manage Roles</a></li>';
    }
    if (currentPage === 'startBasket') {
        listItem = '<li class="breadcrumb-item" aria-current="page"><a id="chooseBrand" href="EpcotOrderConsumer-ChooseBrand">Choose Brand</a></li>';
    }
    if (currentPage === 'productSearch') {
        basketId = document.getElementById('globalBasketId').value;
        listItem = '<li class="breadcrumb-item" aria-current="page"></li><form name="submitProductSearchForm" method="POST" action="/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-ReturnToStartBasket"><input type="hidden" name="basketId" value="' + basketId + '"><a href="javascript:document.submitProductSearchForm.submit()">Product Search</a></form></li><li class="breadcrumb-item" aria-current="page"></li>';
    }
    if (currentPage === 'address') {
        basketId = document.getElementById('globalBasketId').value;
        listItem = '<li class="breadcrumb-item" aria-current="page"></li><form name="submitAddressLookup" method="POST" action="/on/demandware.store/Sites-Site/default/EpcotOrderConsumer-StartCheckout"><input type="hidden" name="basketId" value="' + basketId + '"><a href="javascript:document.submitAddressLookup.submit()">Address Lookup</a></form></li><li class="breadcrumb-item" aria-current="page"></li>';
    }
    if (currentPage === 'NoChargeAudit') {
        // listItem = '<li class="breadcrumb-item active" aria-current="page">No Charge Audit</li>';
        listItem = '<li class="breadcrumb-item" aria-current="page"><a href="EpcotAdmin-NoChargeAudit">No Charge Audit</a></li>';
    }

    return listItem;
}

function createActiveLink(currentPage) {
    var activeListItem = '<li class="breadcrumb-item active" aria-current="page">URL NOT SETUP</li>';
    if (currentPage === 'WelcomePage') {
        activeListItem = '<li class="breadcrumb-item active" aria-current="page">Home</li>';
    }
    if (currentPage === 'OrderSearch') {
        activeListItem = '<li class="breadcrumb-item active" aria-current="page">Order Search</li>';
    }
    if (currentPage === 'NoChargeAudit') {
        activeListItem = '<li class="breadcrumb-item active" aria-current="page">No Charge Audit</li>';
    }
    if (currentPage === 'ManageUsers') {
        activeListItem = '<li class="breadcrumb-item active" aria-current="page">Manage Users</li>';
    }
    if (currentPage === 'ManageRoles') {
        activeListItem = '<li class="breadcrumb-item active" aria-current="page">Manage Roles</li>';
    }
    if (currentPage === 'startBasket') {
        activeListItem = '<li class="breadcrumb-item active" aria-current="page">Choose Brand</li>';
    }
    if (currentPage === 'productSearch') {
        activeListItem = '<li class="breadcrumb-item active" aria-current="page">Product Search</li>';
    }
    if (currentPage === 'address') {
        activeListItem = '<li class="breadcrumb-item active" aria-current="page">Address Lookup</li>';
    }
    if (currentPage === 'discounts') {
        activeListItem = '<li class="breadcrumb-item active" aria-current="page">Shipping Method</li>';
    }
    if (currentPage === 'OrderView') {
        activeListItem = '<li class="breadcrumb-item active" aria-current="page">Confirmation</li>';
    }
    if (currentPage === 'AuditOrderPage') {
        activeListItem = '<li class="breadcrumb-item active" aria-current="page">Audit Order</li>';
    }

    return activeListItem;
}

function addCrumb(incomingListItem, incomingPage) {
    var bread = readBreadCrumbs();
    var newBread = [];
    var duplicateFound = false;
    while (!duplicateFound && bread.length > 0) {
        var currentBreadCrumb = bread.shift();
        var currentListItem = currentBreadCrumb.listItem;
        var currentPage = currentBreadCrumb.page;
        if (currentPage === incomingPage) {
            duplicateFound = true;
            newBread.push({
                listItem: incomingListItem,
                page: incomingPage
            });
            bread = newBread;
        } else {
            newBread.push({
                listItem: currentListItem,
                page: currentPage
            });
        }
    }
    bread = newBread;
    // no duplicates were found so do the normal flow
    if (!duplicateFound) {
        var topCrumb = bread.pop();
        if (topCrumb) {
            var topCrumbListItem = topCrumb.listItem;
            var topCrumbPage = topCrumb.page;
            if (topCrumbPage === incomingPage) {
                bread.push({
                    listItem: topCrumbListItem,
                    page: topCrumbPage
                });
            } else {
                bread.push({
                    listItem: topCrumbListItem,
                    page: topCrumbPage
                });
                bread.push({
                    listItem: incomingListItem,
                    page: incomingPage
                });
            }
        } else {
            bread.push({
                listItem: incomingListItem,
                page: incomingPage
            });
        }
    }

    // loop through all of bread crumbs, formatting it to be active
    var formattedBread = [];
    while (bread.length > 0) {
        var breadCrumbToFormat = bread.shift();
        var formattedBreadCrumb = formatLinkFromCurrentPage(breadCrumbToFormat.page);
        formattedBread.push({
            listItem: formattedBreadCrumb,
            page: breadCrumbToFormat.page
        });
    }

    // pop the last one and make it inactive
    var topBreadCrumb = formattedBread.pop();
    var formattedTopCrumb = createActiveLink(topBreadCrumb.page);
    formattedBread.push({
        listItem: formattedTopCrumb,
        page: topBreadCrumb.page
    });

    bread = formattedBread;
    storeCrumbs(bread);
}

function displayCrumbs() {
    $('#breadCrumbList').empty();
    var bread = readBreadCrumbs();
    bread.forEach(function (element) {
        $('#breadCrumbList').append(element.listItem);
    });
}

function getCurrentPage() {
    var currentPage = document.getElementById('pageName').value;
    return currentPage;
}

function clearCrumbs() {
    // if I need to clear crumbs from local storage
    storeCrumbs([]);
}

function hideCrumbs() {
    document.getElementById('breadCrumbList').style.visibility = 'hidden';
}

function addConfirmation(currentPage) {
    if (currentPage === 'productSearch' || currentPage === 'address' || currentPage === 'discounts') {
        var homeNode = document.getElementById('breadCrumbList').getElementsByTagName('li')[0];
        var chooseBrandNode = document.getElementById('breadCrumbList').getElementsByTagName('li')[1];
        homeNode.setAttribute('onclick', 'return confirm("Returning to home will empty out your current cart. Do you wish to continue?")');
        chooseBrandNode.setAttribute('onclick', 'return confirm("Choosing another brand will empty out your current cart. Do you wish to continue?")');
    }
}

$(function () {
    // on page load
    var currentPage = getCurrentPage();
    var crumbToInsert = formatLinkFromCurrentPage(currentPage);
    if (currentPage === 'OrderView') {
        clearCrumbs();
        addCrumb(formatLinkFromCurrentPage('WelcomePage'), 'WelcomePage');
        addCrumb(formatLinkFromCurrentPage('OrderView'), 'OrderView');
    } else if (currentPage === 'pcipal') {
        // clearCrumbs();
        hideCrumbs();
    } else {
        addCrumb(crumbToInsert, currentPage);
    }
    // addCrumb(crumbToInsert, currentPage);
    displayCrumbs();
    addConfirmation(currentPage);
});


module.exports = {
    methods: {
        storeCrumbs: storeCrumbs,
        readBreadCrumbs: readBreadCrumbs,
        addCrumb: addCrumb,
        displayCrumbs: displayCrumbs,
        clearCrumbs: clearCrumbs,
        getCurrentPage: getCurrentPage,
        formatLinkFromCurrentPage: formatLinkFromCurrentPage,
        createActiveLink: createActiveLink,
        hideCrumbs: hideCrumbs
    }
};
