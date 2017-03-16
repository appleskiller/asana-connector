"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var limit = 10;
var history = [];
var Logger = (function () {
    function Logger(name) {
        this._name = name;
    }
    Logger.prototype.log = function () {
        var msgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            msgs[_i] = arguments[_i];
        }
        var msg = "[" + (new Date()).toLocaleString() + "] [" + this._name + "] : " + msgs.join(" ");
        console.log(msg);
        history.unshift(msg);
        if (history.length > limit) {
            history.length = limit;
        }
        fs.appendFileSync("./out.log", msg + "\r\n", "utf8");
    };
    return Logger;
}());
var loggers = {};
function getLogger(name) {
    name = name || "console";
    if (!loggers[name]) {
        loggers[name] = new Logger(name);
    }
    return loggers[name];
}
exports.getLogger = getLogger;
function getHistory() {
    return history;
}
exports.getHistory = getHistory;
//# sourceMappingURL=logger.js.map