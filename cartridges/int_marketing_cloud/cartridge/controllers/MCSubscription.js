'use strict';

var server = require('server');


/**
 * Footer Subscription
 */
server.post('FooterSubscribe', function (req, res, next) {
    var HookMgr = require('dw/system/HookMgr');
    var Resource = require('dw/web/Resource');

    var email = req.form.email;
    var signUpResult = false;
    var hookID = 'app.mailingList.subscribe';
    if (HookMgr.hasHook(hookID)) {
        signUpResult = HookMgr.callHook(
            hookID,
            hookID.slice(hookID.lastIndexOf('.') + 1),
            {
                email: email
            }
        );
    }

    res.json({
        success: signUpResult,
        msg: Resource.msg(signUpResult ? 'emailsignup.success' : 'emailsignup.error', 'common', null)
    });
    next();
});

module.exports = server.exports();
