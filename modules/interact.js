"use strict";

let auth = require("./slack-salesforce-auth"),
    force = require("./force"),
    APP_TOKEN = process.env.SLACK_APP_TOKEN;

exports.execute = (req, res) => {

    res.status(200);
    var actionJSONPayload = JSON.parse(req.body.payload);
    console.log('bdec // req.body.payload: ' + JSON.stringify(actionJSONPayload));

    if (actionJSONPayload.token != APP_TOKEN) {
        res.send("Invalid token");
        return;
    }

    let slackUserId = actionJSONPayload.user.id,
        oauthObj = auth.getOAuthObject(slackUserId);

    var responseName = actionJSONPayload.actions[0].name;
    var quoteId = actionJSONPayload.actions[0].value;
    console.log('bdec // responseName: ' + responseName);
    console.log('bdec // quoteId: ' + quoteId);
    console.log('bdec // slackUserId: ' + slackUserId);

    let path = '/Quote/CheckUserForApproval?slackUserId=' + slackUserId + '&recordId=' + quoteId;

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
                res.status(401);
                res.send(`Visit this URL to login to Salesforce: https://${req.hostname}/login/` + slackUserId);
            } else {
                res.status(500);
                res.send("An error as occurred");
            }
        });
};