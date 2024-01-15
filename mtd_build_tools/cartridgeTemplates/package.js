'use strict';

module.exports = cartridgeName => ({
    name: cartridgeName,
    version: '0.0.1',
    description: 'New overlay cartridge',
    main: 'index.js',
    scripts: {
        lint: 'sgmf-scripts --lint js && sgmf-scripts --lint css',
        upload: 'sgmf-scripts --upload -- ',
        uploadCartridge: 'sgmf-scripts --uploadCartridge ' + cartridgeName,
        'compile:js': 'sgmf-scripts --compile js',
        'compile:scss': 'sgmf-scripts --compile css'
    },
    devDependencies: {
        eslint: '^3.2.2',
        'eslint-config-airbnb-base': '^5.0.1',
        'eslint-plugin-import': '^1.12.0',
        stylelint: '^7.1.0',
        'stylelint-config-standard': '^12.0.0',
        'stylelint-scss': '^1.3.4',
        istanbul: '^0.4.4',
        mocha: '^2.5.3',
        sinon: '^1.17.4',
        chai: '^3.5.0',
        proxyquire: '1.7.4',
        'sgmf-scripts': '^1.0.0'
    }
});
