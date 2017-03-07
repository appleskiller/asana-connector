"use strict";
var express = require("express");
var asanaclient = require("../libs/asanaclient");
var Logger = require("../libs/logger");
var cache = require("../libs/cache");
var storage = cache.createInstance("asana");
var log = Logger.getLogger("asana_connector");
var router = express.Router();
router.get("/currentuser", function (req, res) {
    var asanauser = storage.get("asanauser");
    if (asanauser) {
        res.charset = 'utf-8';
        res.send({
            connected: true,
            user: asanauser.user
        });
    }
    else {
        res.send({
            connected: false
        });
    }
});
router.get('/connect', function (req, res) {
    var client = asanaclient.create().nativeClient();
    var asanauser = storage.get("asanauser");
    if (asanauser) {
        res.send("<script>window.close()</script>");
    }
    else {
        log.log("connect to asana oauth ...");
        res.redirect(client.app.asanaAuthorizeUrl());
    }
});
router.get("/disconnect", function (req, res) {
    log.log("disconnect from asana oauth ...");
    storage.del("asanauser");
    res.end();
});
router.get('/oauth_callback', function (req, res) {
    var client = asanaclient.create().nativeClient();
    var code = req.query.code;
    if (code) {
        log.log("asana callback with code");
        client.app.accessTokenFromCode(code).then(function (credentials) {
            log.log("asana connected.");
            client.useOauth({ credentials: credentials.access_token });
            client.users.me().then(function (me) {
                storage.set("asanauser", {
                    user: me,
                    token: credentials
                });
                res.send("<script>window.close()</script>");
            }).catch(function (err) {
                res.charset = 'utf-8';
                var content = "Error fetching user , <a href=\"/asana/connect\">reconnect</a>. <div><a onclick=\"alert('" + JSON.stringify(err) + "')\">What's happen?</a></div>";
                res.send(content);
            });
        });
    }
    else {
        log.log("asana callback without code! Error getting authorization: ", req.query.error);
        res.charset = 'utf-8';
        var content = "Error getting authorization , <a href=\"/asana/connect\">reconnect</a>. <div><a href=\"javascript:void(0)\" onclick=\"alert('" + req.query.error + "')\">What's happen?</a></div>";
        res.send(content);
    }
});
module.exports = router;
//# sourceMappingURL=oauth.js.map