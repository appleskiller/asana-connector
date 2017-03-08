"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Asana = require("asana");
var Promise = require("bluebird");
var config = require("../../config/server.json");
var clientId = config.asana.clientId;
var clientSecret = config.asana.clientSecret;
var redirectUri = config.asana.redirectUri;
var port = process.env['PORT'] || 18081;
var LIMIT = 100;
function fetchList(dispatcher, params, finalResult) {
    finalResult = finalResult || { list: [] };
    params = params || {};
    params.limit = params.limit || LIMIT;
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
                var promises = [];
                for (var i = 0; i < workspaces.length; i++) {
                    promises.push(fetchList(client[metaType], { workspace: workspaces[i].id }));
                }
                Promise.all(promises).then(function (resources) {
                    resolve([].concat.apply([], resources));
                }, reject);
            }
        });
    };
    AsanaClient.prototype.entities = function (resType, ids) {
        var client = this._nativeClient;
        return new Promise(function (resolve, reject) {
            if (!client[resType]) {
                return reject(new Error("resType invalid : " + resType));
            }
            else {
                var promises = [];
                for (var i = 0; i < ids.length; i++) {
                    promises.push(client[resType].findById(ids[i]));
                }
                Promise.all(promises).then(function (entities) {
                    resolve(entities);
                }, reject);
            }
        });
    };
    AsanaClient.prototype.progressEntities = function (resType, ids, processor) {
        var dispatcher = this._nativeClient[resType];
        var progress = { current: 0, total: ids.length, error: 0, currentName: "" };
        Promise.map(ids, function (id, index, length) {
            return dispatcher.findById(id).then(function (res) {
                progress.current++;
                progress.currentName = res.name;
                return processor(res);
            }).catch(function ignore() {
                progress.error++;
            });
        }, {
            concurrency: 10
        });
        return progress;
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
    return AsanaClient;
}());
function create(credentials) {
    return new AsanaClient(credentials);
}
exports.create = create;
//# sourceMappingURL=asanaclient.js.map