"use strict";
var _ = require("lodash");
var tasks = {};
function create(total, taskInfo) {
    if (total === void 0) { total = 0; }
    if (taskInfo === void 0) { taskInfo = { name: 'No name' }; }
    var id = _.uniqueId("progress-");
    var task = {
        id: id,
        current: "",
        error: 0,
        loaded: 0,
        total: total,
        info: taskInfo
    };
    tasks[id] = task;
    return task;
}
exports.create = create;
function end(id, afterTake) {
    if (afterTake === void 0) { afterTake = 3000; }
    tasks[id] && (tasks[id].loaded = tasks[id].total);
    if (afterTake >= 0) {
        setTimeout(function () { delete tasks[id]; }, afterTake);
    }
}
exports.end = end;
function get(id) {
    return tasks[id];
}
exports.get = get;
function take(id) {
    var task = tasks[id];
    delete tasks[id];
    return task;
}
exports.take = take;
function all() {
    return tasks;
}
exports.all = all;
//# sourceMappingURL=progress.js.map