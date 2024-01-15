'use strict';

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

/**
 * Creates an account model for the current customer
 * @param {Object} req - local instance of request object
 * @returns {Object} a plain object of the current customer's account
 */
function getModel(req) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var AccountModel = require('*/cartridge/models/account');
    var AddressModel = require('*/cartridge/models/address');
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');

    var orderModel;
    var preferredAddressModel;

    if (!req.currentCustomer.profile) {
        return null;
    }

    var customerNo = req.currentCustomer.profile.customerNo;
    var customerOrders = OrderMgr.searchOrders(
        'customerNo={0} AND status!={1} AND status!={2}',
        'creationDate desc',
        customerNo,
        Order.ORDER_STATUS_REPLACED,
        Order.ORDER_STATUS_FAILED
    );

    var order = customerOrders.first();

    if (order) {
        var currentLocale = Locale.getLocale(req.locale.id);

        var config = {
            numberOfLineItems: 'single'
        };

        orderModel = new OrderModel(order, { config: config, countryCode: currentLocale.country });
    } else {
        orderModel = null;
    }

    if (req.currentCustomer.addressBook.preferredAddress) {
        preferredAddressModel = new AddressModel(req.currentCustomer.addressBook.preferredAddress);
    } else {
        preferredAddressModel = null;
    }

    return new AccountModel(req.currentCustomer, preferredAddressModel, orderModel);
}

/**
 * Checks if the email value entered is correct format
 * @param {string} email - email string to check if valid
 * @returns {boolean} Whether email is valid
 */
function validateEmail(email) {
    var regex = /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/;
    return regex.test(email);
}

server.get(
    'Show',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');
        var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
        var reportingURLs;

        var ContentMgr = require('dw/content/ContentMgr');
        var ContentModel = require('*/cartridge/models/content');
        var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

        var apiContent = ContentMgr.getContent('account-dashboard-metadata');
        if (apiContent) {
            var content = new ContentModel(apiContent, 'content/contentAsset');

            pageMetaHelper.setPageMetaData(req.pageMetaData, content);
            pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
        }

        // Get reporting event Account Open url
        if (req.querystring.registration && req.querystring.registration === 'submitted') {
            reportingURLs = reportingUrlsHelper.getAccountOpenReportingURLs(
                CustomerMgr.registeredCustomerCount
            );
        }

        var accountModel = getModel(req);
        res.render('account/accountDashboard', {
            account: accountModel,
            accountlanding: true,
            breadcrumbs: [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                }
            ],
            reportingURLs: reportingURLs
        });
        next();
    }, pageMetaData.computedPageMetaData
);

