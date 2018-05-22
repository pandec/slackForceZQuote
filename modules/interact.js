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

    let pathProcess = 'Quote/Approve?recordId=' + quoteId + '&step=';

    if (responseName === 'approve') {
        pathProcess += 'approve';
    } else if (responseName === 'reject') {
        pathProcess += 'reject';
    }

    approveRejectQuote(quoteId, pathProcess);

    function approveRejectQuote(quoteId, pathProcess) {
        console.log('bdec // pathProcess: ' + pathProcess);

        var options = {};
        options.method = 'POST';

        force.apexrest(oauthObj, pathProcess, options)
            .then(data => {
                console.log('bdec // data: ' + JSON.stringify(data));

                var approveResult = JSON.parse(data);
                console.log('bdec // approveResult: ' + approveResult);

                console.log('bdec // (approveResult.success === \'true\'): ' + (approveResult.success === 'true'));

                if ((approveResult.success === 'true')) {
                    var textResponse;

                    let original_message = actionJSONPayload.original_message;
                    original_message.actions = null;
                    original_message.replace_original = false;

                    if (pathProcess.includes('approve')) {
                        textResponse = 'Ok - record approved';
                    } else {
                        textResponse = 'Ok - record rejected';
                    }
                    res.json({
                        text: textResponse,
                        replace_original: false
                    });
                } else {
                    res.json({
                        text: "Error",
                        replace_original: false
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

    /*force.apexrest(oauthObj, path, {})
        .then(data => {
            console.log('bdec // data: ' + data);
            console.log('bdec // data.success: ' + data.success);
            if ((data.success === 'true')) {
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
     */
};