

var pluginConfigs = {};

//  LYONSCG Content Accelerator Default Plugin Options

pluginConfigs.viewports = {
    xs: '0',
    sm: '544px',
    md: '768px',
    lg: '1025px',
    xl: '1366px'
};

pluginConfigs.default_blocks = {
    default: true,

    // Basic Tools
    text: true,
    link: true,
    responsive_image: true,
    image: true,

    // Layout
    container: true,
    twoColumn: true,
    threeColumn: true,

    // Custom
    hero: true,
    card: true,
    placeholder: true
};

// TODO: Localize
pluginConfigs.default_labels = {
    // Basic Tools
    text: 'Text',
    link: 'CTA Link',
    responsive_image: 'Responsive Image',
    image: 'Image',

    // Layout
    container: 'Container',
    twoColumn: 'Two Columns',
    threeColumn: 'Three Columns',

    // Custom
    hero: 'Hero Banner',
    card: 'Content Card',
    placeholder: 'Placeholder'

};

pluginConfigs.default_categories = {
    'layout': false,
    'basic_tools': false,
    'custom': false
};

module.exports =  pluginConfigs;