server.post(
    'Login',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');
        var Site = require('dw/system/Site');
        var Transaction = require('dw/system/Transaction');
        var URLUtils = require('dw/web/URLUtils');
        // var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
        // var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
        // var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

        var email = req.form.loginEmail;
        var password = req.form.loginPassword;
        var rememberMe = req.form.loginRememberMe
            ? (!!req.form.loginRememberMe)
            : false;
        var checkoutLogin = req.querystring.checkoutLogin;

        var customerLoginResult = Transaction.wrap(function () {
            var authenticateCustomerResult = CustomerMgr.authenticateCustomer(email, password);

            if (authenticateCustomerResult.status !== 'AUTH_OK') {
                var errorCodes = {
                    ERROR_CUSTOMER_DISABLED: 'error.message.account.disabled',
                    ERROR_CUSTOMER_LOCKED: 'error.message.account.locked',
                    ERROR_CUSTOMER_NOT_FOUND: 'error.message.login.form',
                    ERROR_PASSWORD_EXPIRED: 'error.message.password.expired',
                    ERROR_PASSWORD_MISMATCH: 'error.message.password.mismatch',
                    ERROR_UNKNOWN: 'error.message.error.unknown',
                    default: 'error.message.login.form'
                };

                var errorMessageKey = errorCodes[authenticateCustomerResult.status] || errorCodes.default;
                var errorMessage = Resource.msg(errorMessageKey, 'login', null);

                return {
                    error: true,
                    errorMessage: errorMessage,
                    status: authenticateCustomerResult.status,
                    authenticatedCustomer: null
                };
            }

            return {
                error: false,
                errorMessage: null,
                status: authenticateCustomerResult.status,
                authenticatedCustomer: CustomerMgr.loginCustomer(authenticateCustomerResult, rememberMe)
            };
        });

        if (customerLoginResult.error) {
            if (customerLoginResult.status === 'ERROR_CUSTOMER_LOCKED') {
                var HookMgr = require('dw/system/HookMgr');
                var Logger = require('dw/system/Logger');
                var Template = require('dw/util/Template');
                var HashMap = require('dw/util/HashMap');
                var objectForEmail = {
                    customer: CustomerMgr.getCustomerByLogin(email) || null
                };

                var context = new HashMap();
                Object.keys(objectForEmail).forEach(function (key) {
                    context.put(key, objectForEmail[key]);
                });

                var template = new Template('account/accountLockedEmail');
                var content = template.render(context).text;

                var hookID = 'app.mail.sendMail';
                if (HookMgr.hasHook(hookID)) {
                    HookMgr.callHook(
                        hookID,
                        'sendMail',
                        {
                            communicationHookID: 'account.lockedOut',
                            template: 'account/accountLockedEmail',
                            fromEmail: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
                            toEmail: email,
                            subject: Resource.msg('subject.account.locked.email', 'login', null),
                            messageBody: content,
                            params: context
                        }
                    );
                } else {
                    Logger.error('No hook registered for {0}', hookID);
                }
            }

            res.json({
                error: [customerLoginResult.errorMessage || Resource.msg('error.message.login.form', 'login', null)]
            });

            return next();
        }

        if (customerLoginResult.authenticatedCustomer) {
            res.setViewData({ authenticatedCustomer: customerLoginResult.authenticatedCustomer });
            res.json({
                success: true,
                redirectUrl: checkoutLogin
                ? URLUtils.url('Checkout-Begin').toString()
                        : URLUtils.url('Account-Show').toString()
            });

            req.session.privacyCache.set('args', null);
        } else {
            res.json({ error: [Resource.msg('error.message.login.form', 'login', null)] });
        }

        return next();
    }
);

