import com.cwctravel.hudson.plugins.extended_choice_parameter.ExtendedChoiceParameterDefinition
import org.jenkinsci.plugins.workflow.support.steps.build.RunWrapper
/**
 * Testing
 */

/**
 * Contains the Jenkins build environment
 */
class Script {

    /* groovylint-disable-next-line FieldTypeRequired, NonFinalPublicField */
    public static environment

}

Script.environment = this

/**
 * Contains all of the logic and settings for the Jenkins build
 */
class JenkinsBuild {

    /**
     * AH Teams build notification channel
     */
    /* groovylint-disable-next-line LineLength */
    public static final String TEAMS_WEBHOOK_URL = 'https://outlook.office.com/webhook/d6a28b22-baec-4127-a227-8f625788815a@76a2ae5a-9f00-4f6b-95ed-5d33d77c4d61/IncomingWebhook/e1d7c30e22ae4e5785ed92e0ce62d759/d96976e5-3a63-4fe4-8a18-d89fc7c6e6c2'

    /**
     * Pager Duty integration key
     * The '835c' key is a generic key - replace it with the change notification
     * integration key for your project
     */
    public static final String PD_INTEGRATION_KEY = '4516f7772ce54dcdafeb6a388519835c'

    /**
     * Basic Kubernetes container used for most pipeline steps
     */
    public static final String BASIC_CONTAINER = 'mtd-sfra-builder'

    /**
     * Kubernetes container used to run SonarQube
     */
    public static final String SONARQUBE_CONTAINER = 'mtd-sonar'

    /**
     * Kubernetes container used to run the headless Chromium browser for generating the critical path CSS
     */
    public static final String HEADLESS_CHROME_CONTAINER = 'mtd-headless-chrome'

    /**
     * Location of the Chromium browser install on the Jenkins server
     */
    public static final String CHROME_LOCATION = '/usr/bin/chromium-browser'

    /**
     * Retrieves the git repo name from the given git URL
     * @param gitUrl The URL of the git repository
     * @return The git repo's name
     */
    static String getGitRepoName(String gitUrl) {
        String repoName = gitUrl.tokenize('/')[-1]
        return repoName.replaceAll('.git', '')
    }

    /**
     * Retrieves the gitflow branch type
     * @param branchName Name of the branch to retrieve the type from
     * @return The given git branch's type
     */
    static String getBranchType(String branchName) {
        String branchType = branchName.tokenize('/')[0]
        return branchType
    }

    /**
     * Returns code version identifier as sanitized branch name
     * @param branchName Name of current branch
     * @return String of sanitized branch name
     */
    static String codeVersionFromBranchName(String branchName){
        String codeVersion = branchName.replaceAll('/','-').replaceAll('%2F','-').replaceAll('%2f','-')
        return codeVersion
    }
    /**
     * Retrieves the project's workspace in Jenkins
     * @param projectWorkingDirectory The project's working directory in Jenkins
     * @return The current Jenkins workspace
     */
    static String getWorkspace(String projectWorkingDirectory) {
        return projectWorkingDirectory.replace('%2F', '_') + '_alt'
    }

    /**
     * Copies the build log into the build-console.log file
     */
    static void getConsoleLog() {
        Script.environment.sh (
            script: "cat ${Script.environment.JENKINS_HOME}/jobs/${Script.environment.JOB_NAME}/builds/${Script.environment.BUILD_NUMBER}/log >> build-console.log"
        )
    }

