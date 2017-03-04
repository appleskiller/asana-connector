"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DB = (function () {
    function DB(name) {
        this._name = name;
        this._doc = {};
    }
    DB.prototype.get = function (key) {
        return this._doc;
    };
    DB.prototype.set = function (key, value) {
        this._doc[key] = value;
    };
    DB.prototype.del = function (key) {
        delete this._doc[key];
    };
    DB.prototype.exist = function (key) {
        return key in this._doc;
    };
    return DB;
}());
var pool = {};
function getInstance(name) {
    if (!pool[name]) {
        pool[name] = new DB(name);
    }
    return pool[name];
}
exports.getInstance = getInstance;
//# sourceMappingURL=DB.js.map