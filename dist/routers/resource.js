"use strict";
var express = require("express");
var asanaclient = require("../libs/asanaclient");
var Logger = require("../libs/logger");
var cache = require("../libs/cache");
var storage = cache.createInstance("asana");
var log = Logger.getLogger("asana_resources");
var router = express.Router();
function progressError(res) {
    return function (err) {
        res.status(500).send(err);
    };
}
router.get("/workspaces", function (req, res) {
    var asanauser = storage.get("asanauser");
    if (asanauser) {
        var asana = asanaclient.create(asanauser.token);
        asana.workspaces().then(function (result) {
            res.charset = 'utf-8';
            res.send(result.data);
        }, progressError(res));
    }
    else {
        res.sendStatus(401);
    }
});
router.get("/projects", function (req, res) {
    var asanauser = storage.get("asanauser");
    if (asanauser) {
        var asana = asanaclient.create(asanauser.token);
        if (!asanauser.user.workspaces || !asanauser.user.workspaces.length) {
            res.charset = 'utf-8';
            res.send([]);
        }
        else {
            asana.projects(asanauser.user.workspaces[0].id).then(function (result) {
                res.charset = 'utf-8';
                res.send(result.data);
            }, progressError(res));
        }
    }
    else {
        res.sendStatus(401);
    }
});
module.exports = router;
//# sourceMappingURL=resource.js.map