    /**
     * Prepares the instance of the container
     *  - set up ~/.ssh/config so ssh will accept new host keys without prompt
     */
    static void prepEnvironment() {
        Script.environment.sh (
        """id
        if [ ! -d ~/.npm ]; then
            mkdir ~/.npm
        fi
        #chown -R jenkins:jenkins ~/.npm
        mkdir -p ~/.ssh
        chmod 0700 ~/.ssh
        if [ ! -f ~/.ssh/config ]; then
            #chown -R jenkins:jenkins ~/.ssh
            touch ~/.ssh/config
            chmod 0600 ~/.ssh/config
            cat << EOF > ~/.ssh/config
Host *
StrictHostKeyChecking no
EOF
        fi
        cat ~/.ssh/config
        ssh-keyscan -t rsa bitbucket.org > ~/.ssh/known_hosts
        ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts
        if [ ! -d ~/.config ]; then
            mkdir -p ~/.config
            #chown jenkins:jenkins ~/.config
            chmod 700 ~/.config
        fi
        # set up npm registry
        #npm set registry https://nexus.lcgosc.com/repository/npm_proxy/
        #npm audit --registry=https://registry.npmjs.org
        """
        )
    }

    /**
     * Sends the notification to the Teams webhook
     * @param currentBuild Current Jenkins build
     * @param message Message to send to the Teams webhook
     */
    static void sendTeamsNotification(RunWrapper currentBuild, String message) {
        Script.environment.office365ConnectorSend (
            webhookUrl: JenkinsBuild.TEAMS_WEBHOOK_URL,
            status: currentBuild.currentResult,
            message: message
        )
    }

    /**
     * Generates the Critical Path CSS using the given Jenkins parameters
     * @param params The Jenkins parameters
     */
    static void generateCriticalPathCSS(params) {
        Script.environment.withCredentials([
            Script.environment.usernamePassword(
                credentialsId: params.storefrontCredentials,
                usernameVariable: 'storefrontUser',
                passwordVariable: 'storefrontPass'
            )
        ]) {
            if ((params.hostname.contains('staging') || params.forceCriticalCSSGeneration) && params.hostname.length() > 0) {
                String cpcHostname = ''
                String[] hosts = params.hostname.split(',')

                if (params.hostname.contains('staging')) {
                    for (int i = 0; i < hosts.size(); i++) {
                        if (hosts[i].contains('staging')) {
                            cpcHostname = hosts[i]
                        }
                    }
                } else {
                    cpcHostname = hosts[0]
                }

                Script.environment.sh (
                    script: """
                        node build_tools/lib/compile/critical-path-css \
                        --hostname=${cpcHostname} \
                        --chrome-location=${JenkinsBuild.CHROME_LOCATION} \
                        --storefront-user=${Script.environment.storefrontUser} \
                        --storefront-pass=${Script.environment.storefrontPass}
                    """
                )

                JenkinsBuild.deployCartridges(params)
            } else {
                Script.environment.sh (
                    script: """
                        echo "Skipping Critical Path CSS generation"
                    """
                )
            }
        }
    }

