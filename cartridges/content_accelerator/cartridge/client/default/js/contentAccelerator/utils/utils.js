'use strict';

var utils = {
    getURLParams: function () {
        var vars = {};
        window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
            vars[key] = value;
        });
        return vars;
    },
    generateUrl: function (urlType, urlLocation) {
        let url = urlLocation;
        switch (urlType) {
            case 'category':
                url = '$url(\'Search-Show\', \'cgid\', \'' + urlLocation + '\')$';
                break;
            case 'product':
                url = '$url(\'Product-Show\', \'pid\', \'' + urlLocation + '\')$';
                break;
            case 'content':
                url = '$url(\'Page-Show\', \'cid\', \'' + urlLocation + '\')$';
                break;
            case 'search':
                url = '$url(\'Search-Show\', \'q\', \'' + urlLocation + '\')$';
                break;
            case 'pipeline':
                url = '$url(\'' + urlLocation + '\')$';
                break;
            case 'home':
                url = '$url(\'Home-Show\')$';
                break;
            case 'absolute':
            default:
                url = urlLocation
                break;
        }

        return url;
    },
    checkAssetUrl: function (url) {
        const regex = /^\$url/;
        const str = url && url.value ? url.value : url;
        let m;
        var urlCheck;

        if ((m = regex.exec(str)) !== null) {
            // The result can be accessed through the `m`-variable.
            urlCheck = true;
        }

        return urlCheck;
    },
    splitAssetUrl: function (url) {
        const regex = /\'(.*?)\'/g;
        const str = url && url.value ? url.value : url;
        let m;
        var urlParts = [];

        while ((m = regex.exec(str)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                urlParts.push(match);
            });
        }

        return urlParts;
    },
    generateModalData: function (url) {
        var titleAttr = 'enable-title';
        var sizeAttr = 'large-modal';
        var contentAttr = 'data-content';
        var linkAttr = 'data-link';
        var modalData = [
            {attribute: titleAttr, value: 'false'},
            {attribute: sizeAttr, value: 'true'},
            {attribute: contentAttr, value: '#ctaModal'},
            {attribute: linkAttr, value: url}
        ];

        return modalData;
    },
    updateAttribute: function (attribute, value, component, modal) {
        const hrefTrait = component.getTrait('href').attributes.value;
        const urlTypeTrait = component.getTrait('urlType').attributes.value;
        const urlTypeTarget = component.getTrait('urlTarget').attributes.value;
        var url = this.generateUrl(urlTypeTrait, hrefTrait);
        // Generate the modal attributes
        var attrData = [];
        attrData = this.generateModalData(url);

        // Check if this is the href modal
        if (modal.get('name') != 'href' && modal.get('name') != 'urlType') {
            const attr = component.getAttributes();
            attr[attribute] = value;

            // udate component attributes
            component.setAttributes(attr);
        } else {
            // If set the href attribute to generated URL
            const attr = component.getAttributes();
            attr['href'] = url;

            // udate component attributes
            component.setAttributes(attr);
        }

        // Check if modal is selected in urlType
        if (urlTypeTarget == 'modal') {
            component.addClass('modal-link video-modal');
            const attr = component.getAttributes();
            // clear the href attribute
            delete attr['href'];

            // apply the modal attributes
            for (var index in attrData) {
                attr[attrData[index].attribute] = attrData[index].value;
            }

            // udate component attributes
            component.setAttributes(attr);
        } else {
            // clear the modal attributes
            component.removeClass('modal-link');
            const attr = component.getAttributes();
            for (var index in attrData) {
                var dataAttr = attrData[index].attribute.toString();
                delete attr[dataAttr];
            }

            // Add the href back
            attr['href'] = url;

            // update component attributes
            component.setAttributes(attr);
        }
    }
}

module.exports = utils;
