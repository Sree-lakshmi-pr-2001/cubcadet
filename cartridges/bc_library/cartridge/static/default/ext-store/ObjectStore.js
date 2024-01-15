/**
 * Copyright(c) 2013, Demandware Inc.
 * 
 * @author Holger Nestmann
 */

/**
 * This override is only in place due to a bug in ExtJS
 * https://www.sencha.com/forum/showthread.php?299056-Setting-idProperty-via-metadata&s=a56fb48c7b2aed08b8a84f0ac6f8fbf3
 **/
Ext.define('App.overrides.data.reader.Reader', {
	override:'Ext.data.reader.Reader',
	onMetaChange : function(meta) {
		var me = this,
			fields = meta.fields,
			model,
			newModel,
			clientIdProperty,
			idProperty,
			proxy;
		me.metaData = meta;
		if (meta.root) {
			me.setRootProperty(meta.root);
		}
		if (meta.totalProperty) {
			me.setTotalProperty(meta.totalProperty);
		}
		if (meta.successProperty) {
			me.setSuccessProperty(meta.successProperty);
		}
		if (meta.messageProperty) {
			me.setMessageProperty(meta.messageProperty);
		}
		clientIdProperty = meta.clientIdProperty;
		idProperty = meta.idProperty;
		if (fields) {
			if (idProperty) {
				newModel = Ext.define("Ext.data.reader.Json-Model" + Ext.id(), {
					extend: 'Ext.data.Model',
					fields: fields,
					idProperty: idProperty,
					clientIdProperty: clientIdProperty
				});
			} else {
				newModel = Ext.define("Ext.data.reader.Json-Model" + Ext.id(), {
					extend: 'Ext.data.Model',
					fields: fields,
					clientIdProperty: clientIdProperty
				});
			}
			me.setModel(newModel);
			proxy = me.getProxy();
			if (proxy) {
				proxy.setModel(newModel);
			}
		} else if (clientIdProperty) {
			model = me.getModel();
			if (model) {
				model.self.prototype.clientIdProperty = clientIdProperty;
			}
		}
	}
});

Ext.define('dw.ext.PersistentObjectStore', {
	init : function(options) {
		this.system = this.system || false;
		var object= {
			autoLoad : true,
			fields : [],
			storeId: this.type,
		    proxy : {
			    type : 'ajax',
			    api: {
			        create  : 'ObjectStore-CreateObject',
			        read    : 'ObjectStore-ReadObjects',
			        update  : 'ObjectStore-SaveObject',
			        destroy : 'ObjectStore-DeleteObject'
			    },
				reader: new Ext.data.JsonReader({
					fields:[],
					rootProperty : 'customObjects'
				}),
				/*
			    reader : {
					type : 'json',
					rootProperty : 'customObjects'
			    },*/
			    headers : {
			    	type   : this.type,
			    	system : this.system,
			    	config : this.config
			    },
				writer: {
					writeAllFields: true
				}
			}
		};

		Ext.apply(object, options);
		return object;
    },
    addHandlers : function(){
		this.on('beforeload', function(store, record, operation) {
			if(window.console) console.log('Loading objects of type ',this.type);
			return true;
		});
		this.on('load', function(store, record, operation) {
			if(window.console) console.log('Loaded objects of type ',this.type);
			return true;
		});
		this.on('metachange', function( scope, meta, eOpts) {
			this.customMeta = meta;
			return true;
		});
    },

    getResponseStatus : function(res) {
		var result = false;
		var idx = res.responseText.indexOf('{');
		if (res.responseText && idx > -1 && idx < 10) {
		    result = Ext.decode(res.responseText).success
		}
		return result;
	}
});

Ext.define('dw.ext.CustomObjectStore', {
    extend : 'Ext.data.Store',
    mixins : { objectStore : 'dw.ext.PersistentObjectStore'},
    constructor : function(type, fields, config) {
    	// allow options type constructor and verbose one
    	if(typeof(type) === 'string'){
        	this.type = type;
        	this.config = config;
    		var options = new Object();
    		options.fields = fields;
    		options.type = type;
    		options.config = config;
    	}else{
    		var options = type;
        	this.type = options.type;
        	this.config = options.config;
    	}
    	options.remoteSort = options.remoteSort !== false;
		this.callParent([this.init(options)]);
		this.addHandlers(options);
	}
});

Ext.define('dw.ext.CustomObjectTreeStore', {
    extend : 'Ext.data.TreeStore',
    mixins : { objectStore : 'dw.ext.PersistentObjectStore'},
    constructor : function(options) {
    	this.type = options.type;
    	this.config = options.config;

		this.callParent([this.init(options)]);
		this.addHandlers(options);
	}
});

Ext.define('dw.ext.SystemObjectStore', {
    extend : 'dw.ext.CustomObjectStore',
    system : true
});

Ext.define('dw.ext.SystemObjectTreeStore', {
    extend : 'dw.ext.CustomObjectTreeStore',
    system : true
});