    /**
     * Deploys the cartridges using the given Jenkins parameters
     * @param params The Jenkins parameters
     */
    static void deployCartridges(params, codeVersion, buildNumber) {
        Script.environment.withCredentials([
            Script.environment.usernamePassword(
                credentialsId: params.deployCredentials,
                usernameVariable: 'clientId',
                passwordVariable: 'clientSecret'
            ),
            Script.environment.certificate(
                credentialsId: params.certificateCredentials,
                keystoreVariable: 'twoFactorp12',
                passwordVariable: 'twoFactorPassword'
            )
        ]) {
            if (params.deployCode) {
                JenkinsBuild.sendPDChangeNotification(JenkinsBuild.PD_INTEGRATION_KEY, "Deploying to ${params.hostname}")
                // TODO: refactor so not using string interpolation (use single quotes)
                String deployCartridgesCommand = """if [ -f build_tools/dw.json ]; then cp -f build_tools/dw.json ./; fi; \
                node build_tools/build --deployCartridges \
                    --hostname=${params.hostname} \
                    --username=${Script.environment.clientId} \
                    --password="${Script.environment.clientSecret}" \
                """

                if (params.hostname.indexOf('staging') >= 0) {
                    deployCartridgesCommand = """${deployCartridgesCommand} \
                        --cert-hostname=${params.twoFactorCertHostname} \
                        --p12="${Script.environment.twoFactorp12}" \
                        --passphrase="${Script.environment.twoFactorPassword}" \
                        --self-signed=${params.selfSigned} \
                    """
                }
                if (params.activationHostname.length() > 0) {
                    deployCartridgesCommand = """
                        ${deployCartridgesCommand} \
                        --activation-hostname=${params.activationHostname} \
                    """
                }

                if (params.codeVersion.length() > 0) {
                    Date now = new Date()
                    codeVersion = "build-" + now.format("yyyyMMdd") + "-" + buildNumber + "-branch-" + codeVersion 

                    deployCartridgesCommand = """
                        ${deployCartridgesCommand} \
                        --code-version=${codeVersion} \
                        --version-cartridge-name=${params.versionCartridgeName} \
                    """
                } else {
                    Date now = new Date()
                    codeVersion += "-" + now.format("ddMMyyyyHHmmss")
                    deployCartridgesCommand = """
                        ${deployCartridgesCommand} \
                        --code-version=${codeVersion} \
                        --version-cartridge-name=${codeVersion} \
                    """
                }

                deployCartridgesCommand = deployCartridgesCommand.stripIndent()

                Script.environment.sh (
                    script: """
                        echo 'Deploying cartridges with: '
                        ${deployCartridgesCommand}
                    """
                )
            } else {
                Script.environment.sh (
                    script: """
                        echo 'Skipping deployment of code'
                    """
                )
            }
        }
    }

    /**
     * Deploys a data bundle using the given Jenkins parameters
     * @param params The Jenkins parameters
     */
    static void deployData(params, codeVersion) {
        Script.environment.withCredentials([
            Script.environment.usernamePassword(
                credentialsId: params.deployCredentials,
                usernameVariable: 'clientId',
                passwordVariable: 'clientSecret'
            ),
            Script.environment.certificate(
                credentialsId: params.certificateCredentials,
                keystoreVariable: 'twoFactorp12',
                passwordVariable: 'twoFactorPassword'
            )
        ]) {
            String deployDataCommand = """if [ -f build_tools/dw.json ]; then cp -f build_tools/dw.json ./; fi; \
            node build_tools/build --deploy-data \
                --hostname=${params.hostname} \
                --client-id=${Script.environment.clientId} \
                --client-secret="${Script.environment.clientSecret}" \
                --data-bundle=${params.dataBundle} \
            """
            if (params.hostname.indexOf('staging') >= 0) {
                deployDataCommand = """${deployDataCommand} \
                --cert-hostname=${params.twoFactorCertHostname} \
                --self-signed=${params.selfSigned} \
                --p12=${Script.environment.twoFactorp12} \
                --passphrase="${Script.environment.twoFactorPassword}" \
            """
            }

            if (params.activationHostname.length() > 0) {
                deployDataCommand = """${deployDataCommand} \
                    --activation-hostname=${params.activationHostname} \
                """
            }

            if (params.codeVersion.length() > 0) {
                deployDataCommand = """${deployDataCommand} \
                    --code-version=${params.codeVersion} \
                    --version-cartridge-name=${params.versionCartridgeName} \
                """
            } else {
                deployDataCommand = """${deployDataCommand} \
                    --code-version=${codeVersion} \
                    --version-cartridge-name=${codeVersion} \
                """
            }

            deployDataCommand = deployDataCommand.stripIndent()

            Script.environment.sh (
                script: """
                    echo "Skipping Data Deploy..."
                """
            )
        }
    }

