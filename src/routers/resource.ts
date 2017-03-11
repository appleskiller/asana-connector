import * as express from "express";
import * as Asana from "asana";
import * as asanaclient from "../libs/asanaclient";
import * as Logger from "../libs/logger";
import * as cache from "../libs/cache";
import * as shujuguanclient from "../libs/shujuguanclient";
import * as progress from "../libs/progress";
import * as asana2shujuguan from "../libs/asana2shujuguan";

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
    var datatableId = req.body.datatableId;
    var projectId = req.body.projectId;
    if (!projectId) {
        res.status(500).send("invalid post body!");
    } else {
        var asanauser = storage.get("asanauser");
        if (asanauser) {
            var asana = asanaclient.create(asanauser.token);
            var shujuguan = shujuguanclient.create();
            log.log(`fetch tasksInProject ...`);


            asana2shujuguan.uploadTasksTableWithProject(asana , shujuguan , projectId , datatableId).then(function (datatable) {
                res.send(datatable);
            }).catch(function (err) {
                res.status(500).send(err);
            })

            // var task: any = {"id":230433882364128,"name":"Online ETL | 作为公司的数据管理员，我希望能够直接将数据传到数据观上进行处理，如过滤、合并等功能，这样我就可以更加方便快速的准备好数据进行分析","subtasks":[{"id":231361626028370,"name":"[8]作为用户，需要能够在数据中心中找到数据加工处理"},{"id":231361626028374,"name":"[18]作为用户，需要能够创建、删除etl"},{"id":230529725054887,"name":"[3]作为用户，需要能够可视的编辑已创建的DataFlow"},{"id":230529725054889,"name":"[5]作为用户，需要能够快速查看DataFlow的输入输出数据"},{"id":230529725054893,"name":"[4]作为用户，需要DataFlow具备 合并 数据的处理能力"},{"id":230529725054895,"name":"[4]作为用户，需要DataFlow具备 关联 数据的处理能力"},{"id":230529725054897,"name":"[16]作为用户，需要DataFlow具备 过滤 数据的处理能力"},{"id":230529725054899,"name":"[24]作为用户，需要DataFlow具备 分组 数据的处理能力"},{"id":230529725054901,"name":"Need column name edit Dataflow action ||作为用户，需要DataFlow具备 改变列名 的处理能力"},{"id":230529725054903,"name":"[Duplicate] 作为用户，需要DataFlow具备 包含指定列 的处理能力"},{"id":230529725054891,"name":"[34]作为用户，需要很容易看到DataFlow的状态"},{"id":230529725054907,"name":"[6]作为用户，希望能够按需要禁用/启用dataflow的运行"},{"id":230529725054909,"name":"Auto update charts when powering data is updated in dataflow || 作为用户，需要在更新数据流输入数据源后，自动更新数据流输出数据创建出的图表\n"}]}
            // asana.taskEntities(task).then(function (result) {
            //     console.log("end");
            //     res.send(result);
            // }).catch(function (err) {
            //     console.log("error");
            //     res.status(500).send(err);
            // })

            // asana.tasksInProject(projectId).then(function (tasks: asanaclient.Resource[]) {
            //     log.log(`fetch tasksInProject end. count:` , tasks.length);
            //     res.send(tasks);
            // }).catch(function (err) {
            //     log.log(`fetch tasksInProject error: ` , err);
            //     res.status(500).send(err);
            // })
        } else {
            res.status(401);
        }
    }
})

router.get("/monitoring" , function (req , res) {
    res.send(progress.all())
})

export = router;