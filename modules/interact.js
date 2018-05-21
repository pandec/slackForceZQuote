"use strict";

let auth = require("./slack-salesforce-auth"),
    force = require("./force"),
    APP_TOKEN = process.env.SLACK_APP_TOKEN;

exports.execute = (req, res) => {

    if (req.body.token != APP_TOKEN) {
        res.send("Invalid token");
        return;
    }

    let slackUserId = req.body.user_id,
        oauthObj = auth.getOAuthObject(slackUserId);

    let path = '/Quote/CheckUserForApproval?slackUserId=' + slackUserId + '&recordId=' + req.body.text;

    force.apexrest(oauthObj, path, {})
        .then(data => {
            console.log('bdec // data: ' + data);
            if ((data === 'true')) {
                console.log('bdec // -- true --');
                res.send('true');
            } else {
                console.log('bdec // -- false --');
                res.send('false');
            }
        })
        .catch(error => {
            if (error.code == 401) {
                res.send(`Visit this URL to login to Salesforce: https://${req.hostname}/login/` + slackUserId);
            } else {
                res.send("An error as occurred");
            }
        });
};