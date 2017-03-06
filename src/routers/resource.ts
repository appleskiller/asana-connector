import * as express from "express";
import * as Asana from "asana";
import * as asanaclient from "../libs/asanaclient";
import * as Logger from "../libs/logger";
import * as cache from "../libs/cache";
import * as shujuguanclient from "../libs/shujuguanclient";

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
        var asanauser = storage.get("asanauser");
        if (asanauser) {
            var asana = asanaclient.create(asanauser.token);
            if (!asanauser.user.workspaces || !asanauser.user.workspaces.length) {
                res.charset = 'utf-8';
                res.send([]);
            } else {
                asana.metadatas(metaType , asanauser.user.workspaces).then(function(result: asanaclient.Projects[]) {
                    res.charset = 'utf-8';
                    res.send(result);
                } , progressError(res));
            }
        } else {
            res.status(401);
        }
    }
}

router.get("/workspaces" , function(req , res: express.Response) {
    var asanauser = storage.get("asanauser");
    if (asanauser) {
        res.charset = 'utf-8';
        res.send(asanauser.workspaces);
    } else {
        res.sendStatus(401);
    }
})

router.get("/projects" , metadatas("projects"));
router.get("/users" , metadatas("users"));
router.get("/tasks" , metadatas("tasks"));
router.get("/tags" , metadatas("tags"));

export = router;