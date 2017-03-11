"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Promise = require("bluebird");
var Logger = require("../libs/logger");
var progress = require("./progress");
var log = Logger.getLogger("asana2shujuguan");
function any2any(v) {
    return v;
}
function boolean2number(bool) {
    return !!bool ? 1 : 0;
}
function date2number(date) {
    return date ? (new Date(date)).getTime() : null;
}
function obj2id(obj) {
    return obj ? obj.id : null;
}
function obj2name(obj) {
    return obj ? obj.name : null;
}
function array2id(obj) {
    if (!obj || !obj.length) {
        return "";
    }
    var ids = [];
    for (var i = 0; i < obj.length; i++) {
        ids.push(obj[i].id);
    }
    return ids.join(",");
}
function array2name(obj) {
    if (!obj || !obj.length) {
        return "";
    }
    var names = [];
    for (var i = 0; i < obj.length; i++) {
        names.push(obj[i].name);
    }
    return names.join(",");
}
function array2count(obj) {
    return (obj && obj.length) ? obj.length : 0;
}
function fillnow() {
    return (new Date()).getTime();
}
function fillnull() {
    return null;
}
function subtasks2count(tasks) {
    return tasks ? tasks.length : 0;
}
function subtasks2completed(tasks) {
    var ret = 0;
    for (var i = 0; i < tasks.length; i++) {
        tasks[i] && tasks[i].completed && (ret++);
    }
    return ret;
}
var taskTableHeader = [
    { property: "id", name: "id", dataType: "INTEGER", columnType: "INTEGER", valueConverter: any2any },
    { property: null, name: "_upload_at_", dataType: "INTEGER", columnType: "INTEGER", valueConverter: fillnow },
    { property: "name", name: "name", dataType: "STRING", columnType: "TEXT", valueConverter: any2any },
    { property: "notes", name: "notes", dataType: "STRING", columnType: "TEXT", valueConverter: any2any },
    { property: "workspace", name: "workspace", dataType: "STRING", columnType: "TEXT", valueConverter: obj2name },
    { property: "workspace", name: "workspace_id", dataType: "INTEGER", columnType: "INTEGER", valueConverter: obj2id },
    { property: "num_hearts", name: "num_hearts", dataType: "INTEGER", columnType: "INTEGER", valueConverter: any2any },
    { property: "parent", name: "parent", dataType: "STRING", columnType: "TEXT", valueConverter: obj2name },
    { property: "parent", name: "parent_id", dataType: "INTEGER", columnType: "INTEGER", valueConverter: obj2id },
    { property: "projects", name: "projects", dataType: "STRING", columnType: "TEXT", valueConverter: array2name },
    { property: "projects", name: "projects_id", dataType: "STRING", columnType: "TEXT", valueConverter: array2id },
    { property: "projects", name: "projects_count", dataType: "INTEGER", columnType: "INTEGER", valueConverter: array2count },
    { property: "assignee", name: "assignee", dataType: "STRING", columnType: "TEXT", valueConverter: obj2name },
    { property: "assignee", name: "assignee_id", dataType: "INTEGER", columnType: "INTEGER", valueConverter: obj2id },
    { property: "assignee_status", name: "assignee_status", dataType: "STRING", columnType: "TEXT", valueConverter: any2any },
    { property: "completed", name: "completed", dataType: "INTEGER", columnType: "INTEGER", valueConverter: boolean2number },
    { property: "completed_at", name: "completed_at", dataType: "STRING", columnType: "TEXT", valueConverter: any2any },
    { property: "created_at", name: "created_at", dataType: "DATE", columnType: "DATETIME", valueConverter: date2number },
    { property: "modified_at", name: "modified_at", dataType: "DATE", columnType: "DATETIME", valueConverter: date2number },
    { property: "due_at", name: "due_at", dataType: "DATE", columnType: "DATETIME", valueConverter: date2number },
    { property: "due_on", name: "due_on", dataType: "DATE", columnType: "DATETIME", valueConverter: date2number },
    { property: "followers", name: "followers", dataType: "STRING", columnType: "TEXT", valueConverter: array2name },
    { property: "followers", name: "followers_id", dataType: "STRING", columnType: "TEXT", valueConverter: array2id },
    { property: "followers", name: "followers_count", dataType: "INTEGER", columnType: "INTEGER", valueConverter: array2count },
    { property: "hearted", name: "hearted", dataType: "INTEGER", columnType: "INTEGER", valueConverter: boolean2number },
    { property: "hearts", name: "hearts", dataType: "STRING", columnType: "TEXT", valueConverter: array2name },
    { property: "hearts", name: "hearts_id", dataType: "STRING", columnType: "TEXT", valueConverter: array2id },
    { property: "hearts", name: "hearts_count", dataType: "INTEGER", columnType: "INTEGER", valueConverter: array2count },
    { property: "tags", name: "tags", dataType: "STRING", columnType: "TEXT", valueConverter: array2name },
    { property: "tags", name: "tags_id", dataType: "STRING", columnType: "TEXT", valueConverter: array2id },
    { property: "tags", name: "tags_count", dataType: "INTEGER", columnType: "INTEGER", valueConverter: array2count },
    { property: "subtasks", name: "subtasks_count", dataType: "INTEGER", columnType: "INTEGER", valueConverter: subtasks2count },
    { property: "subtasks", name: "subtasks_completed", dataType: "INTEGER", columnType: "INTEGER", valueConverter: subtasks2completed },
];
function convertFieldType2DataType(type) {
    if (type === "number") {
        return "DOUBLE";
    }
    else if (type === "date") {
        return "DATE";
    }
    else {
        return "STRING";
    }
}
function convertFieldType2ColumnType(type) {
    if (type === "number") {
        return "DECIMAL";
    }
    else if (type === "date") {
        return "DATETIME";
    }
    else {
        return "TEXT";
    }
}
function createTaskTableByProject(project) {
    var columns = [];
    for (var i = 0; i < taskTableHeader.length; i++) {
        var item = taskTableHeader[i];
        columns.push({
            name: item.name,
            dataType: item.dataType,
            columnType: item.columnType,
            length: -1
        });
    }
    if (project.custom_field_settings && project.custom_field_settings.length) {
        for (var j = 0; j < project.custom_field_settings.length; j++) {
            var element = project.custom_field_settings[j];
            columns.push({
                name: "field_" + element.custom_field.name,
                dataType: convertFieldType2DataType(element.custom_field.type),
                columnType: convertFieldType2ColumnType(element.custom_field.type),
                length: -1
            });
        }
    }
    var dt = {
        columns: columns,
        name: "Tasks in " + project.name + " - " + project.workspace.name + " - daytoday"
    };
    return dt;
}
function getTaskDataValue(header, task) {
    var property = header.property;
    if (!property || !(property in task)) {
        return header.valueConverter ? header.valueConverter(task) : null;
    }
    else {
        return header.valueConverter ? header.valueConverter(task ? task[property] : null) : null;
    }
}
function getCustomFieldValue(field) {
    if (field.type === "number") {
        return field.number_value;
    }
    else if (field.type === "enum") {
        return field.enum_value ? field.enum_value.name : null;
    }
    else if (field.type === "text") {
        return field.text_value;
    }
    else {
        return null;
    }
}
function appendCustomFieldValue(columns, rowdata, project, task) {
    columns = columns || [];
    rowdata = rowdata || [];
    var map = {};
    if (task.custom_fields && task.custom_fields.length) {
        for (var i = 0; i < task.custom_fields.length; i++) {
            var custom_field = task.custom_fields[i];
            map["field_" + custom_field.name] = custom_field;
        }
    }
    var len = columns.length - rowdata.length;
    for (var i = 0; i < len; i++) {
        var column = columns[i];
        if (column) {
            if (map[column.name]) {
                rowdata.push(getCustomFieldValue(map[column.name]));
            }
            else {
                rowdata.push(null);
            }
        }
    }
}
function uploadTasksTableWithProject(asana, shujuguan, projectId, dtid) {
    dtid = dtid || "__invalid table id__";
    return asana.tasksInProject(projectId).then(function (project) {
        return shujuguan.datatables.findById(dtid).catch(function (err) {
            return Promise.resolve(null);
        }).then(function (datatable) {
            if (!datatable) {
                log.log("datatable[" + dtid + "] not found! creating to shujuguan...");
                return shujuguan.datatables.create(createTaskTableByProject(project)).then(function (datatable) {
                    log.log("created to shujuguan");
                    return Promise.resolve({ project: project, datatable: datatable });
                });
            }
            else {
                return Promise.resolve({ project: project, datatable: datatable });
            }
        });
    }).then(function (result) {
        log.log("ready for upload to shujuguan.");
        var project = result.project;
        var datatable = result.datatable;
        var token = progress.create(project.tasks.length, {
            method: "asanaclient.uploadTasksTableWithProject",
            type: "tasks",
            name: "upload tasks: " + project.name + " => " + datatable.name
        });
        return Promise.each(project.tasks, function (item, index, length) {
            return asana.taskEntities(item).then(function (task) {
                var rowdata = [];
                for (var i = 0; i < taskTableHeader.length; i++) {
                    rowdata.push(getTaskDataValue(taskTableHeader[i], task));
                }
                appendCustomFieldValue(datatable.columns, rowdata, project, task);
                return shujuguan.datatables.append(datatable.id, [rowdata]).then(function () {
                    token.loaded++;
                    token.current = task.name;
                    log.log("uploadTasksTableWithProject.append rowdata - ", token.loaded);
                });
            }).catch(function ignore(err) {
                log.log("uploadTasksTableWithProject error", err);
                token.loaded++;
                token.error++;
            });
        }).then(function () {
            log.log("commit to shujuguan...");
            return shujuguan.datatables.commit(datatable.id);
        }).then(function () {
            log.log("commited!");
            progress.end(token.id);
            return Promise.resolve();
        }).catch(function (err) {
            log.log("commit to shujuguan failed ! dt:" + datatable.id);
            progress.end(token.id);
            return Promise.reject(err);
        });
    });
}
exports.uploadTasksTableWithProject = uploadTasksTableWithProject;
//# sourceMappingURL=asana2shujuguan.js.map