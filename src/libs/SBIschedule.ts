import * as fs from "fs";
import * as Promise from 'bluebird';
import * as progress from "./progress";
import * as Logger from "./logger";
import * as asanaclient from "./asanaclient";
import * as shujuguanclient from "./shujuguanclient";
import * as asana2shujuguan from "./asana2shujuguan";
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
	} catch (err) {
		return null;
	}
}

export function start() {
	var schedule = readScheduleJson();
	if (!schedule) {
		log.log(`SBI schedule load error ! retry 60s later.`);
		setTimeout(start , 60000);
	} else {
		var asana = asanaclient.create(config.asana.access_token);
		var shujuguan = shujuguanclient.create();
		asana2shujuguan.uploadTasksTableWithProject(asana , shujuguan , schedule.projectId , true).then(function () {
			log.log(`SBI schedule task completed. check update ${schedule.checkPeriod}ms later`);
			setTimeout(start , schedule.checkPeriod);
		}).catch(function (err) {
			log.log(`SBI schedule task error - ${err.message}. retry ${schedule.retryDelay}ms later`);
			setTimeout(start , schedule.retryDelay);
		})
	}
}