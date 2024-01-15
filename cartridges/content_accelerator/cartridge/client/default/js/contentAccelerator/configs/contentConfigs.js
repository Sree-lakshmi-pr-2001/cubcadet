'use strict';

var configs = {};

// Custom Content Presets for Dashboard
configs.presets = [
    {
        id: 'hero-banner-template',
        cid: 'heroBanner',
        buttonLabel: 'Hero Banner',
        buttonIcon: 'fa-address-card'
    },
    {
        id: 'hero-overlay-template',
        cid: 'hero-banner-overlay',
        buttonLabel: 'Hero Banner Overlay',
        buttonIcon: 'fa-address-card'
    },
    {
        id: 'subcategory-group-template',
        cid: 'subcategory-card-group-template',
        buttonLabel: 'Subcategory Card Group',
        buttonIcon: 'fa-columns'
    },
    {
        id: 'product-line-template',
        cid: 'product-line-group-template',
        buttonLabel: 'Product Line Group',
        buttonIcon: 'fa-align-justify'
    },
    {
        id: 'content-card-template',
        cid: 'content-card-group-template',
        buttonLabel: 'Content Card Group',
        buttonIcon: 'fa-square'
    },
    // {
    //     id: 'video-template',
    //     cid: 'test-video-asset',
    //     buttonLabel: 'Video',
    //     buttonIcon: 'fa-play'
    // },
    {
        id: 'image-template',
        cid: 'hero-image-template',
        buttonLabel: 'Hero Image',
        buttonIcon: 'fa-image'
    }
];

//  LYONSCG Global Trait Options
configs.colors = [
    {value: 'bg-primary', name: 'Primary'},
    {value: 'bg-secondary', name: 'Secondary'},
    {value: 'bg-dark', name: 'Dark'},
    {value: 'bg-light', name: 'light'},
    {value: 'bg-success', name: 'Success'},
    {value: 'bg-info', name: 'Info'},
    {value: 'bg-warning', name: 'Warning'},
    {value: 'bg-danger', name: 'Danger'},
    {value: 'bg-accent-1', name: 'Accent-1'},
    {value: 'bg-accent-2', name: 'Accent-2'},
    {value: 'bg-accent-3', name: 'Accent-3'},
    {value: 'bg-accent-4', name: 'Accent-4'},
    {value: 'bg-accent-5', name: 'Accent-5'},
    {value: 'bg-accent-6', name: 'Accent-6'},
    {value: 'bg-trans', name: 'Transparent'},
    {value: '', name: 'Clear Selection'}
];

configs.textColors = [
    {value: 'text-primary', name: 'Primary'},
    {value: 'text-secondary', name: 'Secondary'},
    {value: 'text-dark', name: 'Dark'},
    {value: 'text-light', name: 'light'},
    {value: 'text-success', name: 'Success'},
    {value: 'text-info', name: 'Info'},
    {value: 'text-warning', name: 'Warning'},
    {value: 'text-danger', name: 'Danger'},
    {value: 'text-accent-1', name: 'Accent-1'},
    {value: 'text-accent-2', name: 'Accent-2'},
    {value: 'text-accent-3', name: 'Accent-3'},
    {value: 'text-accent-4', name: 'Accent-4'},
    {value: 'text-accent-5', name: 'Accent-5'},
    {value: 'text-accent-6', name: 'Accent-6'},
    {value: '', name: 'Clear Selection'}
];

// content wrapper
configs.widthOptions = [
    {value: 'col-lg-12', name: 'Full'},
    {value: 'col-lg-6', name: 'Half'},
    {value: 'col-lg-4', name: 'One-third'},
    {value: 'col-lg-8', name: 'Two-thirds'}
];

// container width options
configs.containerWidth = [
    {value: 'container', name: 'Fixed'},
    {value: 'container-fluid', name: 'Fluid'}
];

configs.textAlignment = [
    {value: 'text-left', name: 'Left'},
    {value: 'text-center', name: 'Center'},
    {value: 'text-right', name: 'Right'},
    {value: 'text-justify', name: 'Justify'},
    {value: '', name: 'Clear Selection'}
];

configs.textBlockDesktopPosition = [
    {value: 'order-lg-1', name: 'Left'},
    {value: 'order-lg-2', name: 'Right'}
];

configs.textBlockMobilePosition = [
    {value: 'order-1', name: 'Above'},
    {value: 'order-2', name: 'Below'}
];

configs.textBlockPositionOverlay = [
    {value: 'hero-content-left', name: 'Left'},
    {value: 'hero-content-right', name: 'Right'}
];