    /**
     * Sends a Pager Duty notification
     * @param integrationKey Pager Duty integration key
     * @param statusMessage Message to send to Pager Duty
     */
    static void sendPDChangeNotification(String integrationKey, String statusMessage) {
        Date now = new Date()
        String dateStamp = now.format("yyyy-MM-dd'T'HH:mm:ss.sss'Z'", TimeZone.getTimeZone('UTC'))
        String webhookURL = 'https://events.pagerduty.com/v2/change/enqueue'
        String webhookPayload = '{"payload": { "summary": "' + statusMessage + '", "timestamp": "' + dateStamp + '", "source": "' + Script.environment.BUILD_URL + '" }, "routing_key": "' + integrationKey + '" }'
        println("Data: " + webhookPayload.toString())
        def response = Script.environment.httpRequest consoleLogResponseBody: true, customHeaders: [[maskValue: false, name: 'content-type', value: 'application/json']], httpMode: 'POST', requestBody: webhookPayload, responseHandle: 'NONE', url: webhookURL, validResponseCodes: '200:202', wrapAsMultipart: false
        println("Status: " + response.status)
    }

}

def scmUrl = scm.userRemoteConfigs[0].url
def repoName = JenkinsBuild.getGitRepoName(scmUrl)
def branchName = JenkinsBuild.getBranchType("${BRANCH_NAME}")
def codeVersion = JenkinsBuild.codeVersionFromBranchName("${BRANCH_NAME}")
def branch = "${BRANCH_NAME}"
def buildNumber = "${BUILD_NUMBER}"
String serverType = ""
String hostName = "development-na01-mtd.demandware.net/"; // change to development after successful testing
String bundle = "core-dummy"; // change to real bundle name
String deployCredentials = "mtd-sfcc-instance-creds";
boolean defaultDeployData = false;
boolean defaultDeployCode = false;
if (branch.contains('release/')) {
    serverType = "Staging";
    hostName = "staging-na01-mtd.demandware.net/";
    // codeVersion = "release";
    bundle = "core-staging-dummy";
    deployCredentials = "mtd-sfcc-instance-creds";
} else if (branch.contains('develop')) {
    serverType = "Development"
    // codeVersion = "develop";
}

