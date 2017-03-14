"use strict";
var Asana = require("asana");
var Promise = require("bluebird");
var progress = require("./progress");
var Logger = require("./logger");
var log = Logger.getLogger("asanaclient");
var config = require("../../config/server.json");
var clientId = config.asana.clientId;
var clientSecret = config.asana.clientSecret;
var redirectUri = config.asana.redirectUri;
var port = process.env['PORT'] || 18081;
function fetchList(dispatcher, params, finalResult) {
    finalResult = finalResult || { list: [] };
    params = params || {};
    return new Promise(function (resolve, reject) {
        dispatcher.findAll(params).then(function (result) {
            finalResult.list = finalResult.list.concat(result.data || []);
            if (result._response && result._response.next_page && result._response.next_page.offset) {
                params.offset = result._response.next_page.offset;
                fetchList(dispatcher, params, finalResult).then(function () {
                    resolve(finalResult.list);
                }, function (err) {
                    reject(err);
                });
            }
            else {
                resolve(finalResult.list);
            }
        }, function (err) {
            reject(err);
        });
    });
}
function fetchListById(dispatcher, method, id, params, finalResult) {
    finalResult = finalResult || { list: [] };
    params = params || {};
    return new Promise(function (resolve, reject) {
        dispatcher[method](id, params).then(function (result) {
            finalResult.list = finalResult.list.concat(result.data || []);
            if (result._response && result._response.next_page && result._response.next_page.offset) {
                params.offset = result._response.next_page.offset;
                fetchListById(dispatcher, method, id, params, finalResult).then(function () {
                    resolve(finalResult.list);
                }, function (err) {
                    reject(err);
                });
            }
            else {
                resolve(finalResult.list);
            }
        }, function (err) {
            reject(err);
        });
    });
}
var AsanaClient = (function () {
    function AsanaClient(credentials) {
        var client = Asana.Client.create({
            clientId: clientId,
            clientSecret: clientSecret,
            redirectUri: redirectUri
        });
        credentials && client.useOauth({ credentials: credentials });
        this._nativeClient = client;
    }
    AsanaClient.prototype.nativeClient = function () {
        return this._nativeClient;
    };
    AsanaClient.prototype.workspaces = function () {
        return fetchList(this._nativeClient.workspaces);
    };
    AsanaClient.prototype.metadatas = function (metaType, workspaces) {
        var client = this._nativeClient;
        return new Promise(function (resolve, reject) {
            if (!client[metaType]) {
                return reject(new Error("metaType invalid : " + metaType));
            }
            else {
                var token = progress.create(workspaces.length, {
                    method: 'asanaclient.metadatas',
                    type: metaType,
                    name: 'asanaclient.metadatas.' + metaType
                });
                var metas = [];
                Promise.map(workspaces, function (id, index, length) {
                    return fetchList(client[metaType], { workspace: workspaces[index].id }).then(function (results) {
                        token.loaded++;
                        token.current = workspaces[index].name;
                        metas = metas.concat(results);
                    }).catch(function ignore(err) {
                        log.log("metadatas - ignore error: ", err);
                        token.loaded++;
                        token.error++;
                    });
                }, {
                    concurrency: 1
                }).then(function () {
                    progress.end(token.id);
                    resolve(metas);
                }).catch(function (err) {
                    progress.end(token.id);
                    return Promise.reject(err);
                });
            }
        });
    };
    AsanaClient.prototype.entities = function (resType, ids) {
        var client = this._nativeClient;
        if (!client[resType]) {
            return Promise.reject(new Error("resType invalid : " + resType));
        }
        else {
            var token = progress.create(ids.length, {
                method: 'asanaclient.entities',
                type: resType,
                name: 'asanaclient.entities.' + resType
            });
            return Promise.map(ids, function (id, index, length) {
                return client[resType].findById(id).then(function (result) {
                    token.loaded++;
                    token.current = result.name;
                    return Promise.resolve(result);
                }).catch(function ignore(err) {
                    token.loaded++;
                    token.error++;
                    log.log("asanaclient.entities error:", err);
                });
            }, {
                concurrency: 1,
            });
        }
    };
    AsanaClient.prototype.progressEntities = function (resType, ids, processor) {
        var dispatcher = this._nativeClient[resType];
        var token = progress.create(ids.length, {
            method: 'asanaclient.progressEntities',
            type: resType,
            name: 'asanaclient.progressEntities'
        });
        return new Promise(function (resolve, reject) {
            Promise.map(ids, function (id, index, length) {
                return dispatcher.findById(id).then(function (res) {
                    token.loaded++;
                    token.current = res.name;
                    return processor(res);
                }).catch(function ignore(err) {
                    log.log("progressEntities - ignore error:", err);
                    token.loaded++;
                    token.error++;
                });
            }, {
                concurrency: 1
            }).then(function (results) {
                progress.end(token.id);
                resolve(results);
            }).catch(function (err) {
                progress.end(token.id);
                return Promise.reject(err);
            });
        });
    };
    AsanaClient.prototype.teams = function (workspaces) {
        var client = this._nativeClient;
        return new Promise(function (resolve, reject) {
            var promises = [];
            for (var i = 0; i < workspaces.length; i++) {
                promises.push(client.teams.findByOrganization(workspaces[i].id));
            }
            Promise.all(promises).then(function (results) {
                var ret = [];
                for (var i = 0; i < results.length; i++) {
                    ret = ret.concat(results[i].data || []);
                }
                resolve(ret);
            }, reject);
        });
    };
    AsanaClient.prototype.tasksInProject = function (projectId, subtaskParams) {
        var client = this._nativeClient;
        var token = progress.create(1, {
            method: "asanaclient.tasksInProject",
            type: "tasks",
            name: "fetch project: " + projectId
        });
        return client.projects.findById(projectId).then(function (project) {
            return fetchListById(client.projects, "tasks", projectId).then(function (tasks) {
                token.info.id = project.id;
                token.info.name = "fetch project tasks: " + project.name;
                token.total = tasks.length;
                project.tasks = [];
                return Promise.map(tasks, function (task, index, length) {
                    log.log("tasksInProject[" + token.loaded + "/" + token.total + "] - fetch task [" + task.name + "]");
                    return Promise.delay(1000).then(function () {
                        return client.tasks.findById(task.id).catch(function (err) {
                            log.log("tasksInProject - retry fetch task [" + task.id + "]");
                            return client.tasks.findById(task.id).catch(function (err) {
                                log.log("tasksInProject - fetch task [" + task.id + "] " + task.name + " error:", err);
                                return Promise.reject(err);
                            });
                        }).then(function (task) {
                            project.tasks.push(task);
                            log.log("tasksInProject[" + token.loaded + "/" + token.total + "] - fetch subtask of [" + task.name + "]");
                            return fetchListById(client.tasks, "subtasks", task.id, subtaskParams).catch(function (err) {
                                log.log("tasksInProject - retry fetch subtasks with [" + task.id + "]");
                                return fetchListById(client.tasks, "subtasks", task.id, subtaskParams).catch(function (err) {
                                    log.log("tasksInProject - fetch subtasks with [" + task.id + "] " + task.name + " error:", err);
                                    return Promise.reject(err);
                                });
                            }).then(function (subtasks) {
                                task.subtasks = subtasks;
                                token.loaded++;
                                token.current = task.name;
                            });
                        });
                    });
                }, {
                    concurrency: 1
                }).then(function () {
                    progress.end(token.id);
                    return Promise.resolve(project);
                });
            });
        }).catch(function (err) {
            log.log("tasksInProject error:", err);
            progress.end(token.id);
            return Promise.reject(err);
        });
    };
    return AsanaClient;
}());
exports.AsanaClient = AsanaClient;
function create(credentials) {
    return new AsanaClient(credentials);
}
exports.create = create;
//# sourceMappingURL=asanaclient.js.map