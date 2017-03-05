"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Logger = (function () {
    function Logger(name) {
        this._name = name;
    }
    Logger.prototype.log = function () {
        var msgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            msgs[_i] = arguments[_i];
        }
        console.log("[" + (new Date()).toLocaleString() + "] [" + this._name + "] : " + msgs.join(" "));
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
//# sourceMappingURL=logger.js.map