"use strict";

let auth = require("./slack-salesforce-auth"),
    force = require("./force"),
    QUOTE_TOKEN = process.env.SLACK_QUOTE_TOKEN,
    APP_TOKEN = process.env.SLACK_APP_TOKEN;

exports.execute = (req, res) => {

    console.log('bdec // token: ' + req.body.token);

    if (req.body.token != QUOTE_TOKEN && req.body.token != APP_TOKEN) {
        console.log("Invalid token");
        res.send("Invalid token");
        return;
    }

    let slackUserId = req.body.user_id,
        oauthObj = auth.getOAuthObject(slackUserId);

    let path = '/Quote/CheckUserForApproval?slackUserId=' + slackUserId + '&recordId=' + req.body.text;
    //let params = {
    //    'slackUserId' : '"' + slackUserId + '"',
    //    'recordId' : '"' + req.body.text + '"'
    //};

    force.apexrest(oauthObj, path, {})
        .then(data => {
            console.log('bdec // data: ' + data);
            if((data === 'true')){
                console.log('bdec // -- true --');
            } else {
                console.log('bdec // -- false --');
            }
        })
        .catch(error => {
            if (error.code == 401) {
                res.send(`Visit this URL to login to Salesforce: https://${req.hostname}/login/` + slackUserId);
            } else {
                res.send("An error as occurred");
            }
        });

    force.query(oauthObj, q)
        .then(data => {
            let quotess = JSON.parse(data).records;
            if (quotess && quotess.length > 0) {
                let attachments = [];
                quotess.forEach(function (quote) {
                    let fields = [];
                    fields.push({title: "Number", value: quote.zqu__Number__c, short: true});
                    fields.push({title: "Status", value: quote.zqu__Status__c, short: true});



                    attachments.push({
                        author_name: quote.CreatedBy.Name,
                        author_link: oauthObj.instance_url + "/" + quote.CreatedBy.Id,
                        title: quote.Name,
                        title_link: oauthObj.instance_url + "/" + quote.Id,
                        color: "#1798c1",
                        fields: fields,
                        actions: [
                            {
                                "name": "yes",
                                "text": "yes",
                                "type": "button",
                                "value": "yes"
                            },
                            {
                                "name": "no",
                                "text": "no",
                                "type": "button",
                                "value": "no"
                            },
                            {
                                "name": "maybe",
                                "text": "maybe",
                                "type": "button",
                                "value": "maybe",
                                "style": "danger"
                            }
                        ]
                    });
                });
                res.json({text: "Quotes matching '" + req.body.text + "':", attachments: attachments});
            } else {
                res.send("No records");
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