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
function metadatas(metaType) {
    return function (req, res) {
        var asanauser = storage.get("asanauser");
        if (asanauser) {
            var asana = asanaclient.create(asanauser.token);
            if (!asanauser.user.workspaces || !asanauser.user.workspaces.length) {
                res.charset = 'utf-8';
                res.send([]);
            }
            else {
                asana.metadatas(metaType, asanauser.user.workspaces).then(function (result) {
                    res.charset = 'utf-8';
                    res.send(result);
                }, progressError(res));
            }
        }
        else {
            res.status(401);
        }
    };
}
router.get("/workspaces", function (req, res) {
    var asanauser = storage.get("asanauser");
    if (asanauser) {
        res.charset = 'utf-8';
        res.send(asanauser.workspaces);
    }
    else {
        res.sendStatus(401);
    }
});
router.get("/projects", metadatas("projects"));
router.get("/users", metadatas("users"));
router.get("/tasks", metadatas("tasks"));
router.get("/tags", metadatas("tags"));
module.exports = router;
//# sourceMappingURL=resource.js.map