server.post(
    'SubmitRegistration',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');
        var Site = require('dw/system/Site');
        var formErrors = require('*/cartridge/scripts/formErrors');

        var registrationForm = server.forms.getForm('profile');

        // form validation
        if (registrationForm.customer.email.value.toLowerCase()
            !== registrationForm.customer.emailconfirm.value.toLowerCase()
        ) {
            registrationForm.customer.email.valid = false;
            registrationForm.customer.emailconfirm.valid = false;
            registrationForm.customer.emailconfirm.error =
                Resource.msg('error.message.mismatch.email', 'forms', null);
            registrationForm.valid = false;
        }

        if (registrationForm.login.password.value
            !== registrationForm.login.passwordconfirm.value
        ) {
            registrationForm.login.password.valid = false;
            registrationForm.login.passwordconfirm.valid = false;
            registrationForm.login.passwordconfirm.error =
                Resource.msg('error.message.mismatch.password', 'forms', null);
            registrationForm.valid = false;
        }

        if (!CustomerMgr.isAcceptablePassword(registrationForm.login.password.value)) {
            registrationForm.login.password.valid = false;
            registrationForm.login.password.error =
                Resource.msg('error.message.password.constraints.not.matched', 'forms', null);
            registrationForm.valid = false;
        }

        // setting variables for the BeforeComplete function
        var registrationFormObj = {
            firstName: registrationForm.customer.firstname.value,
            lastName: registrationForm.customer.lastname.value,
            phone: registrationForm.customer.phone.value,
            email: registrationForm.customer.email.value,
            emailConfirm: registrationForm.customer.emailconfirm.value,
            password: registrationForm.login.password.value,
            passwordConfirm: registrationForm.login.passwordconfirm.value,
            validForm: registrationForm.valid,
            form: registrationForm
        };

        if (registrationForm.valid) {
            res.setViewData(registrationFormObj);

            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var Transaction = require('dw/system/Transaction');
                var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
                var authenticatedCustomer;
                var serverError;

                // getting variables for the BeforeComplete function
                var registrationForm = res.getViewData(); // eslint-disable-line

                if (registrationForm.validForm) {
                    var login = registrationForm.email;
                    var password = registrationForm.password;

                    // attempt to create a new user and log that user in.
                    try {
                        Transaction.wrap(function () {
                            var error = {};
                            var newCustomer = CustomerMgr.createCustomer(login, password);

                            var authenticateCustomerResult = CustomerMgr.authenticateCustomer(login, password);
                            if (authenticateCustomerResult.status !== 'AUTH_OK') {
                                error = { authError: true, status: authenticateCustomerResult.status };
                                throw error;
                            }

                            authenticatedCustomer = CustomerMgr.loginCustomer(authenticateCustomerResult, false);

                            if (!authenticatedCustomer) {
                                error = { authError: true, status: authenticateCustomerResult.status };
                                throw error;
                            } else {
                                // assign values to the profile
                                var newCustomerProfile = newCustomer.getProfile();

                                newCustomerProfile.firstName = registrationForm.firstName;
                                newCustomerProfile.lastName = registrationForm.lastName;
                                newCustomerProfile.phoneHome = registrationForm.phone;
                                newCustomerProfile.email = registrationForm.email;
                                if (registrationForm.form.customer.addtoemaillist.checked) {
                                    newCustomerProfile.custom.emailMarketingSubscription = true;
                                }
                            }
                        });
                    } catch (e) {
                        if (e.authError) {
                            serverError = true;
                        } else {
                            registrationForm.validForm = false;
                            registrationForm.form.customer.email.valid = false;
                            registrationForm.form.customer.emailconfirm.valid = false;
                            registrationForm.form.customer.email.error =
                                Resource.msg('error.message.username.invalid', 'forms', null);
                        }
                    }
                }

                delete registrationForm.password;
                delete registrationForm.passwordConfirm;
                formErrors.removeFormValues(registrationForm.form);

                if (serverError) {
                    res.setStatusCode(500);
                    res.json({
                        success: false,
                        errorMessage: Resource.msg('error.message.unable.to.create.account', 'login', null)
                    });

                    return;
                }

                if (registrationForm.validForm) {
                   // send a registration email
                    var sendEmailFromSFCC = Site.current.getCustomPreferenceValue('sendEmailsFromSFCC');
                    if(sendEmailFromSFCC){
                        accountHelpers.sendCreateAccountEmailFromSFCC(authenticatedCustomer.profile);
                    } else {
                        accountHelpers.sendCreateAccountEmail(authenticatedCustomer.profile);
                    }

                    res.setViewData({ authenticatedCustomer: authenticatedCustomer });
                    res.json({
                        success: true,
                        redirectUrl: accountHelpers.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, true)
                    });

                    req.session.privacyCache.set('args', null);
                } else {
                    res.json({
                        fields: formErrors.getFormErrors(registrationForm)
                    });
                }
            });
        } else {
            res.json({
                fields: formErrors.getFormErrors(registrationForm)
            });
        }

        return next();
    }
);

server.get(
    'EditProfile',
    server.middleware.https,
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    function (req, res, next) {
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');
        var Site = require('dw/system/Site');
        var ContentMgr = require('dw/content/ContentMgr');
        var ContentModel = require('*/cartridge/models/content');
        var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

        var apiContent = ContentMgr.getContent('account-profile-metadata');
        if (apiContent) {
            var content = new ContentModel(apiContent, 'content/contentAsset');

            pageMetaHelper.setPageMetaData(req.pageMetaData, content);
            pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
        }

        var accountModel = getModel(req);
        var profileForm = server.forms.getForm('profile');
        var consentTrackingPref = Site.current.getCustomPreferenceValue('enableConsentTracking');
        profileForm.clear();
        profileForm.customer.firstname.value = accountModel.profile.firstName;
        profileForm.customer.lastname.value = accountModel.profile.lastName;
        profileForm.customer.phone.value = accountModel.profile.phone;
        profileForm.customer.email.value = accountModel.profile.email;
        res.render('account/profile', {
            profileForm: profileForm,
            ctPreference: consentTrackingPref,
            breadcrumbs: [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                },
                {
                    htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                    url: URLUtils.url('Account-Show').toString()
                }
            ]
        });
        next();
    }, pageMetaData.computedPageMetaData
);

