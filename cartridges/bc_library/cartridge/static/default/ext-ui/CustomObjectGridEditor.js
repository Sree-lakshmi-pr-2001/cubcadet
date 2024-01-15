/*
 * Ext JS Library 2.3.0
 * Copyright(c) 2006-2009, Ext JS, LLC.
 * licensing@extjs.com
 * 
 * http://extjs.com/license
 */

Ext.define('dw.ext.CustomObjectGridEditor', {
    mixins: {
        observable: 'Ext.util.Observable'
    },
    constructor: function (renderSeparately, customObjectType) {
        this.mixins.observable.constructor.call(this, arguments);
        this.renderSeparately = renderSeparately;
        this.customObjectType = customObjectType;
        this.constructing = true;
        this.initialise();
    }
});

dw.ext.CustomObjectGridEditor.prototype.initialise = function () {
    if (!this.customObjectType) {
        this.customObjectType = Ext.get('customobject-ui').dom.getAttribute('data-customobjecttype');
    }
    this.initialiseCustomObjectEditor()
}

dw.ext.CustomObjectGridEditor.prototype.initialiseCustomObjectEditor = function () {
    this.store = Ext.create('dw.ext.CustomObjectStore', {
        type: this.customObjectType
    });

    // after ajax has finished we can build UI with server side provided model
    var editorScope = this;
    this.store.on('load', function () {
        if (editorScope.constructing) {
            editorScope.customObjectColumns = new Array();
            editorScope.attributeIDs = new Array();
            editorScope.formFields = new Array();
            editorScope.modelFields = new Array();
            editorScope.keyField = null;
            editorScope.objectDefinition = this.customMeta.fullDWDefinition;
            for (var attributeID in editorScope.objectDefinition) {
                if (!editorScope.objectDefinition[attributeID].isSystem) {
                    editorScope.customObjectColumns.push({
                        text: editorScope.objectDefinition[attributeID].displayName || editorScope.objectDefinition[attributeID].ID,
                        dataIndex: attributeID,
                        sortable: true,
                        flex: 1
                    })
                    editorScope.attributeIDs.push(attributeID);
                    editorScope.formFields.push(editorScope.getFieldByAttributeDefinition(editorScope.objectDefinition[attributeID]));
                    editorScope.modelFields.push(editorScope.getExtRecordTypeByAttributeDefinition(editorScope.objectDefinition[attributeID]));
                    if (editorScope.objectDefinition[attributeID].key) {
                        editorScope.keyField = editorScope.objectDefinition;
                    }
                }
            }
            if (editorScope.attributeIDs.indexOf('UUID')) {
                editorScope.attributeIDs.push("UUID");
                editorScope.modelFields.push(editorScope.getExtRecordTypeByAttributeDefinition(editorScope.objectDefinition["UUID"]));
            }

            /*
             Ext.define('dw.ext.ClientSideCustomObject', {
             extend : 'Ext.data.Model',
             idProperty : editorScope.keyField.ID,
             fields : editorScope.modelFields
             });
             */
            // var BareBoneCustomObject = Ext.data.Record.create(this.modelFields);

            editorScope.buildGrid();
            editorScope.buildFormPanel();
            editorScope.buildMainPanel();
            if (editorScope.store.data.length > 0) {
                editorScope.grid.selModel.selectRange(0, 0);
            }
        }
        editorScope.constructing = false;
    });

}

dw.ext.CustomObjectGridEditor.prototype.buildGrid = function () {
    var editorScope = this;

    this.grid = Ext.create('Ext.grid.Panel', {
        columns: this.customObjectColumns,
        selType: 'rowmodel',
        store: this.store,
        viewConfig: {
            forceFit: true
        },
        height: 210,
        split: true,
        region: 'north',
        listeners: {
            select: {
                fn: function (that, record, index, eOpts) {
                    this.formPanel.form.loadRecord(record);
                    this.formPanel.form.fireEvent('formload', this, record);
                },
                scope: this
            }
        }, dockedItems: [{
            xtype: 'pagingtoolbar',
            store: this.store,   // same store GridPanel is using
            dock: 'bottom',
            displayInfo: true
        }]
    });
}

