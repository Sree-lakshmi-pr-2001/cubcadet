# LYONSCG Build Tools

## Installation and Usage

You can install the dependencies for these build tools using the following command in the project root directory

```sh
npm install
```

In order for all commands to work verify that:

* There is a valid `dw.json` file in the `build_tools` directory. See the `dw.json.example` in the `build_tools` directory  
for an example of a valid file.
* There is a `cartridges` top level folder that contains your cartridge(s).
* The `sites` array within the root `package.json` is configured correctly.  
  See  the **Sites and Cartridge Path Configuration** section below.
* Your `package.json` file contains `browserslist` key that specifies which browsers you are targeting,  
  to compile SCSS files with correct prefixes. See https://github.com/ai/browserslist for more details


## Upload

It is **highly** recommended that you use VS Code's Prophet Debugger extension or Eclipse's Digital Server connection  
for auto-upload of files; however, these upload scripts can be used if you choose to develop outside of these IDEs.  
If you'd like information on how to setup VS Code and the Prophet Debugger extension for SFCC development see [Visual Studio Code - SFCC](https://lyonscg.atlassian.net/wiki/spaces/Intranet/pages/206670879/Visual+Studio+Code+-+SFCC)


### Upload a file

```sh
npm run upload ${filepath}

# example
npm run upload cartridges/app_lyonscg_mfra/cartridge/client/default/js/main.js
```

### Upload a cartridge

```sh
npm run uploadCartridge ${cartridgeName}

# example
npm run uploadCartridge app_lyonscg_mfra
```

### Upload all cartridges

Upload all cartridges specified in the `sites` array in the root `package.json`

```sh
npm run deployCartridges
```

This script also supports passing `dw.json` properties as command line arguments (these arguments will only be used if  
there is not a `dw.json` in the `build_tools` directory)

```sh
npm run deployCartridges -- --username=${username} --password=${password} --hostname=${hostname} --activationHostname=${activationHostname} --code-version=${versionname}

#example
npm run deployCartridges -- --username=username --password=password --hostname=dev01-na01-hostname.demandware.net --activationHostname=dev01-na01-hostname.demandware.net --code-version=version01
```


## Data Deployment

```sh
npm run deploy
```

This script also supports passing `dw.json` properties as command line arguments (these arguments will only be used if  
there is not a `dw.json` in the `build_tools` directory)

```sh
npm run deploy -- --username=${username} --password=${password} --hostname=${hostname} --data-bundle=${bundlename}

#example
npm run deploy -- --username=username --password=password --hostname=dev01-na01-hostname.demandware.net --data-bundle=core
```


## Compile

Build environment variables and compilation settings can be set by the `buildEnvironment` object in root `package.json`.  
See the **Build Envrionment Variables** section below. 

### Compiling for Development

#### Scss
```sh
npm run compile:scss
```

##### JS
```sh
npm run compile:js
```

#### Watch

This script will automatically re-compile any changes made to JS or Scss files. Utilizing the watcher significantly  
reduces compile times; therefore, it is recommended that you run the watcher in the background while working on a  
front-end development task.
```sh
npm run watch
```


### Compiling for Production

These scripts minify and optimize assets for Production builds.

#### Scss
```sh
npm run compile:scss:prod
```

#### JS
```sh
npm run compile:js:prod
```


## Linting

The linting of client-side Js files, server-side Js files, Scss files, JSON files, and build tools JS files is supported.  
The script accepts an array of positional arguments. If no arguments are provided, all linting routines will run.  
The following values for `type` (as seen below) are valid: client-js, server-js, scss, json, build-tools
```sh
npm run lint ${type1} ${type2} ${typeN}

# examples
npm run lint

npm run lint client-js scss json
```


## Unit Tests

### Run Unit Tests

```
npm run test
```

### Run Unit Tests with Coverage Report

```sh
npm run cover
```


## Scaffolding 

### Create a New Cartridge

```sh
npm run createCartridge ${cartridgeName}

# example 
npm run createCartridge plugin_myplugin
```


## Sites and Cartridge Path Configuration

The compiler and other build tools scripts are dependent on the `sites` array defined in the root `package.json`.  
This `sites` array defines the sites within the project and the cartridge path of each site. 

Following SFCC convention, cartridges at the beginning of the `cartridges` array take precendence over the cartridges   
at the end of the array. 

