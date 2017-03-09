"use strict";
var express = require("express");
var asanaclient = require("../libs/asanaclient");
var Logger = require("../libs/logger");
var cache = require("../libs/cache");
var progress = require("../libs/progress");
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
        log.log("fetch metadatas " + metaType + "...");
        var asanauser = storage.get("asanauser");
        if (asanauser) {
            var asana = asanaclient.create(asanauser.token);
            if (!asanauser.user.workspaces || !asanauser.user.workspaces.length) {
                res.charset = 'utf-8';
                res.send([]);
            }
            else {
                asana.metadatas(metaType, asanauser.user.workspaces).then(function (result) {
                    log.log("fetch metadatas " + metaType + " end. count:", result.length);
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
function entities(resType) {
    return function (req, res) {
        log.log("fetch entities " + resType + "...");
        var ids = req.body.ids;
        if (!ids || !ids.length) {
            res.send([]);
            return;
        }
        var asanauser = storage.get("asanauser");
        if (asanauser) {
            var asana = asanaclient.create(asanauser.token);
            asana.entities(resType, ids).then(function (result) {
                log.log("fetch entities " + resType + " end. count:", result.length);
                res.charset = 'utf-8';
                res.send(result);
            }, progressError(res));
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
        res.send(asanauser.user.workspaces);
    }
    else {
        res.sendStatus(401);
    }
});
router.get("/projects", metadatas("projects"));
router.get("/users", metadatas("users"));
router.get("/tasks", metadatas("tasks"));
router.get("/tags", metadatas("tags"));
router.get("/teams", function (req, res) {
    log.log("fetch teams ...");
    var asanauser = storage.get("asanauser");
    if (asanauser) {
        var asana = asanaclient.create(asanauser.token);
        if (!asanauser.user.workspaces || !asanauser.user.workspaces.length) {
            res.charset = 'utf-8';
            res.send([]);
        }
        else {
            asana.teams(asanauser.user.workspaces).then(function (result) {
                log.log("fetch teams end. count:", result.length);
                res.charset = 'utf-8';
                res.send(result);
            }, progressError(res));
        }
    }
    else {
        res.status(401);
    }
});
router.post("/projects", entities("projects"));
router.post("/users", entities("users"));
router.post("/tasks", entities("tasks"));
router.post("/tags", entities("tags"));
router.post("/teams", entities("teams"));
router.get("/progress", function (req, res) {
    res.charset = 'utf-8';
    res.send(progress.all());
});
router.post("/upload/shujuguan/projects", function (req, res) {
    var name = req.body.name;
    var projectId = req.body.projectId;
    if (!name || !projectId) {
        res.status(500).send("invalid post body!");
    }
    else {
        var asanauser = storage.get("asanauser");
        if (asanauser) {
            var asana = asanaclient.create(asanauser.token);
            log.log("fetch tasksInProject ...");
            asana.tasksInProject(projectId).then(function (tasks) {
                log.log("fetch tasksInProject end. count:", tasks.length);
                res.send(tasks);
            }).catch(function (err) {
                log.log("fetch tasksInProject error: ", err);
                res.status(500).send(err);
            });
        }
        else {
            res.status(401);
        }
    }
});
router.get("/monitoring", function (req, res) {
    res.send(progress.all());
});
module.exports = router;
//# sourceMappingURL=resource.js.map