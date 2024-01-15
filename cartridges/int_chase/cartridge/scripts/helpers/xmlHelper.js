'use strict';
/* global XML */

var xmlHelper = {};
/**
 * Parse XML into Object
 * @param {string} xmlStr XML string
 * @return {Object} Parsed object
 */
xmlHelper.parseXml = function (xmlStr) {
    var resultObj = {};
    var xmlObj = new XML(xmlStr);

    function formatNodeName(name) { // eslint-disable-line require-jsdoc
        var nameParts = name.split('-');
        for (var i = 1; i < nameParts.length; i++) {
            nameParts[i] = nameParts[i].charAt(0).toUpperCase() + nameParts[i].slice(1);
        }
        return nameParts.join('');
    }

    function parse(node, objectToParse) { // eslint-disable-line require-jsdoc
        var obj = objectToParse;
        var nodeName = formatNodeName(node.name().toString());
        var elements = node.elements();
        var element = null;
        var elementIndx = null;

        if (elements.length()) {
            var nextNode = {};
            if (obj[nodeName]) {
                if (!Array.isArray(obj[nodeName])) {
                    obj[nodeName] = [obj[nodeName]];
                }
                obj[nodeName].push(nextNode);
            } else {
                obj[nodeName] = nextNode;
            }
            for (elementIndx in elements) { // eslint-disable-line
                element = elements[elementIndx];
                parse(element, nextNode);
            }
        } else if (nodeName === 'key') {
            var orderNo = node.attribute('order_number').toString();
            var site = node.attribute('site').toString();
            obj[nodeName] = {
                order_number: orderNo,
                site: site,
                value: node.text().toString()
            };
        } else {
            obj[nodeName] = node.text().toString();
        }
    }
    parse(xmlObj, resultObj);
    return resultObj;
};

module.exports = xmlHelper;