pipeline {
    agent {
        kubernetes {
            cloud 'kubernetes'
            label JenkinsBuild.BASIC_CONTAINER
            //idleMinutes 5
            yamlFile 'builderpod.yml'
            slaveConnectTimeout 300
        }
    } // end agent

    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '4'))
        lock resource: 'sfcc-sfra-mtd-build'
        office365ConnectorWebhooks([[
            startNotification: true,
            notifySuccess: true,
            notifyFailure: true,
            url: JenkinsBuild.TEAMS_WEBHOOK_URL
        ]])
    }

    environment {
        BUILD_WORKSPACE = JenkinsBuild.getWorkspace(pwd())
        GIT_URL = "${scmUrl}"
        PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 1
        PUPPETEER_EXECUTABLE_PATH = "${JenkinsBuild.CHROME_LOCATION}"
        DEBUG = true
        SFCC_ALLOW_SELF_SIGNED = true
        //NODE_TLS_REJECT_UNAUTHORIZED = 0
    }

    parameters {
        string(
            name: 'codeVersion',
            description: 'Version to set in the version.properties file',
            defaultValue: codeVersion
        )
        string(
            name: 'codeVersionCartridge',
            description: 'Cartridge where the version.properties file will be stored',
            defaultValue: 'org_mtd'
        )
        string(
            name: 'storefrontCredentials',
            description: 'Jenkins Credentials to use to access password protected storefronts',
            defaultValue: 'mtd-sfcc-storefront-creds'
        )
        string(
            name: 'deployCredentials',
            description: 'Jenkins Credentials to use to deploy to standard servers',
            defaultValue: deployCredentials
        )
        string(
            name: 'certificateCredentials',
            description: 'Jenkins Credentials to use to deploy to two factor servers',
            defaultValue: 'mtd-sfcc-certificate-creds'
        )
        extendedChoice(
            name: 'hostname',
            type: ExtendedChoiceParameterDefinition.PARAMETER_TYPE_CHECK_BOX,
            description: 'Sandbox URL(s) used to deploy code and data',
            multiSelectDelimiter: ',',
            value: """
                demo-na01-mtd.demandware.net, \
                development-na01-mtd.demandware.net, \
                cert.staging.na01.mtd.demandware.net
            """,
            defaultValue: hostName
        )
        extendedChoice(
            name: 'activationHostname',
            type: ExtendedChoiceParameterDefinition.PARAMETER_TYPE_CHECK_BOX,
            description: 'Sandbox URL(s) on which the deployed code is activated',
            multiSelectDelimiter: ',',
            value: """
                demo-na01-mtd.demandware.net, \
                development-na01-mtd.demandware.net, \
                staging-na01-mtd.demandware.net
            """,
            defaultValue: hostName
        )
        string(
            name: 'twoFactorCertHostname',
            description: 'Staging URL used when using a certificate for two factor authentication',
            defaultValue: 'cert.staging.na01.mtd.demandware.net'
        )
        extendedChoice(
            name: 'dataBundle',
            type: ExtendedChoiceParameterDefinition.PARAMETER_TYPE_RADIO,
            description: 'Data bundle to use when deploying the data to an instance',
            value: """
                core, \
                core-config-staging, \
                dwr_data_test, \
                config, \
                data, \
                core-config, \
                core-config-data, \
                core-config-data-static, \
                static, \
                phase-2-release-1
            """,
            defaultValue: bundle
        )
        booleanParam(
            name: 'deployCode',
            description: 'Determines if the code should be deployed to the given deploy target',
            defaultValue: true
        )
        booleanParam(
            name: 'deployData',
            description: 'Determines if the data should be deployed to the given deploy target',
            defaultValue: false
        )
        booleanParam(
            name: 'selfSigned',
            description: 'Determines if the p12 file is self signed',
            defaultValue: true
        )
        booleanParam(
            name: 'forceCriticalCSSGeneration',
            description: 'Forces the Critical Path CSS to be generated regardless of instances selected (warning: this will force the first instance selected to be used)',
            defaultValue: false
        )
    }

    stages {
        stage('set base env') {
            steps {
                script {
                    JenkinsBuild.sendTeamsNotification(currentBuild, "Starting build ${BUILD_NUMBER}")
                    echo repoName
                    echo branchName

                    container(JenkinsBuild.BASIC_CONTAINER) {
                        JenkinsBuild.prepEnvironment()
                    }
                }
            }
        }
        // **********************************************
        // *** HERE BEGINS THE SFCC BUILD STEPS.      ***
        // *** IF NECESSARY, MAKE ANY CHANGES IN THIS ***
        // *** SECTION TO MODIFY THE BUILD PROCESS    ***
        // *** REQUIRED FOR YOUR PROJECT.             ***
        // **********************************************

        stage('SFCC Build Stage') {
            stages {
                stage('NPM install') {
                    steps {
                        container(JenkinsBuild.BASIC_CONTAINER) {
                            // the package.json uses a private repo, so we have to use ssh-agent to pass
                            // credentials to the private repo during the npm install
                            script {
                                sh (
                                    script:""" 
                                        npm install dwdav
                                        npm install
                                    """
                                )
                            }
                        }
                    }
                }

                stage('Test Coverage') {
                    steps {
                        container(JenkinsBuild.BASIC_CONTAINER) {
                            script {
                                sh (
                                    script:"""
                                        #echo 'Running test coverage...'
                                        echo 'NOT Running test coverage...'
                                        #npm run cover
                                    """
                                )
                            }
                        }
                    }
                }

                stage('Code Linting') {
                    steps {
                        container(JenkinsBuild.BASIC_CONTAINER) {
                            script {
                                sh (
                                    script: """
                                        echo 'Skipping Linting...'
                                        #npm run lint
                                    """
                                )
                            }
                        }
                    }
                }

                stage('Compile SVGs') {
                    steps {
                        container(JenkinsBuild.BASIC_CONTAINER) {
                            script {
                                sh (
                                    script: """
                                        echo "Skipping Compile SVGs..."
                                        #npm run compile:svg
                                    """
                                )
                            }
                        }
                    }
                }

                stage('Compile Fonts') {
                    steps {
                        container(JenkinsBuild.BASIC_CONTAINER) {
                            script {
                                sh (
                                    script: """
                                        echo 'Compiling Fonts...'
                                        npm run compile:fonts
                                    """
                                )
                            }
                        }
                    }
                }

                stage('Compile CSS') {
                    steps {
                        container(JenkinsBuild.BASIC_CONTAINER) {
                            script {
                                sh (
                                    script: """
                                        echo 'Compiling CSS...'
                                        npm run lint scss -- --lint-no-cache
                                        npm run compile:scss:prod
                                    """
                                )
                            }
                        }
                    }
                }

                stage('Compile JavaScript') {
                    steps {
                        container(JenkinsBuild.BASIC_CONTAINER) {
                            script {
                                sh (
                                    script: """
                                        echo 'Compiling JavaScript'
                                        npm run lint client-js -- --lint-no-cache
                                        npm run compile:js:prod
                                    """
                                )
                            }
                        }
                    }
                }

                stage('Upload cartridges to dev environment(s)') {
                    when {
                        anyOf {
                            expression { branch =~ /^release\/.*/ }
                            expression { branch =~ /^release/ }
                            expression { branch =~ /^develop/ }
                            expression { branch =~ /^hotfix\/.*/ }
                            expression { branch =~ /^feature\/.*/ }
                        }
                    }
                    steps {
                        container(JenkinsBuild.BASIC_CONTAINER) {
                            script {
                                JenkinsBuild.deployCartridges(params, codeVersion, buildNumber)
                            }
                        }
                    }
                }

                stage('Upload data to dev environment(s)') {
                    when {
                        anyOf {
                            expression { branch =~ /^release\/.*/ }
                            expression { branch =~ /^release/ }
                            expression { branch =~ /^develop/ }
                        }
                    }
                    steps {
                        container(JenkinsBuild.BASIC_CONTAINER) {
                            script {
                                JenkinsBuild.deployData(params, codeVersion)
                            }
                        }
                    }
                }
/*
                stage('Generate Critical Path CSS') {
                    steps {
                        container(JenkinsBuild.HEADLESS_CHROME_CONTAINER) {
                            script {
                                JenkinsBuild.generateCriticalPathCSS(params)
                            }
                        }
                    }
                }
*/
                stage('NPM Audit') {
                    steps {
                        container(JenkinsBuild.BASIC_CONTAINER) {
                            script {
                                String jobName = "${JOB_NAME}".replace('/', '-').replace('%2F', '-')
                                String npmAuditReportPath = "build_tools/artifacts/npm-audit-${jobName}-${BUILD_NUMBER}.txt"

                                sh (
                                    script: """
                                        npm audit --registry=https://registry.npmjs.org | tee ${npmAuditReportPath}
                                    """
                                )
                            }
                        }
                    }
                }

               stage('Run SonarQube') {
                    when {
                        anyOf {
                            expression { branch =~ /^release\/.*/ }
                            expression { branch =~ /^release/ }
                        }
                    }
                    steps {
                        container(JenkinsBuild.SONARQUBE_CONTAINER) {
                            script {
                                /* skip Sonar (for now)
                                sh (
                                    script: """
                                        export GIT_URL=${GIT_URL}
                                        mkdir -p ${HOME}/.ant/lib
                                        cp /usr/local/lib/sonarqube-ant-task.jar ${HOME}/.ant/lib/sonarqube-ant-task-1.jar
                                        ls -lah ${HOME}/.ant/lib
                                        ant -lib /usr/local/lib -buildfile "build_tools/run sonar.xml" sonar
                                    """
                                )
                                */
                                sh ( script: "echo skipping sonar for now")
                            }
                        }
                    }
                }

                stage('Post Project to SARMS') {
                    steps {
                        container(JenkinsBuild.BASIC_CONTAINER) {
                            script {
                                String sarmsUrl = 'https://sarms.lcgosc.com'
                                /* skip SARMS
                                sh (
                                    script: """
                                        node build_tools/util/sarms/postProjectToSARMS \
                                        --api-credentials-path build_tools/util/sarms/api_credentials.json \
                                        --sarms-server-url ${sarmsUrl} \
                                        --client-name ${repoName} \
                                        --platform-name "Salesforce Commerce Cloud SFRA" \
                                        --platform-news "https://xchange.demandware.com/community/developer/security-notifications" \
                                        --package-file package.json
                                    """
                                )
                                */
                                sh ( script: "echo skip SARMS")
                            }
                        }
                    }
                }

                stage('Archive Artifact') {
                    when {
                        anyOf {
                            expression { branch =~ /^release\/.*/ }
                            expression { branch =~ /^release/ }
                        }
                    }
                    steps {
                        container(JenkinsBuild.BASIC_CONTAINER) {
                            // archiveArtifacts artifacts: 'build_tools/deploy/output/*.zip', fingerprint: true
                            archiveArtifacts artifacts: 'build_tools/artifacts/*', allowEmptyArchive: true, defaultExcludes: true
                        }
                    }
                }
                stage('clean up') {
                    steps {
                        container(JenkinsBuild.BASIC_CONTAINER){
                            cleanWs notFailBuild: true, deleteDirs: true
                        }
                    }
                }
            } // end stages inside stage
        } // end stage
        // ******************************************
        // *** HERE ENDS THE SFCC BUILD STEPS.    ***
        // *** CONSULT WITH THE CICD TEAM BEFORE  ***
        // *** MODIFYING ANYTHING BELOW HERE.     ***
        // ******************************************
    } //end stages
    post {
        always {
            echo "we always do this step."
            /*
            JenkinsBuild.getConsoleLog()
            */
        }
        failure {
            script {
                JenkinsBuild.sendTeamsNotification(currentBuild, "Build ${BUILD_NUMBER} FAILED")

                if (params.deployCode) {
                    JenkinsBuild.sendPDChangeNotification(JenkinsBuild.PD_INTEGRATION_KEY, "Deployment to ${hostname} FAILED")
                }
            }
            /*container(JenkinsBuild.BASIC_CONTAINER) {
                archiveArtifacts artifacts: 'build_tools/deploy/output/*.zip', fingerprint: true, allowEmptyArchive: true
                archiveArtifacts artifacts: '/root/.npm/_logs/*.log', allowEmptyArchive: true, defaultExcludes: false
            }*/
            echo "it failed"
        }
        success {
            script {
                JenkinsBuild.sendTeamsNotification(currentBuild, "Build ${BUILD_NUMBER} SUCCEEDED")

                jobName = "${JOB_NAME}".replace('/', '-').replace('%2F', '-')
                if (params.deployCode) {
                    JenkinsBuild.sendPDChangeNotification(JenkinsBuild.PD_INTEGRATION_KEY, "Deployment to ${hostname} SUCCEEDED")
                }
            }
            /*
            nexusArtifactUploader (
                credentialsId: 'nexus_uadv',
                groupId: 'all',
                nexusUrl: 'nexus.lcgosc.com',
                nexusVersion: 'nexus3',
                protocol: 'https',
                repository: 'sfcc_uadv',
                version: "${BUILD_NUMBER}",
                artifacts: [
                    [artifactId: 'uadv-npm-audit-output',
                        classifier: '',
                        file: "build_tools/artifacts/npm-audit-${jobName}-${BUILD_NUMBER}.txt",
                        type: 'txt']
                    ]
            )
            */
            echo "it succeeded"
        }
    }
} // end pipeline

// TODO:
//  - test and retest multi-branch goodness