Each cartridge object is required to have an `alias` and `name` property specified. The `name` property must match the  
cartridge's folder name. The `alias` property may be any short-hand name to represent the cartridge.

Each site needs to have exactly one cartridge with an `alias` set to "site". This determines the output location of the  
static folder that contains the compiled JS and Css.

An example of the `sites` array is provided below:

```json
{
  "sites": [
  {
    "cartridges": [
      {
        "alias": "site",
        "name": "site_siteid_mfra"
      },
      {
        "alias": "org",
        "name": "org_organizationid_mfra"
      },
      {
        "alias": "lyonscg",
        "name": "app_lyonscg_mfra"
      },
      {
        "alias": "base",
        "name": "app_storefront_base"
      }
    ]
  }
}
```


## Overriding Client-side SCSS and JS Files

### JS Include Path Example
The SFRA builders work differently than LYONSCG Gulp builders. When overriding JS files, you will need to include the  
correct path to JS module(s) if the module is not in the same cartridge as the overriden file. For example if you've  
pulled `main.js` into your org_organizationid_mfra cartridge and `main.js` includes the `util.js` module and the `util.js`  
module still lives in app_storefront_base, your path would look like this where `base` is the alias defined for  
app_storefront_base cartridge

```js
var processInclude = require('base/util');
```

## SCSS Include Path Example
SCSS paths will work similar to the JavaScript paths above. If you are importing a file that does not live in the same  
cartridge as the file you are working on, you will need to set the alias for the cartridge where the file exists.  
For example, if `homePage.scss` needs to include the `categoryTiles.scss` from app_storefront_base, it would look like this  
where `base` is the alias defined for app_storefront_base cartridge.

```scss
@import "~base/components/categoryTiles";
```


## Build Envrionment Variables

Environment variables and flags are located in the "buildEnvironment" object in the root package.json file

The "development" settings object allows developers to change build configuration during development tasks.

The "production" settings object should only be modified by the TA, TL, or other lead developer designated to do  
production builds on Jenkins.

Name | Description | Accepted Values
--- | --- | --- | ---
mode | Set the build / compilation mode | "development", "production" |
verbose | Verbose logging | "true", "false" |
cssSourceMaps | CSS source mapping | "true", "false" |
cssAutoPrefixer | Automatically add vendor prefixes to CSS rules  | "true", "false" |
cssLinting | Lint client-side Scss files during compilation | "true", "false"
jsSourceMaps | JS source mapping | "true", "false" |
jsLinting | Lint client-side JS files during compilation | "true", "false"
notifications | Native system notifications for compiler events | "true", "false" |

### Performance Considerations

- **mode**: Setting to "development" will significantly reduce compile times as this tells webpack when / how to use its built-in optimizations.
- **cssSourceMaps**: If your development task doesn't require the use of css source maps, consider disabling them. This will significantly reduce compile times.
- **cssAutoPrefixer**: Adding vendor prefixes for CSS rules to ensure stable browser support may not be needed while in development. Disabling this will reduce compile times.
- **jsSourceMaps**: If your development task doesn't require the use of js source maps, consider disabling them. This will significantly reduce compile times.


## Help and Troubleshooting

Running `node build_tools/build --help` from the root of the project with generate help messaging regarding the scripts and allowed arguments.

### My Js and/or Scss isn't generating compiled files

- If you manually touched the static folder, it's possible that the compiler's cache was not properly invalidated.  
  Delete the `.cache-loader` folder in the root of the project to empty the cache.
- Ensure that you have the correct configuration of the "sites" array in the package.json. The compiler is dependent on the cartridge path.
- SCSS partials (any file that begins with an underscore i.e `_productCard.scss` ) are not compiled to stand-alone  
  CSS files. SCSS partials are meant to be "@imported" into other non-partial SCSS files.
- Any JS file placed in a sub-directory of the client/default/js directory  
  (i.e. `app_lyonscg_mfra/cartridge/client/default/js/product/base.js`) are not compiled to stand-alone JS files.  
  These files are meant to be require()'d by files in the `client/default/js` directory.


# Setting up the deployment project in Jenkins

## Note: This guide assumes that the Jenkins server has already been set up by the OSC team