server.post(
    'SaveProfile',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');
        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

        var formErrors = require('*/cartridge/scripts/formErrors');

        var profileForm = server.forms.getForm('profile');

        var result = {
            firstName: profileForm.customer.firstname.value,
            lastName: profileForm.customer.lastname.value,
            phone: profileForm.customer.phone.value,
            email: profileForm.customer.email.value,
            password: profileForm.login.password.value,
            profileForm: profileForm
        };
        if (profileForm.valid) {
            res.setViewData(result);
            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var formInfo = res.getViewData();
                var customer = CustomerMgr.getCustomerByCustomerNumber(
                    req.currentCustomer.profile.customerNo
                );
                var profile = customer.getProfile();
                var customerLogin;
                var status;

                Transaction.wrap(function () {
                    status = profile.credentials.setPassword(
                            formInfo.password,
                            formInfo.password,
                            true
                    );
                    if (status.error) {
                        formInfo.profileForm.login.password.valid = false;
                        formInfo.profileForm.login.password.error =
                            Resource.msg('error.message.currentpasswordnomatch', 'forms', null);
                    } else {
                        customerLogin = profile.credentials.setLogin(
                                formInfo.email,
                                formInfo.password
                        );
                    }
                });

                delete formInfo.password;
                delete formInfo.confirmEmail;

                if (customerLogin) {
                    Transaction.wrap(function () {
                        profile.setFirstName(formInfo.firstName);
                        profile.setLastName(formInfo.lastName);
                        profile.setEmail(formInfo.email);
                        profile.setPhoneHome(formInfo.phone);
                    });

                    // Send account edited email
                    var Site = require('dw/system/Site');
                    var sendEmailFromSFCC = Site.current.getCustomPreferenceValue('sendEmailsFromSFCC');
                    if(sendEmailFromSFCC){
                        accountHelpers.sendAccountEditedEmailFromSFCC(customer.profile);
                    } else {
                        accountHelpers.sendAccountEditedEmail(customer.profile);
                    }

                    delete formInfo.profileForm;
                    delete formInfo.email;

                    res.json({
                        success: true,
                        redirectUrl: URLUtils.url('Account-Show').toString()
                    });
                } else {
                    if (!status.error) {
                        formInfo.profileForm.customer.email.valid = false;
                        formInfo.profileForm.customer.email.error =
                            Resource.msg('error.message.username.invalid', 'forms', null);
                    }

                    delete formInfo.profileForm;
                    delete formInfo.email;

                    res.json({
                        success: false,
                        fields: formErrors.getFormErrors(profileForm)
                    });
                }
            });
        } else {
            res.json({
                success: false,
                fields: formErrors.getFormErrors(profileForm)
            });
        }
        return next();
    }
);

server.get(
    'EditPassword',
    server.middleware.https,
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    function (req, res, next) {
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');

        var ContentMgr = require('dw/content/ContentMgr');
        var ContentModel = require('*/cartridge/models/content');
        var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

        var apiContent = ContentMgr.getContent('account-password-metadata');
        if (apiContent) {
            var content = new ContentModel(apiContent, 'content/contentAsset');

            pageMetaHelper.setPageMetaData(req.pageMetaData, content);
            pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
        }

        var profileForm = server.forms.getForm('profile');
        profileForm.clear();
        res.render('account/password', {
            profileForm: profileForm,
            breadcrumbs: [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                },
                {
                    htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                    url: URLUtils.url('Account-Show').toString()
                }
            ]
        });
        next();
    }, pageMetaData.computedPageMetaData
);

