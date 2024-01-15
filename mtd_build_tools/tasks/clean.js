'use strict';

const path = require('path');
const del = require('del');
const uploadUtils = require('../lib/util/upload-utils');
const packageFile = uploadUtils.getPackageJson();

module.exports = () => {
    // Delete compiled JS and Css assets
    packageFile.sites.forEach(site =>
        site.cartridges.forEach(cartridge => {
            if (cartridge.alias === 'site' || cartridge.alias === 'org') {
                del.sync(path.join(process.cwd(), cartridge.name, 'cartridge/static/*/+(js|css)'));
                console.log(`Deleted compiled Js and Css files for site "${cartridge.name}"`);

                del.sync(path.join(process.cwd(), cartridge.name, 'cartridge/scss/*/compiled'));
                del.sync(path.join(process.cwd(), cartridge.name, 'cartridge/static/*/compiled'));
                del.sync(path.join(process.cwd(), cartridge.name, 'cartridge/templates/*/components/svg.isml'));
                console.log(`Deleted compiled SVG files for site "${cartridge.name}"`);

            }
        })
    );

    // Delete compiled font files
    del.sync(path.join(process.cwd(), 'app_storefront_core/cartridge/static/default/fonts'));
    console.log('Deleted fonts');

    // Delete caches
    del.sync(path.join(process.cwd(), 'mtd_build_tools/.cache'));
    del.sync([path.join(process.cwd(), 'node_modules/.cache')]);
    console.log('Deleted caches');

    console.log(`
    You can also delete any additional, non-tracked files by running the git commmand:
    "git clean -d -f"
    Add the flag "--dry-run" to the command to view which files will be deleted beforehand.`);
};
