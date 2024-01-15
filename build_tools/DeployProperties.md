# Deployment Build Properties

Below is a list of the properties that can be used as part of the build process. These properties can be defined in the Jenkins Ant properties section:

## Build Settings

> **buildVersion** - the code version to use during deployment. Uses the Jenkins build date by default.

> **versionCartridgeName** - the cartridge name that will contain the version.properies that will be replaced by Jenkins. This prints the build number in the html title tag. Please note that the file is completely overwritten and the only contents are "global.version.number={buildVersion}". You will need to make sure that "global.site.name" is still defined in a cartridge to the left of the cartridge name defined here. For example, set **versionCartridgeName** to "app_lyonscg_mfra" and make sure that "org_organizationid_mfra" has overwritten/contains "global.site.name"


## Two Factor Authentication Settings

> **twoFactorp12** - path to the file that contains the key used for authentication.

> **twoFactorPassword** - password to use with the key file.

> **selfSigned** - allows for two factor auth to work with self-signed cert. Possible options are: 'true' or 'false' (without quotes).


## SFCC Settings

> **user** - username used to log into the SFCC instances. ( **Required** )

> **password** - password used to log into the SFCC instances. ( **Required** )

> **hostname** - comma separated list of instances to upload the code to (e.g. lyons1.evaluation.dw.demandware.net,lyons2.evaluation.dw.demandware.net). ( **Required** )

> **activationHostname** - comma separated list of instances to activate the code on (e.g. lyons1.evaluation.dw.demandware.net,lyons2.evaluation.dw.demandware.net). ( **Required** )

## Data Deploy

> **dataBundle** - the data bundle name to deploy to the SFCC instances (e.g. core). ( **Required** )