server.post(
    'SavePassword',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');

        var formErrors = require('*/cartridge/scripts/formErrors');

        var profileForm = server.forms.getForm('profile');
        var newPasswords = profileForm.login.newpasswords;
        // form validation
        if (newPasswords.newpassword.value !== newPasswords.newpasswordconfirm.value) {
            profileForm.valid = false;
            newPasswords.newpassword.valid = false;
            newPasswords.newpasswordconfirm.valid = false;
            newPasswords.newpasswordconfirm.error =
                Resource.msg('error.message.mismatch.newpassword', 'forms', null);
        }

        var result = {
            currentPassword: profileForm.login.currentpassword.value,
            newPassword: newPasswords.newpassword.value,
            newPasswordConfirm: newPasswords.newpasswordconfirm.value,
            profileForm: profileForm
        };

        if (profileForm.valid) {
            res.setViewData(result);
            this.on('route:BeforeComplete', function () { // eslint-disable-line no-shadow
                var formInfo = res.getViewData();
                var customer = CustomerMgr.getCustomerByCustomerNumber(
                    req.currentCustomer.profile.customerNo
                );
                var status;
                Transaction.wrap(function () {
                    status = customer.profile.credentials.setPassword(
                        formInfo.newPassword,
                        formInfo.currentPassword,
                        true
                    );
                });
                if (status.error) {
                    if (status.code.indexOf('a valid password') >= 0) {
                        formInfo.profileForm.login.newpasswords.newpassword.valid = false;
                        formInfo.profileForm.login.newpasswords.newpassword.error =
                            Resource.msg('error.message.password.constraints.not.matched', 'forms', null);
                    } else {
                        formInfo.profileForm.login.currentpassword.valid = false;
                        formInfo.profileForm.login.currentpassword.error =
                            Resource.msg('error.message.currentpasswordnomatch', 'forms', null);
                    }
                    delete formInfo.currentPassword;
                    delete formInfo.newPassword;
                    delete formInfo.newPasswordConfirm;
                    delete formInfo.profileForm;

                    res.json({
                        success: false,
                        fields: formErrors.getFormErrors(profileForm)
                    });
                } else {
                    delete formInfo.currentPassword;
                    delete formInfo.newPassword;
                    delete formInfo.newPasswordConfirm;
                    delete formInfo.profileForm;
                    var Site = require('dw/system/Site');
                    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
                    var sendEmailFromSFCC = Site.current.getCustomPreferenceValue('sendEmailsFromSFCC');
                    if(sendEmailFromSFCC){
                        accountHelpers.sendPasswordSavedEmailFromSFCC(customer);
                    }

                    res.json({
                        success: true,
                        redirectUrl: URLUtils.url('Account-Show').toString()
                    });
                }
            });
        } else {
            res.json({
                success: false,
                fields: formErrors.getFormErrors(profileForm)
            });
        }
        return next();
    }
);

server.post('PasswordResetDialogForm', server.middleware.https, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

    var email = req.form.loginEmail;
    var errorMsg;
    var isValid;
    var resettingCustomer;
    var mobile = req.querystring.mobile;
    var receivedMsgHeading = Resource.msg('label.resetpasswordreceived', 'login', null);
    var receivedMsgBody = Resource.msg('msg.requestedpasswordreset', 'login', null);
    var buttonText = Resource.msg('button.text.loginform', 'login', null);
    var returnUrl = URLUtils.url('Login-Show').toString();
    if (email) {
        isValid = validateEmail(email);
        if (isValid) {
            resettingCustomer = CustomerMgr.getCustomerByLogin(email);
            if (resettingCustomer) {
                var Site = require('dw/system/Site');
                    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
                    var sendEmailFromSFCC = Site.current.getCustomPreferenceValue('sendEmailsFromSFCC');
                    if(sendEmailFromSFCC){
                        accountHelpers.sendPasswordResetEmailFromSFCC(email, resettingCustomer);
                    }else{
                        accountHelpers.sendPasswordResetEmail(email, resettingCustomer);
                    }
            }
            res.json({
                success: true,
                receivedMsgHeading: receivedMsgHeading,
                receivedMsgBody: receivedMsgBody,
                buttonText: buttonText,
                mobile: mobile,
                returnUrl: returnUrl
            });
        } else {
            errorMsg = Resource.msg('error.message.passwordreset', 'login', null);
            res.json({
                fields: {
                    loginEmail: errorMsg
                }
            });
        }
    } else {
        errorMsg = Resource.msg('error.message.required', 'login', null);
        res.json({
            fields: {
                loginEmail: errorMsg
            }
        });
    }
    next();
});

server.get('PasswordReset', server.middleware.https, function (req, res, next) {
    res.render('account/password/requestPasswordReset', { mobile: true });
    next();
});

