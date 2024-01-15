var BMUtils = new Object();
/**
 * Retrieves the list of site ids maintained in the system. Gathers list from Site Import Export Page 
 */
BMUtils.getSiteIDs = function() {
    BMUtils._initSiteExportPage();
    return BMUtils.siteIDs;
}

/**
 * Retrieves array of site id-channel ids plus site name. Gathers list from Site Page
 */
BMUtils.getSiteChannelIDs = function() {
	BMUtils._initSitesPage();
	return BMUtils.siteChannelIDs;
}

/**
 * Retrieves the list of catalogs ids maintained in the system. Gathers list from Site Import Export Page 
 */
BMUtils.getCatalogIDs = function() {
    BMUtils._initSiteExportPage();
    return BMUtils.catalogIDs;
}
BMUtils.getLocales = function() {
    BMUtils._initLocalesPage();
    return BMUtils.locales;
}
/**
 * @private
 */
BMUtils._initSiteExportPage = function() {
    // check if list was already downloaded 
    if (typeof (BMUtils.siteIDs) == "undefined") {
	BMUtils.siteIDs = new Array();
	BMUtils.catalogIDs = new Array();
	var response = "";
	// do a synchronous "a"jax call to allow access without callback function
	var request = new Ajax.Request('/on/demandware.store/Sites-Site/default/ViewSiteImpex-Status', {
	    method : 'get',
	    asynchronous : false,
	    onSuccess : function(transport) {
		response = transport.responseText || "no response text";

	    },
	    onFailure : function() {
		alert('Could not retrieve backoffice information ids');
	    }
	});
	// build regexp to match site ids
	var regExp = new RegExp('id: "SiteContentExport_([A-Za-z0-9\-\_]*[A-Za-z0-9])"', 'g');
	while (match = regExp.exec(response)) {
	    // push site ids onto array
	    BMUtils.siteIDs.push(match[1]);
	}
	// build regexp to match catalog ids
	var regExp = new RegExp('id: "FullCatalogExport_([A-Za-z0-9\-\_]*[A-Za-z0-9])"', 'g');
	while (match = regExp.exec(response)) {
	    // push catalog ids onto array
	    BMUtils.catalogIDs.push(match[1]);
	}

    }
}
/**
 * @private
 */
BMUtils._initLocalesPage = function() {
    // check if list was already downloaded 
    if (typeof (BMUtils.locales) == "undefined") {
	BMUtils.locales = new Array();
	var response = "";
	// do a synchronous "a"jax call to allow access without callback function
	var request = new Ajax.Request('/on/demandware.store/Sites-Site/default/ViewLocales-Show', {
	    method : 'get',
	    asynchronous : false,
	    onSuccess : function(transport) {
		response = transport.responseText || "no response text";
		
	    },
	    onFailure : function() {
		alert('Could not retrieve backoffice information ids');
	    }
	});
	// build regexp to match locale ids
	var regExp = new RegExp('DisableLocale_([A-Za-z\_]*)', 'g');
	while (match = regExp.exec(response)) {
	    // push site ids onto array
	    BMUtils.locales.push(match[1]);
	}
    }
}
/**
 * @private
 */
BMUtils._initSitesPage = function() {
    // check if list was already downloaded 
    if (typeof (BMUtils.siteChannelIDs) == "undefined") {
	BMUtils.siteChannelIDs = new Array();
	var response = "";
	// do a synchronous "a"jax call to allow access without callback function
	var request = new Ajax.Request('/on/demandware.store/Sites-Site/default/ViewChannelList-ListAll?SelectedMenuItem=sites&CurrentMenuItemId=sites', {
	    method : 'get',
	    asynchronous : false,
	    onSuccess : function(transport) {
		response = transport.responseText || "no response text";

	    },
	    onFailure : function() {
		alert('Could not retrieve site information');
	    }
	});
	// build regexp to match site ids
	var regExp = new RegExp('ViewChannel-Edit\\?RepositoryUUID=([A-Za-z0-9]*)".*>([A-Za-z0-9\-\_ ]*)</a>.*\n.*width="50%".*>([A-Za-z0-9\-\_]*)&nbsp;<', 'g');
	
	while (match = regExp.exec(response)) {
	    // push site info onto array
	    BMUtils.siteChannelIDs.push([match[3],match[2],match[1]]);
	}
    }
}