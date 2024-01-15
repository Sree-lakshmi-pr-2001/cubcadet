'use strict';

const sfccAuthApi = require('sfcc-ci').auth;

/**
 * Authenticates a client and attempts to obtain a new Oauth2 token.
 * @param {string} clientId - The OCAPI client ID / API key.
 * @param {string} clientSecret - The OCAPI client secret / password.
 * @returns {Promise} - The promise represents the result of the attempt -- a new token or an error message.
 */
module.exports = (clientId, clientSecret) =>
    new Promise((resolve, reject) => {

        console.log("clientId : " + clientId);
        // console.log("clientSecret : "+ clientSecret);
        sfccAuthApi.auth(clientId, clientSecret, (error, token) => {
            console.log("error : " + error);
            console.log("token : " + token);
            if (token) {
                resolve(token);
                return;
            }
            reject(error);
        });
    });
