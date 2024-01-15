'use strict';

module.exports = {
    options: [{
        option: 'help',
        alias: 'h',
        type: 'Boolean',
        description: 'Generate help message'
    }, {
        option: 'upload',
        type: '[path::String]',
        description: 'Upload a file to a sandbox. Requires dw.json file in the root directory.'
    }, {
        option: 'test',
        type: '[path::String]',
        description: 'Run unittests on specified files/directories.'
    }, {
        option: 'cover',
        type: 'Boolean',
        description: 'Run all unittests with coverage report.'
    }, {
        option: 'lint',
        type: 'Boolean',
        description: 'Lint scss/js files.'
    },
    {
        option: 'lint-no-cache',
        type: 'Boolean',
        description: 'Disables the linters\' caches',
        required: false
    },
    {
        option: 'createCartridge',
        type: 'String',
        description: 'Create new cartridge structure'
    }, {
        option: 'deploy-data',
        type: 'Boolean',
        description: 'Deploy data using the settings in package.json',
        required: false
    }, {
        option: 'cartridge',
        type: '[String]',
        description: 'List of cartridges to be uploaded',
        required: false
    }, {
        option: 'username',
        type: 'String',
        description: 'Username to log into sandbox',
        required: false
    }, {
        option: 'password',
        type: 'String',
        description: 'Password to log into sandbox',
        required: false
    }, {
        option: 'hostname',
        type: 'String',
        description: 'A Single Sandbox URL (without the "https://" prefix)',
        required: false
    }, {
        option: 'deploy-hostname',
        type: '[String] | String',
        description: 'Array or Comma-delimited String of Sandbox URL(s) (without the "https://" prefix)',
        required: false
    }, {
        option: 'cert-hostname',
        type: '[String] | String',
        description: 'Certificate Sandbox URL (without the "https://" prefix)',
        required: false
    }, {
        option: 'activation-hostname',
        type: '[String] | String',
        description: 'Array or Comma-delimited String of Sandbox URL(s) (without the "https://" prefix)',
        required: false
    }, {
        option: 'skip-upload',
        type: 'Boolean',
        description: 'Skips the upload step',
        required: false,
        default: false
    }, {
        option: 'upload-only',
        type: 'Boolean',
        description: 'Only upload code',
        required: false,
        default: false
    }, {
        option: 'root',
        type: 'String',
        description: 'The root file path to resolve to relative to the actual file path on disk. ' +
                     'This option is useful for deleting or uploading a file. Do not use this if ' +
                     'uploading a cartridge, that is taken care of for you.',
        required: false,
        default: '.'
    }, {
        option: 'exclude',
        type: '[path::String]',
        description: 'Exclude patterns. This works for both files and folders. To exclude a folder, ' +
                     'use `**/foldername/**`. The `**` after is important, otherwise child directories ' +
                     'of `foldername` will not be excluded.',
        required: false
    }, {
        option: 'include',
        type: '[path::String]',
        description: 'Include paths.'
    }, {
        option: 'p12',
        type: 'path::String',
        description: 'The p12 file to be used for 2-factor authentication.',
        required: false
    }, {
        option: 'passphrase',
        type: 'String',
        description: 'The passphrase to be used for 2-factor authentication.',
        required: false
    }, {
        option: 'self-signed',
        type: 'Boolean',
        description: 'Stops the check for a signature on the SSL cert.',
        required: false,
        default: false
    }, {
        option: 'data-bundle',
        type: 'String',
        description: 'The data bundle that will be deployed. Data bundles are defined in package.json',
        required: false
    }, {
        option: 'deployCartridges',
        type: 'Boolean',
        description: 'Deploys cartridges specified in the package.json file to the server',
        required: false
    }, {
        option: 'version-cartridge-name',
        type: 'String',
        description: 'cartridge name version.properties should be created within',
        required: false
    }, {
        option: 'activateCodeVersion',
        type: 'Boolean',
        description: 'Activates code version',
        required: false
    }, {
        option: 'code-version',
        type: 'String',
        description: 'Activates code version',
        required: false
    }, {
        option: 'client-id',
        type: 'String',
        description: '',
        required: false
    }, {
        option: 'client-secret',
        type: 'String',
        description: '',
        required: false
    }, {
        option: 'system-object-report',
        type: 'Boolean',
        description: 'Generates a text file that contains HTML with a table of system objects',
        required: false
    }, {
        option: 'build-report',
        type: 'Boolean',
        description: 'Generates a text file that contains HTML with a table of system objects',
        required: false
    }, {
        option: 'atlassian-username',
        type: 'String',
        description: 'A valid Atlassian user name. (used for reports)',
        required: false
    }, {
        option: 'atlassian-api-key',
        type: 'String',
        description: 'A valid Atlassian API key. (used for reports)',
        required: false
    }, {
        option: 'confluence-space-key',
        type: 'String',
        description: 'A valid Confluence Space Key. (used for reports)',
        required: false
    }, {
        option: 'confluence-system-objects-page',
        type: 'String',
        description: 'A valid Confluence Page Title for the System Object Reports.',
        required: false
    }, {
        option: 'confluence-build-reports-page',
        type: 'String',
        description: 'A valid Confluence Page Title for the Build Reports',
        required: false
    }, {
        option: 'confluence-base-url',
        type: 'String',
        description: 'The base URL for the Confluence Space where reports will be posted.',
        required: false,
        default: 'https://lyonscg.atlassian.net/wiki'
    }, {
        option: 'confluence-expand-macro-id',
        type: 'String',
        description: 'A valid macro ID for the "expand" macro in Confluence. This is used in the Build Reports.',
        required: false,
        default: 'fdf003e7-3808-4493-9455-9252b3a56b4c'
    }, {
        option: 'clean',
        type: 'Boolean',
        description: 'Clean project of all build artifacts',
        required: false
    }]
};
