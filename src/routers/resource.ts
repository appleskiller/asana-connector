import * as express from "express";
import * as Asana from "asana";
import * as asanaclient from "../libs/asanaclient";
import * as Logger from "../libs/logger";
import * as cache from "../libs/cache";
import * as shujuguanclient from "../libs/shujuguanclient";
import * as progress from "../libs/progress";
import * as asana2shujuguan from "../libs/asana2shujuguan";
import * as fs from "fs";
import * as SBIschedule from "../libs/SBIschedule";

var storage = cache.createInstance("asana");
var log = Logger.getLogger("asana_resources");
var router = express.Router();

function progressError (res) {
    return function (err) {
        res.status(500).send(err);
    }
}

function metadatas(metaType: string) {
    return function(req , res) {
        log.log(`fetch metadatas ${metaType}...`);
        var asanauser = storage.get("asanauser");
        if (asanauser) {
            var asana = asanaclient.create(asanauser.token);
            if (!asanauser.user.workspaces || !asanauser.user.workspaces.length) {
                res.charset = 'utf-8';
                res.send([]);
            } else {
                asana.metadatas(metaType , asanauser.user.workspaces).then(function(result: asanaclient.Resource[]) {
                    log.log(`fetch metadatas ${metaType} end. count:` , result.length);
                    res.charset = 'utf-8';
                    res.send(result);
                } , progressError(res));
            }
        } else {
            res.status(401);
        }
    }
}

function entities (resType: string) {
    return function (req , res) {
        log.log(`fetch entities ${resType}...`);
        var ids = req.body.ids;
        if (!ids || !ids.length) {
            res.send([]);
            return;
        }
        var asanauser = storage.get("asanauser");
        if (asanauser) {
            var asana = asanaclient.create(asanauser.token);
            asana.entities(resType , ids).then(function(result: asanaclient.Resource[]) {
                log.log(`fetch entities ${resType} end. count:` , result.length);
                res.charset = 'utf-8';
                res.send(result);
            } , progressError(res));
        } else {
            res.status(401);
        }
    }
}
router.get("/workspaces" , function(req , res: express.Response) {
    var asanauser = storage.get("asanauser");
    if (asanauser) {
        res.charset = 'utf-8';
        res.send(asanauser.user.workspaces);
    } else {
        res.sendStatus(401);
    }
})

router.get("/projects" , metadatas("projects"));
router.get("/users" , metadatas("users"));
router.get("/tasks" , metadatas("tasks"));
router.get("/tags" , metadatas("tags"));
router.get("/teams" , function (req , res) {
    log.log(`fetch teams ...`);
    var asanauser = storage.get("asanauser");
    if (asanauser) {
        var asana = asanaclient.create(asanauser.token);
        if (!asanauser.user.workspaces || !asanauser.user.workspaces.length) {
            res.charset = 'utf-8';
            res.send([]);
        } else {
            asana.teams(asanauser.user.workspaces).then(function(result: asanaclient.Resource[]) {
                log.log(`fetch teams end. count:` , result.length);
                res.charset = 'utf-8';
                res.send(result);
            } , progressError(res));
        }
    } else {
        res.status(401);
    }
})

router.post("/projects" , entities("projects"));
router.post("/users" , entities("users"));
router.post("/tasks" , entities("tasks"));
router.post("/tags" , entities("tags"));
router.post("/teams" , entities("teams"));

router.get("/progress" , function (req , res) {
    res.charset = 'utf-8';
    res.send(progress.all());
})

router.post("/upload/shujuguan/projects" , function (req , res) {
    var projectId = req.body.projectId;
    if (!projectId) {
        res.status(500).send("invalid post body!");
    } else {
        var asanauser = storage.get("asanauser");
        if (asanauser) {
            var asana = asanaclient.create(asanauser.token);
            var shujuguan = shujuguanclient.create();
            var taskid = asana2shujuguan.uploadTasksTableWithProject(asana , shujuguan , projectId);
            res.send(taskid);
        } else {
            res.status(401);
        }
    }
})

router.get("/monitoring" , function (req , res) {
    res.charset = 'utf-8';
    var asanauser = storage.get("asanauser");
    res.send({
        progress: progress.all() ,
        user: asanauser ? asanauser.user : null,
        logs: Logger.getHistory()
    })
})

router.get("/schedule" , function (req , res) {
    try {
        var content = fs.readFileSync("./schedule/SBI.json", "utf-8");
        var json = JSON.parse(content);
        var projectId = json.projectId;
        var asanauser = storage.get("asanauser");
        if (asanauser) {
            var asana = asanaclient.create(asanauser.token);
            asana.nativeClient().projects.findById(projectId).then(function (project) {
                json.projectName = project.name;
                res.charset = 'utf-8';
                res.send(json);
            }).catch(function (err) {
                res.status(500).send(err);
            })
        } else {
            res.status(401);
        }
    } catch (err) {
        res.status(500).send(err);
    }
})

router.post("/schedule" , function (req , res) {
    var projectId = req.body.projectId;
    if (!projectId) {
        res.status(500).send("projectId needed!");
    } else {
        try {
            var content = fs.readFileSync("./schedule/SBI.json", "utf-8");
            var json = JSON.parse(content);
            json.projectId = projectId;
            fs.writeFileSync("./schedule/SBI.json", JSON.stringify(json) , "utf-8");
            log.log("schedule updated!");
            res.sendStatus(200);
        } catch (err) {
            res.status(500).send(err);
        }
    }
})

router.get("/schedule/sbi" , function (req , res) {
    SBIschedule.start();
    res.sendStatus(200);
})
export = router;