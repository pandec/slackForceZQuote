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

    var isApprover;

    let path = '/Quote/CheckUserForApproval?slackUserId=' + slackUserId + '&recordId=' + quoteId;
    let pathProcess = 'Quote/Approve?recordId=' + quoteId + '&step=';

    force.apexrest(oauthObj, path, {})
        .then(data => {

            isApprover = (data === 'true');

            console.log('bdec // data: ' + data);
            if ((data === 'true')) {
                console.log('bdec // -- true --');
                pathProcess += 'approve';
                approveRejectQuote(quoteId, pathProcess);
            } else {
                console.log('bdec // -- false --');
                pathProcess += 'reject';
                approveRejectQuote(quoteId, pathProcess);
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

    function approveRejectQuote(quoteId, pathProcess) {
        console.log('bdec // step type: approve: ' + pathProcess.includes('approve'));
        console.log('bdec // step type: reject: ' + pathProcess.includes('reject'));
        console.log('bdec // quoteId: ' + quoteId);
        console.log('bdec // pathProcess: ' + pathProcess);

        var options = {};
        options.method = 'POST';

        force.apexrest(oauthObj, pathProcess, options)
            .then(data => {
                console.log('bdec // data: ' + data);
                console.log('bdec // data: ' + JSON.stringify(data));
                if ((data === 'true')) {
                    var textResponse;
                    if (pathProcess.includes('approve')) {
                        textResponse = 'Ok - record approved';
                    } else {
                        textResponse = 'Ok - record rejected';
                    }
                    res.json({
                        text: textResponse
                    });
                } else {
                    res.json({
                        text: "Error"
                    });
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
    }
};