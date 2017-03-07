"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Asana = require("asana");
var Promise = require("bluebird");
var config = require("../../config/server.json");
var clientId = config.asana.clientId;
var clientSecret = config.asana.clientSecret;
var port = process.env['PORT'] || 18081;
var LIMIT = 100;
function fetchList(dispatcher, params, list) {
    list = list || [];
    params = params || {};
    params.limit = params.limit || LIMIT;
    return new Promise(function (resolve, reject) {
        dispatcher.findAll(params).then(function (result) {
            list = list.concat(result.data || []);
            if (result["next_page"] && result["next_page"]["offset"]) {
                params.offset = result["next_page"]["offset"];
                fetchList(dispatcher, params, list).then(function (result) {
                    resolve(list);
                }, function (err) {
                    reject(err);
                });
            }
            else {
                resolve(list);
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
            clientSecret: clientSecret
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
                var promises = [], projects = [];
                for (var i = 0; i < workspaces.length; i++) {
                    promises.push(fetchList(client[metaType], { workspace: workspaces[i] }).then(function (result) {
                        projects = projects.concat(result);
                    }));
                }
                Promise.all(promises).then(function () {
                    resolve(projects);
                }, reject);
            }
        });
    };
    return AsanaClient;
}());
function create(credentials) {
    return new AsanaClient(credentials);
}
exports.create = create;
//# sourceMappingURL=asanaclient.js.map