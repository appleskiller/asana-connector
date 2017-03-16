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
        if (!config.asana.credentials) {
            return;
        }
        var asana = asanaclient.create(config.asana.credentials);
        var shujuguan = shujuguanclient.create();
        log.log("login...");
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
            log.log("refresh user token!");
            asana.refreshToken(config.asana.credentials.refresh_token).then(function (credentials) {
                log.log("user token refreshed!");
                config.asana.credentials = credentials;
                fs.writeFileSync("./config/server.json", JSON.stringify(config), "utf-8");
                setTimeout(start, 1000);
            }).catch(function (err) {
                log.log("refresh user token error: " + err.message + "! retry after 1000ms");
            });
        });
    }
}
exports.start = start;
//# sourceMappingURL=SBIschedule.js.map