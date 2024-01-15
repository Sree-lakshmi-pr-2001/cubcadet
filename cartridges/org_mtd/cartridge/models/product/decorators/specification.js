'use strict';

var collections = require('*/cartridge/scripts/util/collections');

/**
 * Creates an object of the visible attributes for a product
 * @param {dw.catalog.ProductAttributeModel} attributeModel - attributeModel for a given product.
 * @return {Object|null} an object containing the visible attributes for a product.
 */
function getSpecification(attributeModel) {
    var attributes = null;
    var attributeGroups = attributeModel.attributeGroups;

    if (attributeGroups.getLength() > 0) {
        collections.forEach(attributeGroups, function (group) {
            if (group.ID.indexOf('specs-') === 0) {
                var attributeDef = attributeModel.getAttributeDefinitions(group);
                var attributeResult = {};
                var hasAtLeastOneValue = false;

                attributeResult.ID = group.ID;
                attributeResult.name = group.displayName;
                attributeResult.attributes = collections.map(
                        attributeDef,
                    function (definition) {
                        var definitionResult = {};
                        definitionResult.label = definition.displayName;
                        var displayValue = attributeModel.getDisplayValue(definition);
                        if (definition.multiValueType) {
                            if (displayValue.length > 0) {
                                definitionResult.value = displayValue.map(
                                    function (item) {
                                        return item;
                                    });
                                hasAtLeastOneValue = true;
                            } else {
                                definitionResult.value = null;
                            }
                        } else {
                            if (displayValue) { // eslint-disable-line no-lonely-if
                                definitionResult.value = [displayValue];
                                hasAtLeastOneValue = true;
                            } else {
                                definitionResult.value = null;
                            }
                        }

                        return definitionResult;
                    }
                );

                if (attributes === null) {
                    attributes = [];
                }
                if (hasAtLeastOneValue) {
                    attributes.push(attributeResult);
                }
            }
        });
    }

    return attributes;
}

module.exports = function (object, attributeModel) {
    Object.defineProperty(object, 'specification', {
        enumerable: true,
        value: getSpecification(attributeModel)
    });
};
