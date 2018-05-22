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
                var approveResult = JSON.parse(data);
                console.log('bdec // approveResult: ' + JSON.stringify(data));
                console.log('bdec // approveResult: ' + approveResult);
                console.log('bdec // (approveResult.success === \'true\'): ' + (approveResult.success === 'true'));

                let responsePayload = {
                    color: "#1798c1",
                    replace_original: true,
                    text: 'Error occurred - ' + '<' + oauthObj.instance_url + '/' + quoteId + '|Click here to see the record in Salesforce>'
                };

                if ((approveResult.success === false)) {
                    if (approveResult.error === 'INSUFFICIENT_ACCESS') {
                        responsePayload.text = 'You are unable to approve this quote.';
                    } else {
                        responsePayload.text += ' | Error code: ' + approveResult.error;
                    }
                } else {
                    var textResponse;

                    if (pathProcess.includes('approve')) {
                        textResponse = 'Ok - record approved';
                    } else {
                        textResponse = 'Ok - record rejected';
                    }
                    responsePayload.text = textResponse;
                }


                // if ((approveResult.success === 'true')) {
                //     var textResponse;
                //
                //     if (pathProcess.includes('approve')) {
                //         textResponse = 'Ok - record approved';
                //     } else {
                //         textResponse = 'Ok - record rejected';
                //     }
                //     responsePayload.text = textResponse;
                // } else {
                //     if (approveResult.error === 'INSUFFICIENT_ACCESS') {
                //         responsePayload.text = 'You are unable to approve this quote. '
                //     } else {
                //
                //     }
                // }

                res.json(responsePayload);

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