'use strict';

var HashMap = require('dw/util/HashMap');
/**
 * Retrieve the default variant
 * @param {ProductVariationModel} pvm - The ProductVariationModel used to retrieve this default Variant
 * @returns {dw.catalog.Variant} The default Variant
 */
exports.getDefaultVariant = function (pvm) {
    // If we already have a selected variant, use that
    var variant = pvm.selectedVariant;
    if (variant) {
        return variant;
    }

    // No selected variant, determine which attributes are selected, if any
    var map = new HashMap();
    var attDefs = pvm.getProductVariationAttributes().iterator();
    var attribute;
    var selectedValue;

    while (attDefs !== null && attDefs.hasNext()) {
        attribute = attDefs.next();
        selectedValue = pvm.getSelectedValue(attribute);
        if (selectedValue !== null && selectedValue.displayValue.length > 0) {
            map.put(attribute.ID, selectedValue.ID);
        }
    }

    // If any attributes are selected, loop through all matching variants and use the first orderable one
    if (map.length > 0) {
        var matchingVariants = pvm.getVariants(map).iterator();
        while (matchingVariants !== null && matchingVariants.hasNext()) {
            variant = matchingVariants.next();
            if (variant.availabilityModel.orderable) {
                return variant;
            }
        }
    }

    // If no attributes are selected, look for an orderable default variant to use
    if (pvm.defaultVariant !== null && pvm.defaultVariant.availabilityModel.orderable) {
        return pvm.defaultVariant;
    }

    // If no orderable default variant, look for the first orderable variant
    var allVariants = pvm.variants.iterator();
    while (allVariants !== null && allVariants.hasNext()) {
        variant = allVariants.next();
        if (variant.availabilityModel.orderable) {
            return variant;
        }
    }

    // No orderable variants... let's just use the first variant
    return pvm.variants[0];
};