server.get('SetNewPassword', server.middleware.https, consentTracking.consent, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var URLUtils = require('dw/web/URLUtils');

    var passwordForm = server.forms.getForm('newPasswords');
    passwordForm.clear();
    var token = req.querystring.token;
    var resettingCustomer = CustomerMgr.getCustomerByToken(token);
    if (!resettingCustomer) {
        res.redirect(URLUtils.url('Account-PasswordReset'));
    } else {
        res.render('account/password/newPassword', { passwordForm: passwordForm, token: token });
    }
    next();
});

server.post('SaveNewPassword', server.middleware.https, function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');

    var passwordForm = server.forms.getForm('newPasswords');
    var token = req.querystring.token;

    if (passwordForm.newpassword.value !== passwordForm.newpasswordconfirm.value) {
        passwordForm.valid = false;
        passwordForm.newpassword.valid = false;
        passwordForm.newpasswordconfirm.valid = false;
        passwordForm.newpasswordconfirm.error =
            Resource.msg('error.message.mismatch.newpassword', 'forms', null);
    }

    if (passwordForm.valid) {
        var result = {
            newPassword: passwordForm.newpassword.value,
            newPasswordConfirm: passwordForm.newpasswordconfirm.value,
            token: token,
            passwordForm: passwordForm
        };
        res.setViewData(result);
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var CustomerMgr = require('dw/customer/CustomerMgr');
            var URLUtils = require('dw/web/URLUtils');
            var Site = require('dw/system/Site');
            var HashMap = require('dw/util/HashMap');
            var HookMgr = require('dw/system/HookMgr');
            var Logger = require('dw/system/Logger');
            var Template = require('dw/util/Template');

            var formInfo = res.getViewData();
            var status;
            var resettingCustomer;
            Transaction.wrap(function () {
                resettingCustomer = CustomerMgr.getCustomerByToken(formInfo.token);
                status = resettingCustomer.profile.credentials.setPasswordWithToken(
                    formInfo.token,
                    formInfo.newPassword
                );
            });
            if (status.error) {
                passwordForm.newpassword.valid = false;
                passwordForm.newpasswordconfirm.valid = false;
                passwordForm.newpasswordconfirm.error =
                    Resource.msg('error.message.resetpassword.invalidformentry', 'forms', null);
                res.render('account/password/newPassword', {
                    passwordForm: passwordForm,
                    token: token
                });
            } else {
                var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
                var Site = require('dw/system/Site');
                var sendEmailFromSFCC = Site.current.getCustomPreferenceValue('sendEmailsFromSFCC');
                if(sendEmailFromSFCC){
                    accountHelpers.sendPasswordSavedEmailFromSFCC(resettingCustomer);
                } else { 
                var email = resettingCustomer.profile.email;
                var url = URLUtils.https('Login-Show');
                var objectForEmail = {
                    firstName: resettingCustomer.profile.firstName,
                    lastName: resettingCustomer.profile.lastName,
                    url: url
                };

                var context = new HashMap();
                Object.keys(objectForEmail).forEach(function (key) {
                    context.put(key, objectForEmail[key]);
                });

                var template = new Template('account/password/passwordChangedEmail');
                var content = template.render(context).text;

                var hookID = 'app.mail.sendMail';
                if (HookMgr.hasHook(hookID)) {
                    HookMgr.callHook(
                        hookID,
                        'sendMail',
                        {
                            communicationHookID: 'account.passwordChanged',
                            template: 'account/password/passwordChangedEmail',
                            fromEmail: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
                            toEmail: email,
                            subject: Resource.msg('subject.profile.resetpassword.email', 'login', null),
                            messageBody: content,
                            params: context
                        }
                    );
                } else {
                    Logger.error('No hook registered for {0}', hookID);
                }
            }
                res.redirect(URLUtils.url('Login-Show'));
            }
        });
    } else {
        res.render('account/password/newPassword', { passwordForm: passwordForm, token: token });
    }
    next();
});

server.get('Header', server.middleware.include, function (req, res, next) {
    var template = req.querystring.mobile ? 'account/mobileHeader' : 'account/header';
    res.render(template, { name:
        req.currentCustomer.profile ? req.currentCustomer.profile.firstName : null
    });
    next();
});

module.exports = server.exports();
