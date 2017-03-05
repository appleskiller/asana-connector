import * as express from "express";
import * as Asana from "asana";
import * as asanaclient from "../libs/asanaclient";
import * as Logger from "../libs/logger";
import * as cache from "../libs/cache";

var storage = cache.createInstance("asana");
var log = Logger.getLogger("asana_resources");
var router = express.Router();

function progressError (res) {
    return function (err) {
        res.status(500).send(err);
    }
}

router.get("/workspaces" , function(req , res: express.Response) {
    var asanauser = storage.get("asanauser");
    if (asanauser) {
        var asana = asanaclient.create(asanauser.token);
        asana.workspaces().then(function(result: asanaclient.ResourceList<asanaclient.Workspaces>) {
            res.charset = 'utf-8';
            res.send(result.data);
        } , progressError(res));
    } else {
        res.sendStatus(401);
    }
})
router.get("/projects" , function(req , res: express.Response) {
    var asanauser = storage.get("asanauser");
    if (asanauser) {
        var asana = asanaclient.create(asanauser.token);
        if (!asanauser.user.workspaces || !asanauser.user.workspaces.length) {
            res.charset = 'utf-8';
            res.send([]);
        } else {
            asana.projects(asanauser.user.workspaces[0].id).then(function(result: asanaclient.ResourceList<asanaclient.Workspaces>) {
                res.charset = 'utf-8';
                res.send(result.data);
            } , progressError(res));
        }
    } else {
        res.sendStatus(401);
    }
})

export = router;