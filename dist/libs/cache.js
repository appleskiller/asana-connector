"use strict";
var Cache = (function () {
    function Cache(name) {
        this._name = name;
        this._doc = {};
    }
    Cache.prototype.get = function (key) {
        return this._doc[key];
    };
    Cache.prototype.set = function (key, value) {
        this._doc[key] = value;
    };
    Cache.prototype.del = function (key) {
        delete this._doc[key];
    };
    Cache.prototype.exist = function (key) {
        return key in this._doc;
    };
    return Cache;
}());
var pool = {};
function createInstance(name) {
    if (!pool[name]) {
        pool[name] = new Cache(name);
    }
    return pool[name];
}
exports.createInstance = createInstance;
//# sourceMappingURL=cache.js.map