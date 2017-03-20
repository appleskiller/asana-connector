import * as fs from "fs";
import * as Promise from 'bluebird';
import * as progress from "./progress";
import * as Logger from "./logger";
import * as asanaclient from "./asanaclient";
import * as shujuguanclient from "./shujuguanclient";
import * as asana2shujuguan from "./asana2shujuguan";
import * as cache from "./cache";

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
	} catch (err) {
		return null;
	}
}

function nextUpdateInterval(schedule): number {
	var daytodayTime = (schedule && schedule.daytodayTime) ? schedule.daytodayTime : "17:00";
	var times = daytodayTime.split(":");
	var hours = parseInt(times[0]);
	var minutes = parseInt(times[1]);
	hours = !isNaN(hours) ? hours : 17;
	minutes = !isNaN(minutes) ? minutes : 0;
	var d1 = new Date();
	var d2 = new Date();
	d2.setHours(hours);
	d2.setMinutes(minutes);
	d2.setDate(d1.getDate() + 1);
	return d2.getTime() - d1.getTime();
}

var timeID;
function laterStart(delay) {
	clearTimeout(timeID);
	timeID = setTimeout(start , delay);
}
export function start() {
	var schedule = readScheduleJson();
	if (!schedule) {
		log.log(`SBI schedule load error ! retry 60s later.`);
		laterStart(60000);
	} else {
		if (!config.asana.credentials) {
			return;
		}
		var asana = asanaclient.create(config.asana.credentials);
		var shujuguan = shujuguanclient.create();
		log.log(`login...`);
		asana.me().then(function (me) {
			log.log(`user login: ${me.name}`);
			storage.set("asanauser" , {
				user: me ,
				token: config.asana.credentials
			});
			asana2shujuguan.uploadTasksTableWithProject(asana , shujuguan , schedule.projectId , true).then(function () {
				var nextInterval = nextUpdateInterval(schedule);
				log.log(`SBI schedule task completed. check update ${nextInterval}ms later`);
				laterStart(nextInterval);
			}).catch(function (err) {
				log.log(`SBI schedule task error - ${err.message}. retry ${schedule.retryDelay}ms later`);
				laterStart(schedule.retryDelay);
			})
		}).catch(function (err) {
			// 刷新token
			log.log(`user login error: ${err.message}`);
			log.log(`refresh user token!`);
			asana.refreshToken(config.asana.credentials.refresh_token).then(function (credentials) {
				log.log(`user token refreshed!`);
				config.asana.credentials = credentials;
				// write file;
				fs.writeFileSync("./config/server.json", JSON.stringify(config) , "utf-8");
				laterStart(1000);
			}).catch(function (err) {
				log.log(`refresh user token error: ${err.message}! retry after 1000ms`);
			})
		})
	}
}