configs.ctaLayout = [
    {value: 'd-inline-flex', name: 'Inline'},
    {value: 'd-flex justify-content-around', name: 'Full-Width'}
];

// PLaceholder Images
configs.img_src_default_desktop = 'https://via.placeholder.com/1015x765';
configs.img_src_default_tablet = 'https://via.placeholder.com/738x495';
configs.img_src_default_mobile = 'https://via.placeholder.com/345x325';

//  LYONSCG Text Component Trait Options
configs.textTypes = [
    {value: 'd-none', name: 'None (hide)'},
    {value: 'display-1', name: 'Hero Display'},
    {value: 'label-1', name: 'Label 1'},
    {value: 'h1', name: 'H1'},
    {value: 'h2', name: 'H2'},
    {value: 'h3', name: 'H3'},
    {value: 'h4', name: 'H4'},
    {value: 'h5', name: 'H5'},
    {value: 'h6', name: 'H6'},
    {value: 'info', name: 'Info (small)'},
    {value: 'p', name: 'Paragraph (default)'},
    {value: 'hero-bullet', name: 'bullet item'}
];

configs.textCases = [
    {value: 'text-capitalize', name: 'Capitalize'},
    {value: 'text-lowercase', name: 'Lowercase'},
    {value: 'text-uppercase', name: 'Uppercase'},
    {value: '', name: 'clear'}
];

// custom heading underline options
configs.headingLines = [
    {value: '', name: 'Clear Selection'},
    {value: 'underline-left-primary', name: 'Left Primary'},
    {value: 'underline-center-primary', name: 'Center Primary'},
    {value: 'underline-right-primary', name: 'Right Primary'},
    {value: 'underline-left-secondary', name: 'Left Secondary'},
    {value: 'underline-center-secondary', name: 'Center Secondary'},
    {value: 'underline-right-secondary', name: 'Right Secondary'},
    {value: 'underline-left-dark', name: 'Left Dark'},
    {value: 'underline-center-dark', name: 'Center Dark'},
    {value: 'underline-right-dark', name: 'Right Dark'},
    {value: 'underline-left-light', name: 'Left Light'},
    {value: 'underline-center-light', name: 'Center Light'},
    {value: 'underline-right-light', name: 'Right Light'},
    {value: 'underline-left-success', name: 'Left Success'},
    {value: 'underline-center-success', name: 'Center Success'},
    {value: 'underline-right-success', name: 'Right Success'},
    {value: 'underline-left-info', name: 'Left Info'},
    {value: 'underline-center-info', name: 'Center Info'},
    {value: 'underline-right-info', name: 'Right Info'},
    {value: 'underline-left-warning', name: 'Left Warning'},
    {value: 'underline-center-warning', name: 'Center Warning'},
    {value: 'underline-right-warning', name: 'Right Warning'},
    {value: 'underline-left-danger', name: 'Left Danger'},
    {value: 'underline-center-danger', name: 'Center Danger'},
    {value: 'underline-right-danger', name: 'Right Danger'}
];

//  LYONSCG CTA (Button + Link) Component Trait Options
configs.ctaTypes = [
    {value: 'btn btn-primary', name: 'Primary'},
    {value: 'btn btn-secondary', name: 'Secondary'},
    {value: 'btn btn-outline-primary', name: 'Outline Primary'},
    {value: 'btn btn-outline-secondary', name: 'Outline Secondary'},
    {value: 'btn btn-light', name: 'Light'},
    {value: 'btn btn-text', name: 'Primary Link'},
    {value: 'btn btn-link', name: 'Standard Link'},
    {value: 'breadcrumb-item', name: 'Breadcrumb Link'},
    {value: 'btn btn-video-black-ol', name: 'Black Video Link'},
    {value: 'btn btn-video-white-ol', name: 'White Video Link'},
    {value: 'btn btn-video-yellow-ol', name: 'Yellow Video Link'}
];

configs.ctaSizes = [
    {value: 'btn-lg', name: 'Large'},
    {value: 'btn-sm', name: 'Small'},
    {value: '', name: 'Regular'}
];

configs.urlTypes = [
    {value: 'category', name: 'Category'},
    {value: 'product', name: 'Product'},
    {value: 'content', name: 'Content'},
    {value: 'search', name: 'Search Term'},
    {value: 'pipeline', name: 'Pipeline'},
    {value: 'home', name: 'Home'},
    {value: 'absolute', name: 'http://'}
];

configs.urlTargets = [
    {value: '_self', name: 'Self'},
    {value: '_blank', name: 'Blank'},
    {value: '_parent', name: 'Parent'},
    {value: 'modal', name: 'Modal'}
];

module.exports =  configs;
