"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("request");
var Logger = require("./logger");
var cache = require("./cache");
var asanaclient = require("./asanaclient");
var storage = cache.createInstance("asana");
var log = Logger.getLogger("autooauth");
var requesting = false;
function oauth() {
    if (requesting) {
        return;
    }
    log.log("authorize Asana");
    requesting = true;
    request({
        method: "GET",
        url: asanaclient.create().nativeClient().app.asanaAuthorizeUrl()
    }, function (err, res, payload) {
        if (err || res.statusCode !== 200) {
            log.log("authorize Asana request error - " + err);
            setTimeout(oauth, 1000);
        }
        else {
            log.log("authorize Asana request end - " + payload);
            setTimeout(checkuser, 1000);
        }
    });
}
var pendingCallbacks = [];
function checkuser() {
    log.log("checkuser");
    var asanauser = storage.get("asanauser");
    if (asanauser) {
        for (var i = 0; i < pendingCallbacks.length; i++) {
            pendingCallbacks[i] && pendingCallbacks[i](asanauser);
        }
        requesting = false;
        pendingCallbacks = [];
    }
    else {
        setTimeout(checkuser, 1000);
    }
}
function getUser(cb) {
    var asanauser = storage.get("asanauser");
    if (asanauser) {
        cb && cb(asanauser);
    }
    else {
        pendingCallbacks.push(cb);
        if (!requesting) {
            oauth();
        }
    }
}
exports.getUser = getUser;
//# sourceMappingURL=autooauth.js.map