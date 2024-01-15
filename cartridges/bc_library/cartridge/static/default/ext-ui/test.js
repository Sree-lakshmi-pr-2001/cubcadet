Ext.application({

    // --------------------------------------
    // Properties
    // --------------------------------------
    name : 'HelloWorldApplication',

    // --------------------------------------
    // Constructor
    // --------------------------------------
    launch : function() {

	// SETUP CLASS PATHS -
	// Now any code that references "com.blah.foo" will look
	// at the physical location "src.com.blah.foo"
	Ext.Loader.setConfig({
	    enabled : true,
	    paths : {
		com : "src/com"
	    }
	});

	this.testSomeUI();

	// this.testSomeObjects();

    },

    // --------------------------------------
    // Methods
    // --------------------------------------
    testSomeUI : function() {

	var store = (new CustomObjectStore('WebserviceCredentials', [ "ID", "UUID" ]));
	var grid = Ext.create('Ext.grid.Panel', {
	    store : store,
	    columns : [ {
		text : "Author",
		width : 120,
		dataIndex : 'ID',
		sortable : true,
		editor : {
		    xtype : 'textfield',
		    allowBlank : false
		}
	    }, {
		text : "Title",
		flex : 1,
		dataIndex : 'Title',
		sortable : true
	    }, {
		text : "Manufacturer",
		width : 125,
		dataIndex : 'Manufacturer',
		sortable : true
	    }, {
		text : "Product Group",
		width : 125,
		dataIndex : 'ProductGroup',
		sortable : true
	    } ],
	    forceFit : true,
	    height : 210,
	    split : true,
	    plugins : [ Ext.create('Ext.grid.plugin.CellEditing', {
		clicksToEdit : 1
	    }) ],
	    region : 'north'
	});

	Ext.create('Ext.Panel', {

	    renderTo : 'customobject-ui',
	    frame : true,
	    name : "frame2",
	    layout : 'column',
	    items : [ {
		id : 'detailPanel',
		region : 'center',
		bodyPadding : 7,
		bodyStyle : "background: #ffffff;",
		html : 'Please select a book to see additional details.'
	    }, grid, {
		xtype : 'button',
		text : 'Remove',
		listeners : {
		    click : {
			fn : function() {
			    grid.getStore().remove(grid.getSelectionModel().getSelection()[0]);

			},
			scope : this
		    }
		}
	    } ]

	});

    },

    // --------------------------------------
    // Methods
    // --------------------------------------
    testSomeObjects : function() {

	// ****************
	// SUPER CLASS
	// ****************
	console.log("\nSUPER CLASS");
	var myBeer = Ext.create('com.rmc.projects.helloworld.Beer', 'Budweiser');
	myBeer.addListener('drinked', function() {
	    var stringArgument = arguments[0];
	    console.log(myBeer.brandName + " was drinked! With message" + stringArgument + ".");
	});
	console.log("myBeer.brandName: " + myBeer.brandName);
	myBeer.drink();

	// ****************
	// CHILD CLAS
	// ****************
	console.log("\nCHILD CLASS");
	var myLightBeer = Ext.create('com.rmc.projects.helloworld.LightBeer', 'BudLight');
	myLightBeer.addListener('drinked', function() {
	    var stringArgument = arguments[0];
	    console.log(myLightBeer.brandName + " was drinked! With message" + stringArgument + ".");
	});
	console.log("myLightBeer.brandName: " + myLightBeer.brandName);
	myLightBeer.drink();

	// ****************
	// MIXIN
	// ****************
	console.log("\nMIXIN");
	// Because of 'MixinCheers.js' we can call 'cheers()'
	myLightBeer.cheers();

	// ****************
	// OBJECT ORIENTED DEMO
	//
	// NOTE: This shows some of the concepts above, and more.
	//
	// ****************
	// CREATE & PASS PARAMETER TO CONSTUCTOR
	console.log("\nOBJECT ORIENTED DEMO");
	var cocktail = Ext.create('com.rmc.projects.helloworld.Cocktail', 'RedBullAndVodka');

	// TEST PUBLIC PROPERTY
	console.log("cocktail.samplePublicProperty : " + cocktail.samplePublicProperty);

	// TEST STATIC PROPERTY
	console.log("com.rmc.projects.helloworld.Cocktail.TEST_STATIC_PROPERTY : " + com.rmc.projects.helloworld.Cocktail.TEST_STATIC_PROPERTY);

	// TEST AUTO-GENERATED GETTER/SETTER
	console.log("cocktail.getCountForFun() : " + cocktail.getCountForFun());

	// TEST LISTENER
	cocktail.addListener('customEventCalled', function() {
	    console.log("cocktail.customEventCalled argument[0] : " + arguments[0]);
	});
	cocktail.customEventCall();

    }

});