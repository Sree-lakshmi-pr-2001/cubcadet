'use strict';

const SVGSpriter = require('svg-sprite'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    fs = require('fs'),
    File = require('vinyl'),
    glob = require('glob'),
    packageFile = require('../../../package.json'),
    xmldom = require('xmldom'),
    DOMParser = xmldom.DOMParser,
    XMLSerializer = xmldom.XMLSerializer,
    svgNamespace = 'http://www.w3.org/2000/svg';

/**
 * Generate <use> and <view> tags for css background styles
 *
 * @param {String} svg Sprite SVG
 * @return {String} Processed SVG
 */
const generateViewUseTags = function (svg) {
    const svgDom = new DOMParser().parseFromString(svg);
    let xCoordinate = 0;

    for (var c = 0, children = svgDom.documentElement.childNodes, cl = children.length; c < cl; ++c) {
        const symbol = children.item(c);

        const id = symbol.getAttribute('id');
        let viewBox = symbol.getAttribute('viewBox');
        let width = 0;
        let height = 0;

        if (viewBox.length) {
            viewBox = viewBox.split(/[^-\d\.]+/);

            while (viewBox.length < 4) {
                viewBox.push(0);
            }

            viewBox.forEach(function(value, index) {
                viewBox[index] = parseFloat(value, 10);
            });

            width = viewBox[2];
            height = viewBox[3];
            viewBox[0] = xCoordinate;
            viewBox = viewBox.join(' ');
        }

        let useElement = svgDom.createElementNS(svgNamespace, 'use');
        useElement.setAttribute('xlink:href', '#' + id);
        useElement.setAttribute('width', width);
        useElement.setAttribute('height', height);
        useElement.setAttribute('x', xCoordinate);

        let viewElement = svgDom.createElementNS(svgNamespace, 'view');
        viewElement.setAttribute('id', id + '-view');
        viewElement.setAttribute('viewBox', viewBox);

        svgDom.documentElement.appendChild(useElement);
        svgDom.documentElement.appendChild(viewElement);

        xCoordinate = xCoordinate + width;
    }

    return new XMLSerializer().serializeToString(svgDom.documentElement);
};
/**
 * Create a temporary directory to store the SVGs from all cartridges in the site
 */
const createTempDirectory = function (dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log('SVG temporary directory successfully created!');
            }
        });
    }
};

/**
 * Delete the temporary directory that stores the SVGs from all cartridges in the site
 */
const removeTempDirectory = function (dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach((entry) => {
            const entryPath = path.join(dirPath, entry);
            if (fs.lstatSync(entryPath).isDirectory()) {
                removeTempDirectory(entryPath);
            } else {
                fs.unlinkSync(entryPath);
            }
        });

        fs.rmdirSync(dirPath);
    }
};

const templateType = 'css';
const templatePath = path.resolve(`mtd_build_tools/lib/compile/svg-sprite-styles/sprite.${templateType}`);

packageFile.sites.forEach((site) => {
    const tempSVGsDirectory = path.resolve('mtd_build_tools/temp-svgs');
    let filesFound = false;
    let siteCartridge;

    // Create the temporary directory for this site
    createTempDirectory(tempSVGsDirectory);

    site.cartridges.slice().reverse().forEach((cartridge) => {
        const cwd = path.resolve(cartridge.name, 'cartridge/static/default');
        const svgIcons = path.join(cwd, 'images', 'svg-icons');
        
        if (cartridge.alias === 'site') {
            siteCartridge = cartridge.name;
        }

        // Find SVG files recursively via `glob` and copy them to the temp directory
        const files = glob.sync('**/*.svg', { cwd: svgIcons });
        if (files.length) {
            filesFound = true;

            files.forEach((file) => {
                fs.copyFileSync(path.join(svgIcons, file), path.join(tempSVGsDirectory, file), (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
            });
        }
    });

    if (filesFound) {
        const siteCartridgeStatic = path.resolve(siteCartridge, 'cartridge/static/default');

        const spriter = new SVGSpriter({
            dest: siteCartridgeStatic,
            svg: {
                transform: [
                    /**
                     * Custom sprite SVG transformation
                     *
                     * @param {String} svg Sprite SVG
                     * @return {String} Processed SVG
                     */
                    function (svg) {
                        return generateViewUseTags(svg);
                    }
                ]
            },
            mode: {
                symbol: { // Activate the «view» mode
                    inline: true,
                    dest: './',
                    sprite: './compiled/sprites.svg',
                    prefix: ".icon.svg-%s",
                    bust: false,
                    render: {
                        scss: {
                            dest: '../../scss/default/compiled/_svg.scss',
                            template: templatePath
                        } // Activate Sass output
                    }
                },
                defs: {
                    inline: true,
                    dest: './',
                    sprite: '../../templates/default/components/svg.isml'
                }
            }
        });

        // Find SVG files recursively via `glob`
        const files = glob.sync('**/*.svg', { cwd: tempSVGsDirectory });
        if (files.length) {
            files.forEach((file) => {
                // Create and add a vinyl file instance for each SVG
                spriter.add(new File({
                    path: path.join(siteCartridgeStatic, file),                       // Absolute path to the SVG file
                    base: siteCartridgeStatic,                                        // Base path (see `name` argument)
                    contents: fs.readFileSync(path.join(tempSVGsDirectory, file))     // SVG file contents
                }));
            });

            spriter.compile((error, result) => {
                for (var type in result) {
                    if (result[type].sprite) {
                        mkdirp.sync(path.dirname(result[type].sprite.path));
                        fs.writeFileSync(result[type].sprite.path, result[type].sprite.contents);
                    }

                    if (result[type].scss) {
                        mkdirp.sync(path.dirname(result[type].scss.path));
                        fs.writeFileSync(result[type].scss.path, result[type].scss.contents);
                    }
                }
            });
        }
    }

    removeTempDirectory(tempSVGsDirectory);
});
