/*
 * Copyright(c) 2013, Demandware Inc.
 * 
 * @author Holger Nestmann
 */

var CustomObjectServerConfig = function(helperClassPath, keyAttribute) {
	this.helperClassPath = helperClassPath;
	this.keyAttribute = keyAttribute;
	
	/** Setter */
	this.setHelperClassPath = function (helperClassPath) {
		this.helperClassPath = helperClassPath;
	}
	
	this.setKeyAttribute = function (keyAttribute) {
		this.keyAttribute = keyAttribute;
	}
};
