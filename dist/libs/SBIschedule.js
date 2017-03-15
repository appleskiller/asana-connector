"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var Logger = require("./logger");
var asanaclient = require("./asanaclient");
var shujuguanclient = require("./shujuguanclient");
var asana2shujuguan = require("./asana2shujuguan");
var cache = require("./cache");
var storage = cache.createInstance("asana");
var log = Logger.getLogger("scheduleSBI");
var config = require("../../config/server.json");
var clientId = config.asana.clientId;
var clientSecret = config.asana.clientSecret;
var redirectUri = config.asana.redirectUri;
function readScheduleJson() {
    var json;
    try {
        var content = fs.readFileSync("./schedule/SBI.json", "utf-8");
        return JSON.parse(content);
    }
    catch (err) {
        return null;
    }
}
function start() {
    var schedule = readScheduleJson();
    if (!schedule) {
        log.log("SBI schedule load error ! retry 60s later.");
        setTimeout(start, 60000);
    }
    else {
        var asana = asanaclient.create(config.asana.credentials);
        var shujuguan = shujuguanclient.create();
        asana.me().then(function (me) {
            log.log("user login: " + me.name);
            storage.set("asanauser", {
                user: me,
                token: config.asana.credentials
            });
            asana2shujuguan.uploadTasksTableWithProject(asana, shujuguan, schedule.projectId, true).then(function () {
                log.log("SBI schedule task completed. check update " + schedule.checkPeriod + "ms later");
                setTimeout(start, schedule.checkPeriod);
            }).catch(function (err) {
                log.log("SBI schedule task error - " + err.message + ". retry " + schedule.retryDelay + "ms later");
                setTimeout(start, schedule.retryDelay);
            });
        }).catch(function (err) {
            log.log("user login error: " + err.message);
        });
    }
}
exports.start = start;
//# sourceMappingURL=SBIschedule.js.map