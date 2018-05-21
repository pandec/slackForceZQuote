"use strict";

let auth = require("./slack-salesforce-auth"),
    force = require("./force"),
    APP_TOKEN = process.env.SLACK_APP_TOKEN;

exports.execute = (req, res) => {

    res.status(200).end()
    var actionJSONPayload = JSON.parse(req.body.payload);
    console.log('bdec // req.body.payload: ' + JSON.stringify(actionJSONPayload));

    if (actionJSONPayload.token != APP_TOKEN) {
        res.send("Invalid token");
        return;
    }

    let slackUserId = req.body.payload.user_id,
        oauthObj = auth.getOAuthObject(slackUserId);

    let path = '/Quote/CheckUserForApproval?slackUserId=' + slackUserId + '&recordId=' + actionJSONPayload.text;

    force.apexrest(oauthObj, path, {})
        .then(data => {
            console.log('bdec // data: ' + data);
            if ((data === 'true')) {
                console.log('bdec // -- true --');
                res.json({text: "Response: '" + data + "':", replace_original: "true"});
                //res.send('true');
            } else {
                console.log('bdec // -- false --');
                //res.send('false');
                res.json({text: "Response: '" + data + "':", replace_original: "true"});
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