dw.ext.CustomObjectGridEditor.prototype.buildFormPanel = function () {
    this.formPanel = Ext.create('Ext.form.Panel', {
        frame: true,
        labelAlign: 'left',
        title: 'Custom Object Details',
        flex: 1,
        region: 'center',
        bodyStyle: 'padding:5px 5px 0',
        width: '100%',
        labelWidth: 400,
        defaults: {
            width: 500
        },
        autoScroll: true,
        defaultType: 'textfield',
        items: this.formFields
    });
}

dw.ext.CustomObjectGridEditor.prototype.buildMainPanel = function () {
    var editorScope = this;
    this.mainPanel = Ext.create('Ext.Panel', {
        frame: true,
        title: 'Custom Object Editor: ' + this.customObjectType,
        width: 1000,
        height: 600,
        layout: 'border',
        items: [this.grid, this.formPanel],
        bbar: ["->", {
            xtype: 'button',
            iconCls: 'accept',

            text: 'Apply',
            handler: function () {
                var currentRecord = editorScope.grid.selModel.getSelection()[0];
                editorScope.formPanel.form.updateRecord(currentRecord);
                editorScope.store.sync();
            },
            ctCls: 'x-btn-over'
        }, {
            text: 'Cancel',
            border: 1,
            iconCls: 'cancel',
            handler: function () {
                this.store.rejectChanges();
            },
            ctCls: 'x-btn-over'
        }],
        tbar: [{
            text: 'Add Object',
            iconCls: 'application_form_add',
            handler: function () {
                var newObject = Ext.create(editorScope.store.getProxy().getReader().getModel());
                newObject.setId('- New -');

                editorScope.store.insert(0, newObject);
                editorScope.grid.selModel.selectRange(0, 0);
                editorScope.formPanel.form.reset();
                editorScope.formPanel.form.loadRecord(newObject);
                editorScope.formPanel.form.getFields().items[0].focus('', 10);
            },
            ctCls: 'x-btn-over'
        }, {
            text: 'Remove Object',
            iconCls: 'application_form_delete remove',
            tooltip: 'Remove the selected item',
            handler: function () {
                var currentRecord = editorScope.grid.selModel.getSelection()[0];
                if (currentRecord) {
                    Ext.Msg.confirm("Confirm Deletion", "Please confirm the deletion of the selected object", function (answer) {
                        if (answer == "yes") {
                            editorScope.store.remove(currentRecord);
                            editorScope.store.sync();
                            if (editorScope.store.data.length > 0) {
                                editorScope.grid.selModel.selectRange(0, 0);
                            }
                        }
                    });
                }
            },
            ctCls: 'x-btn-over'
        }]
    });

    if (!this.renderSeparately) {
        this.mainPanel.render('customobject-ui');
    }

    this.fireEvent("editorready", this);
}

dw.ext.CustomObjectGridEditor.prototype.getFieldByAttributeDefinition = function (attributeDefinition) {
    if (attributeDefinition.type == "BOOLEAN") {
        var field = new Ext.form.Checkbox();
    } else if (attributeDefinition.type == "ENUM_OF_STRING") {
        var values = new Array();
        for (var i = 0; i < attributeDefinition.selectableValues.length; i++) {
            var selectableValue = attributeDefinition.selectableValues[i];
            values.push([selectableValue.id, selectableValue.displayValue])
        }
        var simpleStore = new Ext.data.SimpleStore({
            fields: ['id', 'displayValue'],
            data: values
        });

        var field = new Ext.form.ComboBox({
            store: simpleStore,
            forceSelection: true,
            triggerAction: 'all',
            valueField: 'id',
            displayField: 'displayValue',
            emptyText: 'Please select',
            selectOnFocus: true,
            mode: 'local'
        });

    } else {
        var field = new Ext.form.TextField();
    }
    field.name = attributeDefinition.ID;
    if (attributeDefinition.displayName) {
        field.fieldLabel = attributeDefinition.displayName + " (" + attributeDefinition.ID + ")";
    } else {
        field.fieldLabel = attributeDefinition.ID;
    }

    return field;
}

dw.ext.CustomObjectGridEditor.prototype.getPanel = function () {
    return this.mainPanel;
}

dw.ext.CustomObjectGridEditor.prototype.getExtRecordTypeByAttributeDefinition = function (attributeDefinition) {

    var extType = "string";
    if (attributeDefinition.type == "SET_OF_STRING") {
        extType = "auto";
    }
    var recordType = ({
        name: attributeDefinition.ID,
        type: extType
    });

    return recordType;
}
