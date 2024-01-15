'use strict';

var collections = require('*/cartridge/scripts/util/collections');

/**
 * Creates an object of the visible attributes for a product
 * @param {dw.catalog.ProductAttributeModel} attributeModel - attributeModel for a given product.
 * @return {Object|null} an object containing the visible attributes for a product.
 */
function getAttributes(attributeModel) {
    var attributes = null;
    var visibleAttributeGroups = attributeModel.visibleAttributeGroups;

    if (visibleAttributeGroups.getLength() > 0) {
        collections.forEach(attributeModel.visibleAttributeGroups, function (group) {
            if (group.ID.indexOf('specs-') === -1) {
                var visibleAttributeDef = attributeModel.getVisibleAttributeDefinitions(group);
                var attributeResult = {};

                attributeResult.ID = group.ID;
                attributeResult.name = group.displayName;
                attributeResult.attributes = collections.map(
                    visibleAttributeDef,
                    function (definition) {
                        var definitionResult = {};
                        definitionResult.label = definition.displayName;

                        if (definition.multiValueType) {
                            definitionResult.value = attributeModel.getDisplayValue(definition).map(
                                function (item) {
                                    return item;
                                });
                        } else {
                            definitionResult.value = [attributeModel.getDisplayValue(definition)];
                        }

                        return definitionResult;
                    }
                );

                if (attributes === null) {
                    attributes = [];
                }

                attributes.push(attributeResult);
            }
        });
    } else {
        attributes = null;
    }

    return attributes;
}

module.exports = function (object, attributeModel) {
    Object.defineProperty(object, 'attributes', {
        enumerable: true,
        value: getAttributes(attributeModel)
    });
};
