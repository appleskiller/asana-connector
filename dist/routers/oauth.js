"use strict";
var express = require("express");
var asanaclient = require("../libs/asanaclient");
var router = express.Router();
var clientId = process.env['ASANA_CLIENT_ID'];
var clientSecret = process.env['ASANA_CLIENT_SECRET'];
var port = process.env['PORT'] || 18081;
router.get('/', function (req, res) {
    var client = asanaclient.create();
    var token = req.cookies.token;
    if (token) {
        client.useOauth({ credentials: token });
        client.users.me().then(function (me) {
            res.end('Hello ' + me.name);
        }).catch(function (err) {
            res.end('Error fetching user: ' + err);
        });
    }
    else {
        res.redirect(client.app.asanaAuthorizeUrl());
    }
});
router.get('/oauth_callback', function (req, res) {
    var code = req.param('code');
    if (code) {
        var client = asanaclient.create();
        client.app.accessTokenFromCode(code).then(function (credentials) {
            res.cookie('token', credentials.access_token, { maxAge: 60 * 60 * 1000 });
            res.redirect('/asana');
        });
    }
    else {
        res.end('Error getting authorization: ' + req.param('error'));
    }
});
module.exports = router;
//# sourceMappingURL=oauth.js.map