### Add the new project to the Jenkins server

  On the Jenkins server, you will start at the dash board and it should look something like this:

  ![Jenkins Dashboard][jenkins-dashboard]

  [jenkins-dashboard]: images/jenkins-dashboard.png

  Please choose the "New Item" link in the top left to continue

  On the "New Item" page you will have several options to choose from. You should see a screen similar to the one below:

  ![Jenkins New Item][jenkins-new-item]

  [jenkins-new-item]: images/jenkins-new-item.png

  If this is a new server with no projects on it, please use the "Freestyle Project" option. Otherwise, if this server already has several projects setup it may be faster to use the "Copy existing Item" option to reduce setup time. This option will copy over all of the settings from the chosen project into your new project. After choosing one of these options make sure to enter a name for your project in the "Item name" field, preferably using dashes instead of spaces between words. After this click the "OK" button at the bottom of the form.

  On the next page you should see a screen similar to the one below:

  ![Jenkins Project Configuration][jenkins-project-config]

  [jenkins-project-config]: images/jenkins-project-config.png

  To continue the setup please choose either the "Multiple SCMs" option for Git repositories or the "Subversion" option for SVN repositories.

  If you are setting up Git repositories please read the following instructions. If not please skip below to the section on Subversion.

### Git Repository Setup

  To setup a Git repositories in Jenkins for use with our build script please choose the "Git" option under "Source Code Management"

  When the option has been chosen you should see a screen similar to the one below:

  ![Git Options][git-options]

  [git-options]: images/git-options.png

  Add the SSH Git url (e.g. git@bitbucket.org:lyonsconsultinggroup/reference-application-sfra.git) to the "Repository URL" field

  Then click the "Add" button next to the "Credentials" drop down to add a set of credentials to log into the Git server

  In the field "Branch Specifier (blank for 'any')" specify the branch name if you decide to use one other than master (e.g. */develop, */release, etc.)

### Build Options Setup

  To setup the build options to allow for deployment to the servers scroll to the bottom of the Jenkin's project settings. There is a section called "Build" where the final part of the setup will occur.

  In the Build section click th "Add build step" button and select "Invoke Ant"

  ![Invoke Ant][invoke-ant]

  [invoke-ant]: images/jenkins-invoke-ant.png

  Enter build options:

  ![Build Options][build-options]

  [build-options]: images/build-options.png

  This section will allow you to enter the build file and the properties for the build.

  In the "Targets" field, enter all Ant targets you wish to use (e.g. deploy, deploy-data, system-object-reports)

  In the "Build File" field enter the path relative to the Jenkins workspace to your deployment script. This should be similar to what is in the path in the image above.

  In the "Properties" field enter all of the properties needed for this project. For an explanation of all of the properties please refer to the [Deploy Properties](DeployProperties.md) document.

  After all of the properties have been entered click the "Apply" button at the bottom of the screen. This will save your project options.

  To test out the build, scroll to the top of the configuration and click the "Build Now" option in the upper left. If everything was setup correctly the build should complete successfully.
  
#### Staging build options

  In addition to the other properties above, there are 2 additional options for the Staging build to support 2-factor authentication:
  
  `twoFactorp12=/var/lib/jenkins/keys/jenkins.p12`
  
  `twoFactorPassword=YOURPASS`
  
  These can be set after generating and uploading the p12 file to Jenkins.
  
  Also, the `hostname` property should begin with 'cert' like 'cert.staging.na01.orgname.demandware.net'. The `activationHostname` will **not** use the prefix (ex. 'staging-na01-orgname.demandware.net').
  
  
### Examples

Uploading individual cartridges to your sandbox/instance

1. Configure dw.json file with your username, password, activation instance (sandbox URL) and currently active code version
2. Configure the package.json file at the root directory level for the cartridges you want to upload (see "uploadCartridge")
3. Navigate to the command line tool (CMD for Windows, Terminal for OSX)
4. OSX/MAC
		"cd <path to your build tools>"   Sample -> cd /Users/testuser/git/reference-application-sfra
		"npm run uploadCartridge"  
		
### Notes

The builders.xml Ant task includes the 'run npm install.xml' task that utilizes npm to automatically install the package.json specified node modules. The installation task may install tens of thousands of files and thus, on initial run, may take as long as ten minutes to complete. Subsequent runs are exponentially quicker as npm will only update those modules requiring an update. Additionally, the 'run npm install.xml' Ant task may be run on independently of builders.xml
